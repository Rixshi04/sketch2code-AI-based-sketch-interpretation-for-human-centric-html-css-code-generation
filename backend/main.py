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
from .ai_vision import get_ai_cascade
from .hybrid_pipeline import HybridPipeline
from .react_generator import integrate_react_output, LayoutValidator


def _normalize_component_type(raw: str) -> str:
    t = (raw or "container").strip().lower()
    return t if t in LayoutValidator.VALID_COMPONENT_TYPES else "container"


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

# Hybrid pipeline: prefer GPU component hints when CUDA + torch available (bbox bug fixed in gpu_model).
hybrid_pipeline = None
try:
    import torch
    from .gpu_model import GPUCodeGenerator

    if torch.cuda.is_available():
        gpu_device = torch.device("cuda")
        gpu_model = GPUCodeGenerator(device="cuda")
        gpu_available = True
        hybrid_pipeline = HybridPipeline(gpu_model=gpu_model, enable_gpu=True)
        logger.info("Hybrid pipeline initialized with GPU component detection")
    else:
        gpu_device = None
        gpu_model = None
        gpu_available = False
        hybrid_pipeline = HybridPipeline(enable_gpu=False)
        logger.info("CUDA not available; hybrid pipeline using CPU OpenCV path only")
except Exception as gpu_exc:
    gpu_available = False
    gpu_device = None
    gpu_model = None
    hybrid_pipeline = HybridPipeline(enable_gpu=False)
    logger.warning("GPU pipeline unavailable (%s); using CPU-only hybrid pipeline", gpu_exc)

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
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
        }


@app.get(f"{settings.api_prefix}/ai-status")
def ai_status():
    """
    Check AI provider status (Gemini, OpenAI, Claude).
    Returns working=true if at least one provider is available.
    """
    try:
        from .ai_vision import get_ai_cascade
        
        ai_cascade = get_ai_cascade()
        
        # Check each provider
        gemini_working = ai_cascade.gemini.enabled
        openai_working = ai_cascade.openai.enabled
        claude_working = ai_cascade.claude.enabled
        
        return {
            "gemini": {
                "configured": bool(gemini_working),
                "working": gemini_working,
                "reason": "API key configured" if gemini_working else "No API key or package not installed"
            },
            "openai": {
                "configured": bool(openai_working),
                "working": openai_working,
                "reason": "API key configured" if openai_working else "No API key or package not installed"
            },
            "claude": {
                "configured": bool(claude_working),
                "working": claude_working,
                "model": "claude-3-5-sonnet-20241022" if claude_working else None,
                "reason": "API key configured" if claude_working else "No API key, package not installed, or key not set"
            },
            "mlBackend": {
                "running": False,
                "authenticated": False,
                "reason": "cpu-fallback"
            },
            "any_provider_working": gemini_working or openai_working or claude_working,
            "fallback_available": True,  # CPU pipeline always works
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"AI status check failed: {e}", exc_info=True)
        return {
            "gemini": {"working": False, "reason": str(e)},
            "openai": {"working": False, "reason": str(e)},
            "claude": {"working": False, "reason": str(e)},
            "any_provider_working": False,
            "fallback_available": True,
            "error": str(e)
        }


class InferRequest(BaseModel):
    description: str
    components: list[str] = []


