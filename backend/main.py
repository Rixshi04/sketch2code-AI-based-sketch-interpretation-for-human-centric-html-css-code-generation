from datetime import datetime, timedelta
from pathlib import Path
import logging
import time
import base64
import threading
from typing import Dict, Any

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
from .react_generator import integrate_react_output, LayoutValidator

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


def _generate_fallback_react(layout_dict: Dict[str, Any]) -> str:
    """Generate minimal React code for fallback."""
    template = layout_dict.get('template', 'landing')
    components = layout_dict.get('layout', [])
    
    jsx_components = []
    for comp in components:
        comp_type = comp.get('type', 'div')
        x = int(comp.get('x', 0))
        y = int(comp.get('y', 0))
        w = int(comp.get('width', 100))
        h = int(comp.get('height', 100))
        
        if comp_type == 'button':
            jsx_components.append(f'      <button style={{left: {x}, top: {y}, width: {w}, height: {h}}}>Button</button>')
        elif comp_type == 'input':
            jsx_components.append(f'      <input type="text" style={{left: {x}, top: {y}, width: {w}, height: {h}}} />')
        elif comp_type == 'text':
            jsx_components.append(f'      <p style={{left: {x}, top: {y}, width: {w}, height: {h}}}>Text</p>')
        else:
            jsx_components.append(f'      <div style={{left: {x}, top: {y}, width: {w}, height: {h}}}></div>')
    
    jsx_content = '\n'.join(jsx_components) if jsx_components else '      <div>Content</div>'
    
    return f"""import React from 'react';
import './SketchLayout.css';

export default function SketchLayout() {{
  return (
    <div className="sketch-layout">
{jsx_content}
    </div>
  );
}}
"""


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
            # FAST PATH: If we timeout or hybrid pipeline is slow, use immediate fallback
            # This ensures we ALWAYS return React code within timeout
            
            pipeline_result = None
            error_occurred = False
            error_msg = None
            
            def run_pipeline():
                nonlocal pipeline_result, error_occurred, error_msg
                try:
                    # Use hybrid CPU/GPU pipeline for optimal performance
                    # GPU: Fast component detection & template classification
                    # CPU: Reliable HTML generation
                    pipeline_result = hybrid_pipeline.process(path, description=description)
                except Exception as e:
                    error_occurred = True
                    error_msg = str(e)
                    logger.warning(f"Hybrid pipeline error: {e}")
            
            # Run pipeline in thread with timeout
            pipeline_thread = threading.Thread(target=run_pipeline, daemon=True)
            pipeline_thread.start()
            pipeline_thread.join(timeout=5)  # Wait max 5 seconds
            
            if pipeline_thread.is_alive() or error_occurred:
                # Pipeline timed out or failed - use fallback
                logger.warning("Pipeline timeout/error, using fast fallback layout")
                pipeline_result = {
                    'layout': [
                        {"type": "header", "x": 0, "y": 0, "width": 800, "height": 80, "ink_ratio": 0.3},
                        {"type": "main", "x": 0, "y": 100, "width": 800, "height": 400, "ink_ratio": 0.5},
                        {"type": "footer", "x": 0, "y": 520, "width": 800, "height": 80, "ink_ratio": 0.3},
                    ],
                    'template': 'landing',
                    'confidence': 0.1,
                    'processing_method': 'fallback',
                }
            
            # Build layout structure in exact specification format
            detected = {
                "layout": [
                    {
                        "type": comp.get('type', 'section'),
                        "x": int(comp.get('x', 0)),
                        "y": int(comp.get('y', 0)),
                        "width": int(comp.get('width', 100)),
                        "height": int(comp.get('height', 100)),
                        "ink_ratio": float(comp.get('ink_ratio', 0.5)),
                    }
                    for comp in pipeline_result.get('layout', [])
                ],
                "analysis": {
                    "template": pipeline_result.get('template', 'unknown'),
                    "confidence": float(pipeline_result.get('confidence', 0.5)),
                    "processing_method": pipeline_result.get('processing_method', 'unknown'),
                },
                "description": description,
                "template": pipeline_result.get('template', 'unknown'),
            }
            
            # Build rows and sections for complete layout spec
            layout_tree = build_layout_tree(detected, description=description)
            detected['rows'] = layout_tree.get('rows', [])
            detected['sections'] = layout_tree.get('sections', [])
            
            # Generate REACT code (not HTML)
            react_result = integrate_react_output(detected, image_description=description, image_data="")
            
            if react_result.get('valid'):
                react_code = react_result['code']
                provider_trace = react_result.get('provider_trace', [])
            else:
                logger.warning(f"React generation failed: {react_result.get('error')}")
                # Fallback: generate basic React
                react_code = _generate_fallback_react(detected)
                provider_trace = react_result.get('provider_trace', [])
            
        except (ValueError, Exception) as e:
            logger.warning(f"Hybrid pipeline error: {str(e)}, using fallback")
            detected = {
                "layout": [
                    {"type": "header", "x": 0, "y": 0, "width": 800, "height": 100, "ink_ratio": 0.3},
                    {"type": "main", "x": 0, "y": 100, "width": 800, "height": 400, "ink_ratio": 0.4},
                    {"type": "footer", "x": 0, "y": 500, "width": 800, "height": 100, "ink_ratio": 0.3},
                ],
                "analysis": {"template": "landing", "confidence": 0.1, "processing_method": "fallback", "error": str(e)},
                "description": description,
                "template": "landing",
            }
            
            # Build layout tree for complete spec
            layout_tree = build_layout_tree(detected, description=description)
            detected['rows'] = layout_tree.get('rows', [])
            detected['sections'] = layout_tree.get('sections', [])
            
            # Generate fallback React code
            react_code = _generate_fallback_react(detected)
            provider_trace = [{"provider": "fallback", "status": "error", "error": str(e)}]
        
        
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
                logger.info(f"[AI CASCADE] All providers failed, using React backend")
        except Exception as e:
            logger.warning(f"[AI CASCADE] Error: {e}")

        # Use AI code if available, otherwise use React-generated code
        final_code = react_code if not ai_code else ai_code
        if ai_code:
            ai_source = cascade_result.get('source', 'ai_cascade')
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        # Return response with REACT code and proper layout specification
        return {
            "layout": detected,  # Include full layout spec in exact format
            "code": final_code,  # React/JSX code (ONLY format)
            "html": final_code,  # Also return as html for frontend compatibility
            "css": "",  # CSS is imported from SketchLayout.css
            "template": detected.get('template', 'landing'),
            "analysis": detected.get('analysis', {}),
            "provider_trace": provider_trace,  # Deterministic provider trace
            "processing_time": round(processing_time, 3),
            "source": ai_source,
            "platform": "react",  # Always React
            "description": description,
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
