"""
AI Vision Providers for Sketch-to-Code Generation
Cascade: Gemini Vision → OpenAI GPT-4V → Claude 3 Vision → CPU Fallback
"""

import os
import base64
import logging
from typing import Optional, Dict, Any
import json
from pathlib import Path

# Load environment variables
try:
    from dotenv import load_dotenv
    root = Path(__file__).parent.parent
    for name in (".env", ".env.local"):
        p = root / name
        if p.exists():
            load_dotenv(p, override=(name == ".env.local"))
except ImportError:
    pass

import httpx

logger = logging.getLogger(__name__)


class GeminiVisionProvider:
    """Google Gemini 2.0 Flash Vision API"""
    
    def __init__(self):
        self.enabled = False
        self.client = None
        self._init()
    
    def _init(self):
        """Initialize Gemini Vision"""
        try:
            import google.generativeai as genai
            raw = os.getenv('GEMINI_API_KEY') or os.getenv('GOOGLE_GEMINI_API_KEY')
            api_key = (raw or "").strip().strip('"').strip("'")
            
            if not api_key or 'your_' in api_key.lower():
                logger.info("[Gemini] Disabled - no valid API key")
                return
            
            genai.configure(api_key=api_key)
            self.client = genai
            self.enabled = True
            logger.info("[Gemini] Initialized successfully")
            
        except ImportError:
            logger.warning("[Gemini] google.generativeai not installed")
        except Exception as e:
            logger.warning(f"[Gemini] Init error: {e}")
    
    def generate_react_code(self, image_base64: str, description: str = "") -> Optional[str]:
        """Generate React code from sketch image using Gemini Vision"""
        if not self.enabled:
            return None
        
        try:
            logger.info("[Gemini] Analyzing sketch...")
            
            # Use latest Gemini model (gemini-2.5-flash is newest)
            model = self.client.GenerativeModel('gemini-1.5-flash')
            
            image_data = {
                "mime_type": "image/png",
                "data": image_base64
            }
            
            prompt = f"""You are a senior UI/UX engineer. Analyze this UI sketch/image deeply.
User Intent: {description if description else "UI sketch layout"}

IMAGE ANALYSIS TASKS:
1. Detect ALL visual elements: headers, sidebars, cards, buttons, inputs, icons, and logos.
2. Note the spatial hierarchy: which elements are containers? What is the main content area?
3. Identify visual weight: where are the primary call-to-action buttons?
4. Look for icons/logos: if you see placeholder shapes for logos or icons, generate code for them.

GENERATION REQUIREMENTS:
1. Generate high-fidelity React JSX code using 'import React' and hooks.
2. Use absolute positioning with 'style' attribute on EVERY element to match the sketch EXACTLY.
3. Use modern Tailwind-like styling: rounded-xl, soft shadows, clear typography.
4. Export a default function (e.g., export default function SketchLayout() ...).
5. Import standard styles from './SketchLayout.css'.
6. Add interactive 'useState' hooks for buttons/inputs if appropriate.

Return ONLY the code. No markdown. No explanations."""
            
            response = model.generate_content([prompt, image_data])
            
            if not response or not response.text:
                logger.warning("[Gemini] Empty response")
                return None
            
            code = response.text.strip()
            
            # Ensure it's React code
            if 'import React' not in code and 'import' not in code.split('\n')[0]:
                logger.warning("[Gemini] Response is not React code")
                return None
            
            logger.info("[Gemini] Success - generated React code")
            return code
            
        except Exception as e:
            error_msg = str(e).lower()

            # Check for quota/rate limit errors
            if 'quota' in error_msg or 'rate limit' in error_msg or '429' in error_msg:
                logger.warning(f"[Gemini] QUOTA EXCEEDED: {e}")
                self.enabled = False  # Disable temporarily
                return None

            # Check for model capacity exhausted errors
            if 'capacity' in error_msg or 'model capacity' in error_msg or 'unavailable' in error_msg:
                logger.warning(f"[Gemini] CAPACITY EXHAUSTED: {e}")
                self.enabled = False
                return None

            # Check for invalid API key
            if 'api key' in error_msg or 'unauthorized' in error_msg or '401' in error_msg:
                logger.warning(f"[Gemini] INVALID API KEY: {e}")
                self.enabled = False
                return None

            logger.warning(f"[Gemini] Error: {e}")
            return None


