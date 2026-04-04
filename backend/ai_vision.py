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
    env_path = Path(__file__).parent.parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)
except ImportError:
    pass

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
            api_key = os.getenv('GEMINI_API_KEY')
            
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
            model = self.client.GenerativeModel('gemini-2.5-flash')
            
            image_data = {
                "mime_type": "image/png",
                "data": image_base64
            }
            
            prompt = f"""Analyze this UI/UX sketch and generate React JSX code.

User Description: {description if description else "UI sketch layout"}

Requirements:
1. Generate ONLY valid React JSX code (must start with 'import React')
2. Import styles from './SketchLayout.css'
3. Use absolute positioning for components
4. Detect all UI components (header, sidebar, buttons, forms, cards, etc)
5. Map component positions and sizes from the sketch
6. Use semantic HTML elements (header, footer, nav, main, aside, etc)
7. Add data attributes with component IDs
8. Return ONLY the code, no explanations or markdown

Generate complete React component code:"""
            
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
            api_key = os.getenv('OPENAI_API_KEY')
            
            if not api_key or 'your_' in api_key.lower() or 'sk-proj' not in api_key:
                logger.info("[OpenAI] Disabled - no valid API key")
                return
            
            self.client = OpenAI(api_key=api_key)
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
3. Use absolute positioning for components
4. Detect all UI components (header, sidebar, buttons, forms, cards, etc)
5. Map component positions and sizes from the sketch
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
3. Use absolute positioning for components
4. Detect all UI components (header, sidebar, buttons, forms, cards, etc)
5. Map component positions and sizes from the sketch
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
            logger.warning(f"[Claude] Error: {e}")
            return None


class AIVisionCascade:
    """AI Vision Cascade: Try multiple providers in order"""
    
    def __init__(self):
        self.gemini = GeminiVisionProvider()
        self.openai = OpenAIVisionProvider()
        self.claude = ClaudeVisionProvider()
    
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
            trace.append({
                "provider": "gemini",
                "status": "success",
                "model": "gemini-2.5-flash"
            })
            logger.info("[Cascade] ✓ Gemini success")
            return {
                "code": code,
                "provider": "gemini",
                "success": True,
                "trace": trace
            }
        
        trace.append({
            "provider": "gemini",
            "status": "failed"
        })
        logger.warning("[Cascade] Gemini failed, trying OpenAI...")
        
        # Try OpenAI second
        code = self.openai.generate_react_code(image_base64, description)
        if code:
            trace.append({
                "provider": "openai",
                "status": "success",
                "model": "gpt-4o"
            })
            logger.info("[Cascade] ✓ OpenAI success")
            return {
                "code": code,
                "provider": "openai",
                "success": True,
                "trace": trace
            }
        
        trace.append({
            "provider": "openai",
            "status": "failed"
        })
        logger.warning("[Cascade] OpenAI failed, trying Claude...")
        
        # Try Claude third
        code = self.claude.generate_react_code(image_base64, description)
        if code:
            trace.append({
                "provider": "claude",
                "status": "success",
                "model": "claude-3-5-sonnet-20241022"
            })
            logger.info("[Cascade] ✓ Claude success")
            return {
                "code": code,
                "provider": "claude",
                "success": True,
                "trace": trace
            }
        
        trace.append({
            "provider": "claude",
            "status": "failed"
        })
        logger.warning("[Cascade] All AI providers failed - will use CPU fallback")
        
        return {
            "code": None,
            "provider": None,
            "success": False,
            "trace": trace
        }


# Global instance
_cascade = None

def get_ai_cascade() -> AIVisionCascade:
    """Get singleton AI cascade instance"""
    global _cascade
    if _cascade is None:
        _cascade = AIVisionCascade()
    return _cascade
