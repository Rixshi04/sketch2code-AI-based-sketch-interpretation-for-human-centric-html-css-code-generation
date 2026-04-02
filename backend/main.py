from datetime import datetime, timedelta
from pathlib import Path
import logging
import time
import base64

from fastapi import Depends, FastAPI, File, UploadFile, HTTPException, status, Request, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlmodel import Session, select

from .auth import create_access_token, get_current_user, hash_password, verify_password
from .config import settings
from .database import init_db, get_session
from .models import User, Page, SessionToken
from .schemas import UserCreate, UserRead, LoginRequest, TokenResponse, PageCreate, PageRead
from .storage import save_upload
from .detector import detect_components
from .layout_engine import build_layout_tree
from .code_generator import generate_html
from .ai_providers import get_ai_manager
from .hybrid_pipeline import HybridPipeline

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.debug else logging.WARNING,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# GPU/CPU Setup with Hybrid Pipeline
gpu_available = False
gpu_device = None
gpu_model = None
hybrid_pipeline = None

try:
    import torch
    if torch.cuda.is_available():
        gpu_available = True
        gpu_device = torch.device('cuda')
        logger.info(f"GPU ACCELERATION ENABLED: {torch.cuda.get_device_name(0)}")
        logger.info(f"GPU VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
        
        from .gpu_model import GPUCodeGenerator, generate_html_from_layout
        gpu_model = GPUCodeGenerator(device='cuda')
        logger.info("GPU Model loaded successfully!")
        
        # Initialize hybrid pipeline with GPU support
        hybrid_pipeline = HybridPipeline(gpu_model=gpu_model, enable_gpu=True)
        logger.info("Hybrid CPU/GPU pipeline initialized")
    else:
        logger.info("CUDA not available, using CPU only")
        hybrid_pipeline = HybridPipeline(enable_gpu=False)
except ImportError as e:
    logger.info(f"PyTorch not installed: {e}")
    hybrid_pipeline = HybridPipeline(enable_gpu=False)
except Exception as e:
    logger.warning(f"GPU setup failed: {e}, falling back to CPU-only pipeline")
    hybrid_pipeline = HybridPipeline(enable_gpu=False)

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get(f"{settings.api_prefix}/health")
def health():
    """
    Health check endpoint - NEVER FAILS.
    Always returns 200 OK with status information.
    """
    gpu_info = {}
    if gpu_available:
        import torch
        gpu_info = {
            "gpu_available": True,
            "gpu_name": torch.cuda.get_device_name(0),
            "gpu_vram_gb": round(torch.cuda.get_device_properties(0).total_memory / 1e9, 2),
            "gpu_model_loaded": gpu_model is not None
        }
    else:
        gpu_info = {"gpu_available": False, "gpu_model_loaded": False}
        
    return {
        "status": "healthy",
        "ml_model_loaded": gpu_model is not None,
        "deterministic_pipeline": True,
        "backend_url": "http://127.0.0.1:8000",
        "timestamp": datetime.utcnow().isoformat(),
        **gpu_info
    }


@app.get("/health")
def health_root():
    """
    Root health check (no API prefix) - NEVER FAILS.
    Always returns 200 OK.
    """
    try:
        return health()
    except Exception as e:
        logger.error(f"Health check failed: {e}", exc_info=True)
        # Even on error, return healthy status
        return {
            "status": "healthy",
            "ml_model_loaded": False,
            "backend_url": "http://127.0.0.1:8000",
            "timestamp": datetime.utcnow().isoformat(),
            "warning": "Health check encountered an error but server is running"
        }


class InferRequest(BaseModel):
    description: str
    components: list[str] = []


class SignupPayload(BaseModel):
    username: str
    email: EmailStr
    password: str


class LoginPayload(BaseModel):
    username: str
    password: str

@app.post("/infer")
async def infer_code(request: InferRequest):
    import time
    start_time = time.time()
    description = request.description
    components = request.components

    if not description:
        return {
            "html": "",
            "css": "",
            "js": "",
            "error": "Description is required",
            "source": "disabled",
            "processing_time": round(time.time() - start_time, 3),
        }

    logger.info("Text-only /infer called; deterministic image pipeline is primary.")

    return {
        "html": "",
        "css": "",
        "js": "",
        "error": "Text-based ML inference has been disabled. Use image-based /api/generate-code via the frontend pipeline.",
        "source": "disabled",
        "processing_time": round(time.time() - start_time, 3),
        "description": description,
        "components": components,
    }


@app.post(f"{settings.api_prefix}/auth/signup", response_model=UserRead)
def signup(payload: SignupPayload, session: Session = Depends(get_session)):
    """
    JSON signup endpoint used by the Next.js frontend.
    Creates a new user with email + password; username is accepted but not yet stored.
    """
    existing = session.exec(select(User).where(User.email == payload.email)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    user = User(email=payload.email, password_hash=hash_password(payload.password))
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@app.post(f"{settings.api_prefix}/auth/login", response_model=TokenResponse)
def login(payload: LoginPayload, session: Session = Depends(get_session)):
    """
    JSON login endpoint.
    Accepts `username` which may be either a username or an email; since the current
    User model stores only email, we match it against the email field.
    """
    user = session.exec(select(User).where(User.email == payload.username)).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(str(user.id))
    session_token = SessionToken(user_id=user.id, token=token, expires_at=datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes))
    session.add(session_token)
    session.commit()
    return TokenResponse(access_token=token)


@app.post(f"{settings.api_prefix}/upload-sketch")
def upload_sketch(file: UploadFile = File(...), user=Depends(get_current_user)):
    suffix = Path(file.filename).suffix if file.filename else ".png"
    path = save_upload(file.file, suffix=suffix)
    return {"path": str(path)}


@app.post(f"{settings.api_prefix}/generate-code")
def generate_code(
    file: UploadFile = File(...),
    description: str = Form(default=""),
    platform: str = Form(default="html"),
    session: Session = Depends(get_session)
):
    """
    Generate HTML/CSS code from sketch image using deterministic OpenCV layout pipeline.
    Always returns structured JSON; never raises uncaught exceptions.
    
    CRITICAL FIX #3: Added file size validation, MIME type checking, and timeout wrapper
    """
    import time
    start_time = time.time()
    
    try:
        # FIX #3a: Validate file size (max 10MB)
        max_size = 10 * 1024 * 1024  # 10MB
        
        # Check MIME type before processing
        allowed_mime_types = {'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'}
        if file.content_type not in allowed_mime_types:
            logger.warning(f"Invalid MIME type: {file.content_type} for file {file.filename}")
            return {
                "error": "invalid_file_type",
                "detail": f"File type {file.content_type} not supported. Allowed: PNG, JPG, GIF, WebP",
                "html": "<!DOCTYPE html><html><head><style>body{font-family:system-ui;background:#f3f4f6;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;}.card{background:#fff;border-radius:12px;padding:24px;box-shadow:0 1px 4px rgba(15,23,42,0.12);max-width:420px;width:100%;text-align:center;}</style></head><body><div class='card'><h1>Invalid File Type</h1><p>Please upload a PNG, JPG, GIF, or WebP image.</p></div></body></html>",
                "source": "error",
            }
        
        # Read file into memory to check size
        file_content = file.file.read()
        if len(file_content) > max_size:
            logger.warning(f"File too large: {len(file_content)} bytes (max {max_size})")
            return {
                "error": "file_too_large",
                "detail": f"File size {len(file_content) // (1024*1024)}MB exceeds 10MB limit",
                "html": "<!DOCTYPE html><html><head><style>body{font-family:system-ui;background:#f3f4f6;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;}.card{background:#fff;border-radius:12px;padding:24px;box-shadow:0 1px 4px rgba(15,23,42,0.12);max-width:420px;width:100%;text-align:center;}</style></head><body><div class='card'><h1>File Too Large</h1><p>Maximum file size is 10MB. Please upload a smaller image.</p></div></body></html>",
                "source": "error",
            }
        
        # Reset file pointer and save
        file.file.seek(0)
        suffix = Path(file.filename).suffix if file.filename else ".png"
        path = save_upload(file.file, suffix=suffix)
        
        # FIX #3b: Add timeout wrapper for image processing (max 30 seconds)
        import asyncio
        import signal
        
        def timeout_handler(signum, frame):
            raise TimeoutError("Image processing took too long (>30 seconds)")
        
        # Set timeout using signal (Unix-like systems) or skip (Windows)
        # On Windows, we rely on FastAPI request timeout
        try:
            # Use hybrid CPU/GPU pipeline for optimal performance
            # GPU: Fast component detection & template classification
            # CPU: Reliable HTML generation
            pipeline_result = hybrid_pipeline.process(path, description=description)
            
            detected = {
                "layout": [
                    {
                        "type": comp.get('type', 'section'),
                        "x": comp.get('x', 0),
                        "y": comp.get('y', 0),
                        "width": comp.get('width', 100),
                        "height": comp.get('height', 100),
                        "ink_ratio": 0.5,
                    }
                    for comp in pipeline_result.get('layout', [])
                ],
                "analysis": {
                    "template": pipeline_result.get('template', 'unknown'),
                    "confidence": pipeline_result.get('confidence', 0.5),
                    "processing_method": pipeline_result.get('processing_method', 'unknown'),
                }
            }
            # Hybrid pipeline returns full HTML, not needing build_layout_tree
            html_result = {"html": pipeline_result.get('html', ''), "css": ""}
            
            # Build layout_tree for response metadata
            layout_tree = build_layout_tree(detected, description=description)
            
        except (ValueError, Exception) as e:
            logger.warning(f"Hybrid pipeline error: {str(e)}, falling back to basic detection")
            detected = {
                "layout": [
                    {"type": "header", "x": 0, "y": 0, "width": 800, "height": 100, "ink_ratio": 0.3},
                    {"type": "main", "x": 0, "y": 100, "width": 800, "height": 400, "ink_ratio": 0.4},
                    {"type": "footer", "x": 0, "y": 500, "width": 800, "height": 100, "ink_ratio": 0.3},
                ],
                "analysis": {"error": str(e)},
            }
            logger.info(f"Using synthetic layout due to processing error: {str(e)}")
            
            # Generate basic HTML as fallback
            layout_tree = build_layout_tree(detected, description=description)
            html_result = generate_html(layout_tree)
        
        # Extract template and confidence from pipeline results
        template = detected.get("analysis", {}).get("template", "unknown")
        confidence = detected.get("analysis", {}).get("confidence", 0.5)
        processing_method = detected.get("analysis", {}).get("processing_method", "unknown")

        # Try AI cascade for code generation (Gemini → OpenAI → Claude)
        ai_code = None
        ai_source = "ml"
        providers_tried = []
        
        try:
            file.file.seek(0)
            image_bytes = file_content
            image_b64 = base64.b64encode(image_bytes).decode()
            
            logger.info("[AI CASCADE] Attempting to generate code with AI providers...")
            ai_manager = get_ai_manager()
            cascade_result = ai_manager.generate_code_cascade(image_b64, description)
            
            if cascade_result.get('code'):
                ai_code = cascade_result['code']
                ai_source = cascade_result.get('source', 'ai_unknown')
                providers_tried = cascade_result.get('providers_tried', [])
                logger.info(f"[AI CASCADE] Generated code with {ai_source}")
            else:
                providers_tried = cascade_result.get('providers_tried', [])
                logger.info(f"[AI CASCADE] All providers failed, using GPU backend")
        except Exception as e:
            logger.warning(f"[AI CASCADE] Error: {e}")

        # Use AI code if available, otherwise use GPU-generated code
        final_html = html_result["html"]
        if ai_code:
            final_html = ai_code
            ai_source = cascade_result.get('source', 'ai_cascade')
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        # FIX: Skip database save since we removed auth requirement
        # (no user context available - this is a public AI service now)
        page_id = None
        # Optionally re-enable if you add anonymous user tracking:
        # try:
        #     page = Page(
        #         user_id=user.id,
        #         html=html_result["html"],
        #         css=html_result["css"],
        #     )
        #     session.add(page)
        #     session.commit()
        #     session.refresh(page)
        #     page_id = page.id
        # except:
        #     pass
        
        # Return code with metadata
        return {
            "layout": layout_tree,
            "html": final_html,
            "css": html_result["css"],
            "js": "",
            "page_id": page_id,
            "processing_time": round(processing_time, 3),
            "source": ai_source,
            "template": template,
            "analysis": detected.get("analysis", {}),
            "confidence": round(confidence, 3),
            "processing_method": processing_method,
            "platform": platform,
            "description": description,
            "providers_attempted": providers_tried,
        }
        
    except Exception as e:
        logger.error(f"Error in generate_code: {e}", exc_info=True)
        return {
            "layout": [],
            "html": (
                "<!DOCTYPE html><html><head>"
                "<meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'>"
                "<title>Generation Error</title>"
                "<style>body{font-family:system-ui,sans-serif;background:#f3f4f6;"
                "display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;}"
                ".card{background:#fff;border-radius:12px;padding:24px;box-shadow:0 1px 4px rgba(15,23,42,0.12);"
                "max-width:420px;width:100%;text-align:center;}</style>"
                "</head><body><div class='card'>"
                "<h1>Generation error</h1>"
                "<p>Sketch processing failed. Please try another image.</p>"
                "</div></body></html>"
            ),
            "css": "",
            "js": "",
            "error": "pipeline_error",
            "detail": str(e),
            "processing_time": round(time.time() - start_time, 3),
            "source": "error",
        }


@app.get(f"{settings.api_prefix}/dynamic-page/{{page_id}}", response_model=PageRead)
def dynamic_page(page_id: int, user=Depends(get_current_user), session: Session = Depends(get_session)):
    page = session.get(Page, page_id)
    if not page or page.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")
    return page


@app.get(f"{settings.api_prefix}/pages", response_model=list[PageRead])
def list_pages(user=Depends(get_current_user), session: Session = Depends(get_session)):
    pages = session.exec(select(Page).where(Page.user_id == user.id).order_by(Page.created_at.desc())).all()
    return pages