class OpenAIVisionProvider:
    """OpenAI GPT-4 Vision API"""
    
    def __init__(self):
        self.enabled = False
        self.client = None
        self._init()
    
    def _init(self):
        """Initialize OpenAI"""
        try:
            from openai import OpenAI
            raw = os.getenv('OPENAI_API_KEY')
            key = (raw or "").strip().strip('"').strip("'")
            # OpenAI secret keys are sk-... (incl. sk-proj-...)
            if not key or "your_" in key.lower() or not key.startswith("sk-") or len(key) < 20:
                logger.info("[OpenAI] Disabled - no valid API key")
                return
            
            self.client = OpenAI(api_key=key)
            self.enabled = True
            logger.info("[OpenAI] Initialized successfully")
            
        except ImportError:
            logger.warning("[OpenAI] openai package not installed")
        except Exception as e:
            logger.warning(f"[OpenAI] Init error: {e}")
    
    def generate_react_code(self, image_base64: str, description: str = "") -> Optional[str]:
        """Generate React code from sketch using GPT-4 Vision"""
        if not self.enabled:
            return None
        
        try:
            logger.info("[OpenAI] Analyzing sketch...")
            
            response = self.client.chat.completions.create(
                model="gpt-4o",  # Updated to current model
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{image_base64}"
                                }
                            },
                            {
                                "type": "text",
                                "text": f"""Analyze this UI/UX sketch and generate React JSX code.

User Description: {description if description else "UI sketch layout"}

Requirements:
1. Generate ONLY valid React JSX code (must start with 'import React')
2. Import styles from './SketchLayout.css'
3. Use absolute positioning for components. **CRITICAL: You MUST apply the 'style' attribute with the mapped positions to EVERY single html element so that they are correctly positioned.**
4. Detect all UI components (header, sidebar, buttons, forms, cards, etc)
5. Map component positions and sizes from the sketch and MAKE SURE TO APPLY THEM via inline styles: style={{position: 'absolute', left: ..., top: ...}}
6. Use semantic HTML elements (header, footer, nav, main, aside, etc)
7. Add data attributes with component IDs
8. Return ONLY the code, no explanations or markdown

Generate complete React component code:"""
                            }
                        ]
                    }
                ],
                max_tokens=2000
            )
            
            if not response or not response.choices:
                logger.warning("[OpenAI] Empty response")
                return None
            
            code = response.choices[0].message.content.strip()
            
            # Ensure it's React code
            if 'import React' not in code and 'import' not in code.split('\n')[0]:
                logger.warning("[OpenAI] Response is not React code")
                return None
            
            logger.info("[OpenAI] Success - generated React code")
            return code
            
        except Exception as e:
            error_msg = str(e).lower()

            # Check for quota/rate limit errors
            if 'quota' in error_msg or 'rate_limit' in error_msg or '429' in error_msg or 'insufficient_quota' in error_msg:
                logger.warning(f"[OpenAI] QUOTA EXCEEDED: {e}")
                self.enabled = False
                return None

            # Check for model capacity exhausted errors
            if 'capacity' in error_msg or 'model capacity' in error_msg or 'unavailable' in error_msg:
                logger.warning(f"[OpenAI] CAPACITY EXHAUSTED: {e}")
                self.enabled = False
                return None

            # Check for invalid API key
            if 'api key' in error_msg or 'unauthorized' in error_msg or 'invalid_api_key' in error_msg:
                logger.warning(f"[OpenAI] INVALID API KEY: {e}")
                self.enabled = False
                return None
            
            logger.warning(f"[OpenAI] Error: {e}")
            return None