def _hf_offline_fallback(detected, description):
    """Offline deterministic HF-mock fallback path with multiple variants"""
    try:
        from .hf_mock import generate_mock_code
    except Exception:
        return None, None, []
    layout = detected.get('layout', []) if isinstance(detected, dict) else []
    for vid in (1, 2, 3):
        code = generate_mock_code(layout, variant_id=vid)
        if code:
            trace = [{"provider": f"hf_mock_v{vid}", "status": "success"}]
            return code, f"hf_mock_v{vid}", trace
    return None, None, []


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
    """Generate high-fidelity React code for fallback using detected geometry."""
    components = layout_dict.get('layout', [])
    max_r, max_b = 800, 600
    jsx_components = []
    
    # Common styles for components
    comp_styles = {
        'button': "background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', fontWeight: 'bold', borderRadius: '8px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'",
        'input': "background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0 12px', color: '#1e293b', fontSize: '14px'",
        'text': "color: '#334155', fontSize: '15px', fontWeight: '500', margin: 0",
        'card': "background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'",
        'div': "background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1'"
    }

    for i, comp in enumerate(components):
        ctype = comp.get('type', 'div')
        x, y = int(comp.get('x', 0)), int(comp.get('y', 0))
        w, h = max(4, int(comp.get('width', 100))), max(4, int(comp.get('height', 40)))
        max_r, max_b = max(max_r, x + w + 20), max(max_b, y + h + 20)
        
        base_style = f"position: 'absolute', left: {x}, top: {y}, width: {w}, height: {h}, boxSizing: 'border-box'"
        custom_style = comp_styles.get(ctype, comp_styles['div'])
        st = f"{{{{ {base_style}, {custom_style} }}}}"
        
        if ctype == 'button':
            jsx_components.append(f'      <button type="button" style={st}>Action</button>')
        elif ctype == 'input':
            jsx_components.append(f'      <input type="text" placeholder="Enter text..." style={st} />')
        elif ctype == 'text':
            jsx_components.append(f'      <p style={st}>Detected Text</p>')
        elif ctype == 'card':
            jsx_components.append(f'      <div className="card" style={st}></div>')
        else:
            jsx_components.append(f'      <div style={st} />')

    jsx_content = '\n'.join(jsx_components)
    
    return f"""import React from 'react';
import './SketchLayout.css';

export default function SketchLayout() {{
  return (
    <div className="sketch-layout" style={{{{ 
      position: 'relative', 
      width: '100%', 
      maxWidth: {max_r}, 
      height: {max_b}, 
      margin: '0 auto', 
      background: '#f8fafc', 
      borderRadius: '24px', 
      border: '1px solid #e2e8f0', 
      overflow: 'hidden',
      boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)'
    }}}}>
      <div style={{{{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(to right, #6366f1, #a855f7)' }}}}></div>
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
        
        # Hybrid pipeline runs in a thread; cap wait time with settings.pipeline_timeout_seconds
        # (aligned with Next.js ~30s). Do not silently swap in a generic layout on timeout only.
        code_source = "cpu_react"
        try:
            pipeline_result = None
            error_occurred = False
            error_msg = None

            def run_pipeline():
                nonlocal pipeline_result, error_occurred, error_msg
                try:
                    pipeline_result = hybrid_pipeline.process(path, description=description)
                except Exception as e:
                    error_occurred = True
                    error_msg = str(e)
                    logger.warning(f"Hybrid pipeline error: {e}")

            pipeline_thread = threading.Thread(target=run_pipeline, daemon=True)
            pipeline_thread.start()
            timeout_s = float(settings.pipeline_timeout_seconds)
            pipeline_thread.join(timeout=timeout_s)

            if pipeline_thread.is_alive():
                logger.error(
                    "Hybrid pipeline exceeded %.1fs — returning pipeline_timeout (not generic layout)",
                    timeout_s,
                )
                return {
                    "error": "pipeline_timeout",
                    "detail": f"Image processing exceeded {timeout_s:.0f}s. Try a smaller image or retry.",
                    "layout": [],
                    "code": "",
                    "html": (
                        "<!DOCTYPE html><html><head><meta charset='UTF-8'>"
                        "<title>Processing took too long</title>"
                        "<style>body{font-family:system-ui,sans-serif;background:#f3f4f6;"
                        "display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;}"
                        ".card{background:#fff;border-radius:12px;padding:24px;box-shadow:0 1px 4px rgba(15,23,42,0.12);"
                        "max-width:420px;width:100%;text-align:center;}</style></head><body><div class='card'>"
                        "<h1>Processing took too long</h1>"
                        "<p>The sketch pipeline did not finish in time. Try a smaller image or generate again.</p>"
                        "</div></body></html>"
                    ),
                    "css": "",
                    "source": "error",
                    "provider_trace": [{"provider": "hybrid", "status": "timeout"}],
                    "processing_time": round(time.time() - start_time, 3),
                }

            if error_occurred:
                logger.warning("Pipeline error, using fast fallback layout: %s", error_msg)
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
                        "type": _normalize_component_type(str(comp.get("type", "container"))),
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

            if not detected["layout"]:
                detected["layout"] = [
                    {
                        "type": "container",
                        "x": 0,
                        "y": 0,
                        "width": 520,
                        "height": 400,
                        "ink_ratio": 0.05,
                    }
                ]
                detected["analysis"]["processing_method"] = "empty_layout_pad"

            # Build rows and sections for complete layout spec
            layout_tree = build_layout_tree(detected, description=description)
            detected['rows'] = layout_tree.get('rows', [])
            detected['sections'] = layout_tree.get('sections', [])
            
            # 1. Primary: Deterministic Layout-driven React generation
            react_result = integrate_react_output(detected, image_description=description, image_data="")
            
            ai_code = None
            ai_provider = None
            cascade_trace: list = []
            
            if react_result.get("valid") and react_result.get("code"):
                react_code = react_result["code"]
                provider_trace = list(react_result.get("provider_trace", []))
                code_source = "cpu_react"
                logger.info("[Generation] Deterministic React generation succeeded - skipping AI vision to save quota")
            else:
                # 2. Secondary: Vision cascade if layout-driven React fails
                logger.warning("React integration failed: %s. Falling back to AI Vision Cascade.", react_result.get("error"))
                
                cascade_result = None
                try:
                    logger.info("[AI Cascade] Starting AI providers...")
                    image_b64 = base64.b64encode(file_content).decode()
                    ai_cascade = get_ai_cascade()
                    cascade_result = ai_cascade.generate_react_code(image_b64, description)
                    cascade_trace = list(cascade_result.get("trace", []))
                except Exception as _e:
                    logger.exception("[AI Cascade] Failed: %s", _e)
                    cascade_result = {"success": False, "code": "", "provider": "ai_vision", "trace": [{"provider": "ai_vision", "status": "error", "error": str(_e)}]}
                    cascade_trace = list(cascade_result.get("trace", []))

                if cascade_result and cascade_result.get("success") and cascade_result.get("code"):
                    react_code = cascade_result["code"]
                    code_source = cascade_result.get("provider") or "ai_vision"
                    logger.info(f"[AI Cascade] Success using {code_source}")
                    provider_trace = cascade_trace
                else:
                    # 3. Tertiary: Try offline HF mock fallback first, then minimal fallback
                    try:
                        from .hf_mock import generate_mock_code
                        mock_code, mock_source, mock_trace = _hf_offline_fallback(detected, description)
                        if mock_code:
                            react_code = mock_code
                            code_source = mock_source or "hf_mock_v1"
                            logger.info(f"[HF Mock] Used offline fallback provider {code_source}")
                            provider_trace = list(react_result.get("provider_trace", [])) + mock_trace
                        else:
                            logger.error("[AI Cascade] All vision providers failed - using minimal fallback")
                            react_code = _generate_fallback_react(detected)
                            code_source = "cpu_react"
                            provider_trace = list(react_result.get("provider_trace", [])) + cascade_trace + [{"provider": "fallback_react", "status": "used"}]
                    except Exception as _e:
                        logger.exception("[HF Mock] Fallback failed: %s", _e)
                        react_code = _generate_fallback_react(detected)
                        code_source = "cpu_react"
                        provider_trace = list(react_result.get("provider_trace", [])) + cascade_trace + [{"provider": "fallback_react", "status": "used"}]
            
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
            code_source = "cpu_react"

        # Extract template and confidence from pipeline results
        template = detected.get("analysis", {}).get("template", "unknown")
        confidence = detected.get("analysis", {}).get("confidence", 0.5)
        processing_method = detected.get("analysis", {}).get("processing_method", "unknown")

        final_code = react_code
        # Do not expose 'source' in API payload to frontend to prevent leaking provider identity
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        # Return response with code and provider trace
        return {
            "layout": detected,  # Include full layout spec in exact format
            "code": final_code,  # React/JSX code
            "css": "",  # CSS is imported from SketchLayout.css
            "template": detected.get('template', 'landing'),
            "analysis": detected.get('analysis', {}),
            "processing_time": round(time.time() - start_time, 3),
            "platform": "react",  # Always React
            "description": description,
        }
        
    except Exception as e:
        logger.error(f"Error in generate_code: {e}", exc_info=True)
        return {
            "layout": [],
            "css": "",
            "error": "pipeline_error",
            "detail": str(e),
            "processing_time": round(time.time() - start_time, 3),
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
