"""
Hybrid CPU/GPU Pipeline for Sketch-to-Code Generation

Strategy:
- GPU: Fast component detection & template classification (neural network)
- CPU: Reliable HTML generation & fallback processing

This gives us the best of both worlds:
- Fast inference on GPU for AI tasks
- Deterministic, reliable template generation on CPU
"""

import logging
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
import cv2
import numpy as np
from PIL import Image

# Import detector module which has proper box merging
from .detector import detect_components

# Conditional imports - only import torch if available
try:
    import torch
    import torch.nn.functional as F
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    torch = None

logger = logging.getLogger(__name__)


class HybridPipeline:
    """
    Orchestrates CPU and GPU processing for optimal performance.
    
    Flow:
    1. GPU: Load & preprocess image (fast tensor operations)
    2. GPU: Detect components with neural network
    3. GPU: Classify template type with confidence
    4. CPU: Generate semantic HTML from template
    5. CPU: Post-process and validate HTML
    """
    
    def __init__(self, gpu_model=None, enable_gpu: bool = True):
        """
        Args:
            gpu_model: Optional GPUCodeGenerator instance
            enable_gpu: Whether to use GPU if available
        """
        self.gpu_model = gpu_model
        self.enable_gpu = enable_gpu and TORCH_AVAILABLE and torch.cuda.is_available()
        self.device = torch.device('cuda' if self.enable_gpu else 'cpu') if TORCH_AVAILABLE else None
        
        if self.enable_gpu and self.gpu_model is None:
            logger.warning("GPU enabled but no GPU model provided - will use CPU only")
            self.enable_gpu = False
        
        self.stats = {
            'gpu_detections': 0,
            'cpu_detections': 0,
            'total_time_ms': 0,
        }
        
        logger.info(f"Hybrid Pipeline initialized - GPU enabled: {self.enable_gpu}")
    
    def process(self, image_path: Path, description: str = "") -> Dict[str, Any]:
        """
        Process sketch image using hybrid CPU/GPU pipeline.
        
        Returns:
            Dict with keys:
            - layout: List of detected components
            - template: Detected template type
            - confidence: Detection confidence (0-1)
            - html: Generated HTML code
            - css: CSS styles (empty string)
            - processing_method: 'gpu' or 'cpu'
        """
        import time
        start_time = time.time()
        
        try:
            # Step 1: Load image
            if isinstance(image_path, str):
                image_path = Path(image_path)
            
            cv_image = cv2.imread(str(image_path))
            if cv_image is None:
                raise ValueError(f"Could not load image: {image_path}")
            
            # Try GPU pipeline first if available
            if self.enable_gpu:
                try:
                    result = self._gpu_pipeline(cv_image, description)
                    result['processing_method'] = 'gpu'
                    result['css'] = ''  # Ensure css key exists
                    self.stats['gpu_detections'] += 1
                    logger.info(f"GPU pipeline successful for {image_path.name}")
                    return result
                except Exception as gpu_error:
                    logger.warning(f"GPU pipeline failed: {gpu_error}, falling back to CPU")
                    self.stats['cpu_detections'] += 1
            
            # Fall back to CPU pipeline
            result = self._cpu_pipeline(cv_image, description)
            result['processing_method'] = 'cpu'
            result['css'] = ''  # Ensure css key exists
            self.stats['cpu_detections'] += 1
            logger.info(f"CPU pipeline used for {image_path.name}")
            return result
            
        except Exception as e:
            logger.error(f"Hybrid pipeline failed: {e}")
            raise
        finally:
            elapsed = (time.time() - start_time) * 1000
            self.stats['total_time_ms'] += elapsed
    
    def _gpu_pipeline(self, cv_image: np.ndarray, description: str) -> Dict[str, Any]:
        """
        GPU-accelerated pipeline using neural network.
        
        Fast component detection and template classification.
        """
        logger.debug("Starting GPU pipeline")
        
        # Convert CV image to PIL for GPU model
        pil_image = Image.fromarray(cv2.cvtColor(cv_image, cv2.COLOR_BGR2RGB))
        
        # GPU Step 1: Detect components using neural network
        gpu_components = self.gpu_model.detect_components(pil_image)
        
        # GPU Step 2: Get layout inference (includes template classification)
        layout = self.gpu_model.generate_layout(pil_image)
        
        # Map GPU results to our standard format
        components = []
        for comp in gpu_components:
            bbox = comp.get('bbox', {})
            components.append({
                'type': comp.get('type', 'section'),
                'x': bbox.get('x', 0),
                'y': bbox.get('y', 0),
                'width': bbox.get('width', 100),
                'height': bbox.get('height', 100),
                'confidence': comp.get('confidence', 0.5),
            })
        
        # Map GPU layout type to our template names
        template_map = {
            'login_form': 'login',
            'landing_page': 'landing',
            'data_table': 'dashboard',
            'card_grid': 'gallery',
            'general': 'landing',
        }
        template = template_map.get(layout.get('layout_type', 'general'), 'landing')
        confidence = layout.get('confidence', 0.5)
        
        # CPU Step: Generate semantic HTML from detected template
        html = self._generate_html_from_template(template, components, description)
        
        return {
            'layout': components,
            'template': template,
            'confidence': confidence,
            'html': html,
            'css': '',
        }
    
    def _cpu_pipeline(self, cv_image: np.ndarray, description: str) -> Dict[str, Any]:
        """
        CPU-only fallback using OpenCV component detection.
        
        Uses the optimized detector.py module which has proper box merging
        to avoid duplicate components from nested contours.
        """
        logger.debug("Starting CPU pipeline")
        
        # Save image temporarily to use detector module
        # (detector expects a file path, not numpy array)
        import tempfile
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            tmp_path = tmp.name
            cv2.imwrite(tmp_path, cv_image)
        
        try:
            # CPU Step 1: Component detection using detector.py
            # This uses proper box merging to avoid duplicates
            detected_result = detect_components(Path(tmp_path))
            components = [
                {
                    'type': comp.get('type', 'section'),
                    'x': int(comp.get('x', 0)),
                    'y': int(comp.get('y', 0)),
                    'width': int(comp.get('width', 100)),
                    'height': int(comp.get('height', 100)),
                    'confidence': 0.6,
                }
                for comp in detected_result.get('layout', [])
            ]
            
            # CPU Step 2: Template inference from components
            template = self._infer_template_cpu(components, description)
            
            # CPU Step 3: Generate HTML
            html = self._generate_html_from_template(template, components, description)
            
            return {
                'layout': components,
                'template': template,
                'confidence': 0.7,  # CPU detection confidence is moderate
                'html': html,
                'css': '',
            }
        finally:
            # Clean up temp file
            import os
            try:
                os.unlink(tmp_path)
            except:
                pass
    
    def _infer_template_cpu(self, components: List[Dict[str, Any]], description: str) -> str:
        """
        Infer template type from components using heuristics.
        """
        component_types = [c.get('type') for c in components]
        
        # Check for login form indicators
        if any(t in component_types for t in ['input', 'button']):
            if 'header' in component_types:
                return 'login'
        
        # Check for dashboard indicators
        if 'sidebar' in component_types:
            return 'dashboard'
        
        # Check for gallery indicators
        card_count = sum(1 for t in component_types if t == 'card')
        if card_count >= 3:
            return 'gallery'
        
        # Check description keywords
        desc_lower = description.lower()
        if any(word in desc_lower for word in ['login', 'sign in', 'password', 'email']):
            return 'login'
        if any(word in desc_lower for word in ['dashboard', 'analytics', 'metrics']):
            return 'dashboard'
        if any(word in desc_lower for word in ['gallery', 'grid', 'products']):
            return 'gallery'
        
        # Default
        return 'landing'
    
    def _generate_html_from_template(self, template: str, components: List[Dict[str, Any]], 
                                     description: str) -> str:
        """
        Generate semantic HTML using CPU (deterministic, reliable).
        
        Uses inline template generation to avoid import issues.
        """
        
        # Simple template definitions for common layouts
        templates = {
            'login': '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login</title>
    <style>body{margin:0;font-family:system-ui,sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);display:flex;align-items:center;justify-content:center;min-height:100vh;}.form-container{background:white;padding:40px;border-radius:8px;box-shadow:0 10px 25px rgba(0,0,0,0.2);width:100%;max-width:400px;}h1{text-align:center;color:#333;margin:0 0 30px;}input{width:100%;padding:12px;margin:10px 0;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;font-size:14px;}button{width:100%;padding:12px;margin:20px 0 0;background:#667eea;color:white;border:none;border-radius:4px;cursor:pointer;font-size:16px;font-weight:600;}button:hover{background:#764ba2;}</style>
</head>
<body>
    <div class="form-container">
        <h1>Sign In</h1>
        <form>
            <input type="email" placeholder="Email" required>
            <input type="password" placeholder="Password" required>
            <button type="submit">Sign In</button>
        </form>
    </div>
</body>
</html>''',
            'dashboard': '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard</title>
    <style>body{margin:0;font-family:system-ui,sans-serif;background:#f5f5f5;}.container{display:flex;min-height:100vh;}.sidebar{width:250px;background:#2c3e50;color:white;padding:20px;}.sidebar h2{margin:0 0 20px;}.sidebar ul{list-style:none;padding:0;margin:0;}.sidebar li{padding:10px 0;border-bottom:1px solid #34495e;}.main{flex:1;padding:30px;}.dashboard-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;}.card{background:white;padding:20px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);}.card h3{margin:0 0 10px;color:#333;}.card p{margin:0;color:#666;}</style>
</head>
<body>
    <div class="container">
        <div class="sidebar">
            <h2>Dashboard</h2>
            <ul>
                <li>Overview</li>
                <li>Analytics</li>
                <li>Reports</li>
                <li>Settings</li>
            </ul>
        </div>
        <div class="main">
            <h1>Dashboard</h1>
            <div class="dashboard-grid">
                <div class="card">
                    <h3>Metric 1</h3>
                    <p>1,234 items</p>
                </div>
                <div class="card">
                    <h3>Metric 2</h3>
                    <p>5,678 items</p>
                </div>
                <div class="card">
                    <h3>Metric 3</h3>
                    <p>9,012 items</p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>''',
            'gallery': '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gallery</title>
    <style>body{margin:0;font-family:system-ui,sans-serif;background:#f5f5f5;padding:20px;}.gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:20px;max-width:1200px;margin:0 auto;}.gallery-item{background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);transition:transform 0.3s;}.gallery-item:hover{transform:translateY(-5px);}.gallery-item img{width:100%;height:200px;object-fit:cover;background:#ddd;}.gallery-item-content{padding:15px;}.gallery-item h3{margin:0 0 10px;color:#333;}.gallery-item p{margin:0;color:#666;font-size:14px;}</style>
</head>
<body>
    <h1 style="text-align:center;margin-bottom:30px;">Gallery</h1>
    <div class="gallery">
        <div class="gallery-item">
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='200'%3E%3Crect fill='%23ccc' width='250' height='200'/%3E%3C/svg%3E">
            <div class="gallery-item-content">
                <h3>Item 1</h3>
                <p>Description goes here</p>
            </div>
        </div>
        <div class="gallery-item">
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='200'%3E%3Crect fill='%23bbb' width='250' height='200'/%3E%3C/svg%3E">
            <div class="gallery-item-content">
                <h3>Item 2</h3>
                <p>Description goes here</p>
            </div>
        </div>
        <div class="gallery-item">
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='200'%3E%3Crect fill='%23aaa' width='250' height='200'/%3E%3C/svg%3E">
            <div class="gallery-item-content">
                <h3>Item 3</h3>
                <p>Description goes here</p>
            </div>
        </div>
    </div>
</body>
</html>''',
            'landing': '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Landing Page</title>
    <style>body{margin:0;font-family:system-ui,sans-serif;background:white;}header{background:#2c3e50;color:white;padding:20px;text-align:center;}.hero{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:60px 20px;text-align:center;}.hero h1{margin:0 0 20px;font-size:48px;}.hero p{margin:0 0 30px;font-size:18px;}.hero button{padding:12px 30px;background:white;color:#667eea;border:none;border-radius:4px;cursor:pointer;font-size:16px;font-weight:600;}.features{padding:60px 20px;max-width:1200px;margin:0 auto;}.feature-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:40px;margin-top:40px;}.feature-item h3{color:#333;}.feature-item p{color:#666;}</style>
</head>
<body>
    <header>
        <h1>Welcome</h1>
    </header>
    <div class="hero">
        <h1>Generate Code from Sketches</h1>
        <p>Transform your design sketches into beautiful, functional code instantly</p>
        <button>Get Started</button>
    </div>
    <div class="features">
        <h2>Features</h2>
        <div class="feature-grid">
            <div class="feature-item">
                <h3>Fast</h3>
                <p>Convert sketches in seconds</p>
            </div>
            <div class="feature-item">
                <h3>Accurate</h3>
                <p>AI-powered component detection</p>
            </div>
            <div class="feature-item">
                <h3>Flexible</h3>
                <p>Export to multiple formats</p>
            </div>
        </div>
    </div>
</body>
</html>''',
        }
        
        # Return template or fallback to landing
        return templates.get(template, templates['landing'])
    
    def get_stats(self) -> Dict[str, Any]:
        """Get pipeline statistics."""
        return {
            **self.stats,
            'gpu_enabled': self.enable_gpu,
            'avg_time_ms': self.stats['total_time_ms'] / max(
                self.stats['gpu_detections'] + self.stats['cpu_detections'], 1
            ),
        }