class ClaudeVisionProvider:
    """Anthropic Claude 3 Vision API"""
    
    def __init__(self):
        self.enabled = False
        self.client = None
        self._init()
    
    def _init(self):
        """Initialize Claude"""
        try:
            import anthropic
            api_key = os.getenv('ANTHROPIC_API_KEY')
            
            if not api_key or 'your_' in api_key.lower():
                logger.info("[Claude] Disabled - no valid API key")
                return
            
            self.client = anthropic.Anthropic(api_key=api_key)
            self.enabled = True
            logger.info("[Claude] Initialized successfully")
            
        except ImportError:
            logger.warning("[Claude] anthropic package not installed")
        except Exception as e:
            logger.warning(f"[Claude] Init error: {e}")
    
    def generate_react_code(self, image_base64: str, description: str = "") -> Optional[str]:
        """Generate React code from sketch using Claude Vision"""
        if not self.enabled:
            return None
        
        try:
            logger.info("[Claude] Analyzing sketch...")
            
            response = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=2000,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": "image/png",
                                    "data": image_base64
                                }
                            },
                            {
                                "type": "text",
                                "text": f"""Analyze this UI/UX sketch and generate React JSX code.

User Description: {description if description else "UI sketch layout"}

Requirements:
1. Generate ONLY valid React JSX code (must start with 'import React')
2. Import styles from './SketchLayout.css'
3. Use absolute positioning for components. **CRITICAL: You MUST apply the 'style' attribute with the mapped positions to EVERY single html element so that they are correctly positioned.**
4. Detect all UI components (header, sidebar, buttons, forms, cards, etc)
5. Map component positions and sizes from the sketch and MAKE SURE TO APPLY THEM via inline styles: style={{position: 'absolute', left: ..., top: ...}}
6. Use semantic HTML elements (header, footer, nav, main, aside, etc)
7. Add data attributes with component IDs
8. Return ONLY the code, no explanations or markdown

Generate complete React component code:"""
                            }
                        ]
                    }
                ]
            )
            
            if not response or not response.content:
                logger.warning("[Claude] Empty response")
                return None
            
            code = response.content[0].text.strip()
            
            # Ensure it's React code
            if 'import React' not in code and 'import' not in code.split('\n')[0]:
                logger.warning("[Claude] Response is not React code")
                return None
            
            logger.info("[Claude] Success - generated React code")
            return code
            
        except Exception as e:
            error_msg = str(e).lower()
            
            # Check for quota/rate limit/capacity errors
            if any(term in error_msg for term in ['quota', 'rate limit', '429', 'overloaded', 'capacity']):
                logger.warning(f"[Claude] QUOTA/CAPACITY EXCEEDED: {e}")
                self.enabled = False
                return None
            
            # Check for invalid API key
            if any(term in error_msg for term in ['api key', 'unauthorized', '401']):
                logger.warning(f"[Claude] INVALID API KEY: {e}")
                self.enabled = False
                return None
                
            logger.warning(f"[Claude] Error: {e}")
            return None


class GroqVisionProvider:
    """Groq Llama-3.2 Vision API (High speed, Generous Free Tier)"""
    def __init__(self):
        self.enabled = False
        self.client = None
        self._init()

    def _init(self):
        try:
            from groq import Groq
            api_key = os.getenv('GROQ_API_KEY')
            if not api_key or 'your_' in api_key.lower():
                return
            self.client = Groq(api_key=api_key)
            self.enabled = True
            logger.info("[Groq] Initialized successfully")
        except ImportError:
            logger.warning("[Groq] groq package not installed")
        except Exception as e:
            logger.warning(f"[Groq] Init error: {e}")

    def generate_react_code(self, image_base64: str, description: str = "") -> Optional[str]:
        if not self.enabled:
            return None
        try:
            logger.info("[Groq] Analyzing sketch...")
            response = self.client.chat.completions.create(
                model="llama-3.2-90b-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "Generate high-fidelity React JSX for this sketch. Use absolute positioning with 'style'. No markdown."},
                            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_base64}"}}
                        ]
                    }
                ],
                temperature=0.1,
                max_tokens=2048
            )
            code = response.choices[0].message.content.strip()
            # Clean possible markdown wrap
            if "```" in code:
                code = code.split("```")[1].replace("jsx", "").replace("javascript", "").replace("react", "").strip()
            
            if 'import' in code:
                logger.info("[Groq] Success")
                return code
            return None
        except Exception as e:
            if any(x in str(e).lower() for x in ['quota', 'rate limit', '429']):
                self.enabled = False
            logger.warning(f"[Groq] Error: {e}")
            return None


class MistralVisionProvider:
    """Mistral Pixtral Vision API"""
    def __init__(self):
        self.enabled = False
        self.client = None
        self._init()

    def _init(self):
        try:
            from mistralai import Mistral
            api_key = os.getenv('MISTRAL_API_KEY')
            if not api_key or 'your_' in api_key.lower():
                return
            self.client = Mistral(api_key=api_key)
            self.enabled = True
            logger.info("[Mistral] Initialized successfully")
        except ImportError:
            logger.warning("[Mistral] mistralai package not installed")
        except Exception as e:
            logger.warning(f"[Mistral] Init error: {e}")

    def generate_react_code(self, image_base64: str, description: str = "") -> Optional[str]:
        if not self.enabled:
            return None
        try:
            logger.info("[Mistral] Analyzing sketch...")
            response = self.client.chat.completions.create(
                model="pixtral-12b-2409",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "Generate React JSX code for this sketch. Use inline styles for absolute position."},
                            {"type": "image_url", "image_url": f"data:image/png;base64,{image_base64}"}
                        ]
                    }
                ]
            )
            code = response.choices[0].message.content.strip()
            if "```" in code:
                code = code.split("```")[1].replace("jsx", "").replace("javascript", "").replace("react", "").strip()
            
            if 'import' in code:
                logger.info("[Mistral] Success")
                return code
            return None
        except Exception as e:
            if any(x in str(e).lower() for x in ['quota', 'rate limit', '429']):
                self.enabled = False
            logger.warning(f"[Mistral] Error: {e}")
            return None


class HFVisionProvider:
    """Hugging Face Inference API (Free for many open models)"""
    def __init__(self):
        self.enabled = False
        self.api_url = "https://api-inference.huggingface.co/models/HuggingFaceM4/idefics2-8b"
        self._init()

    def _init(self):
        # HuggingFace typically uses HF_TOKEN
        api_key = os.getenv('HF_TOKEN') or os.getenv('HUGGINGFACE_API_KEY')
        if not api_key or 'your_' in api_key.lower():
            return
        self.headers = {"Authorization": f"Bearer {api_key}"}
        self.enabled = True
        logger.info("[HuggingFace] Initialized successfully")

    def generate_react_code(self, image_base64: str, description: str = "") -> Optional[str]:
        if not self.enabled:
            return None
        try:
            logger.info("[HuggingFace] Analyzing sketch...")
            payload = {
                "inputs": {
                    "image": image_base64,
                    "text": f"Generate React JSX code for this UI layout. Intent: {description}"
                }
            }
            import httpx
            response = httpx.post(self.api_url, headers=self.headers, json=payload, timeout=60.0)
            if response.status_code == 200:
                res = response.json()
                # HF models usually return a list of results
                res_text = res[0].get('generated_text', '') if isinstance(res, list) else str(res)
                if 'import' in res_text:
                    logger.info("[HuggingFace] Success")
                    return res_text
            return None
        except Exception as e:
            logger.warning(f"[HuggingFace] Error: {e}")
            return None
class HFFallbackProvider:
    """Offline deterministic fallback generator producing valid React JSX."""
    def __init__(self):
        self.enabled = True

    def generate_react_code(self, image_base64: str, description: str = "") -> Optional[str]:
        if not self.enabled:
            return None
        layout = [
            {"type": "header", "x": 0, "y": 0, "width": 800, "height": 80},
            {"type": "main", "x": 0, "y": 90, "width": 800, "height": 420},
            {"type": "footer", "x": 0, "y": 520, "width": 800, "height": 80},
        ]
        lines = [
            "import React from 'react';",
            "import './SketchLayout.css';",
            "",
            "export default function SketchLayout() {",
            "  return (",
            "    <div className=\"sketch-layout\" style={{ position: 'relative', width: 800, height: 600 }}>",
        ]
        for comp in layout:
            lines.append(
                "      <div className=\"sketch-component\" style={{{{ position: 'absolute', left: {x}, top: {y}, width: {w}, height: {h} }}}}></div>".format(
                    x=comp['x'], y=comp['y'], w=comp['width'], h=comp['height']
                ).replace("{{{{", "{{").replace("}}}}", "}}")
            )
        lines += ["    </div>", "  );", "}"]
        return "\n".join(lines)


class AIVisionCascade:
    """AI Vision Cascade: Try multiple providers in order"""
    
    def __init__(self):
        self.gemini = GeminiVisionProvider()
        self.openai = OpenAIVisionProvider()
        self.claude = ClaudeVisionProvider()
        self.groq = GroqVisionProvider()
        self.mistral = MistralVisionProvider()
        self.hf = HFVisionProvider()
        self.hf_fallback = HFFallbackProvider()
    
    def generate_react_code(self, image_base64: str, description: str = "") -> Dict[str, Any]:
        """
        Try AI providers in cascade order until one succeeds.
        Returns: {code, provider, success, trace}
        """
        trace = []
        
        # Try Gemini first (fastest + free tier available)
        logger.info("[Cascade] Starting Gemini...")
        code = self.gemini.generate_react_code(image_base64, description)
        if code:
            trace.append({"provider": "gemini", "status": "success", "model": "gemini-2.5-flash"})
            logger.info("[Cascade] ✓ Gemini success")
            return {"code": code, "provider": "gemini", "success": True, "trace": trace}
        
        trace.append({"provider": "gemini", "status": "failed"})
        logger.warning("[Cascade] Gemini failed, trying OpenAI...")
        
        # Try OpenAI second
        code = self.openai.generate_react_code(image_base64, description)
        if code:
            trace.append({"provider": "openai", "status": "success", "model": "gpt-4o"})
            logger.info("[Cascade] ✓ OpenAI success")
            return {"code": code, "provider": "openai", "success": True, "trace": trace}
        
        trace.append({"provider": "openai", "status": "failed"})
        logger.warning("[Cascade] OpenAI failed, trying Claude...")
        
        # Try Claude third
        code = self.claude.generate_react_code(image_base64, description)
        if code:
            trace.append({"provider": "claude", "status": "success", "model": "claude-3-5-sonnet-20241022"})
            logger.info("[Cascade] ✓ Claude success")
            return {"code": code, "provider": "claude", "success": True, "trace": trace}
        
        trace.append({"provider": "claude", "status": "failed"})
        
        # 4. Try Groq (Great free tier)
        logger.info("[Cascade] Trying Groq...")
        code = self.groq.generate_react_code(image_base64, description)
        if code:
            trace.append({"provider": "groq", "status": "success", "model": "llama-3.2-90b-vision"})
            logger.info("[Cascade] ✓ Groq success")
            return {"code": code, "provider": "groq", "success": True, "trace": trace}
        
        trace.append({"provider": "groq", "status": "failed"})

        # 5. Try Mistral
        logger.info("[Cascade] Trying Mistral...")
        code = self.mistral.generate_react_code(image_base64, description)
        if code:
            trace.append({"provider": "mistral", "status": "success", "model": "pixtral-12b"})
            logger.info("[Cascade] ✓ Mistral success")
            return {"code": code, "provider": "mistral", "success": True, "trace": trace}
            
        trace.append({"provider": "mistral", "status": "failed"})

        # 6. Try Hugging Face (Free Open Source)
        logger.info("[Cascade] Trying HuggingFace...")
        code = self.hf.generate_react_code(image_base64, description)
        if code:
            trace.append({"provider": "huggingface", "status": "success", "model": "idefics2-8b"})
            logger.info("[Cascade] ✓ HuggingFace success")
            return {"code": code, "provider": "huggingface", "success": True, "trace": trace}

        trace.append({"provider": "huggingface", "status": "failed"})
        logger.warning("[Cascade] All AI providers failed - using local fallback")
        
        # Local fallback (always works offline)
        hf_code = self.hf_fallback.generate_react_code(image_base64, description)
        if hf_code:
            trace.append({"provider": "hf_fallback", "status": "success"})
            logger.info("[Cascade] ✓ Local fallback success")
            return {"code": hf_code, "provider": "hf_fallback", "success": True, "trace": trace}
        
        return {"code": None, "provider": None, "success": False, "trace": trace}


# Global instance
_cascade = None

def get_ai_cascade() -> AIVisionCascade:
    """Get singleton AI cascade instance"""
    global _cascade
    if _cascade is None:
        _cascade = AIVisionCascade()
    return _cascade
