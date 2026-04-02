"""
React-Only Code Generator

Generates ONLY React/JSX code output with strict layout format compliance.
- No HTML-only output
- Follows exact layout specification
- Deterministic template selection
- Provider trace logging
"""

import logging
from typing import Dict, List, Any, Tuple
import json

logger = logging.getLogger(__name__)


class LayoutValidator:
    """Validates layout structure matches specification exactly."""
    
    REQUIRED_LAYOUT_KEYS = {'layout', 'analysis', 'template', 'rows', 'sections', 'description'}
    REQUIRED_COMPONENT_KEYS = {'type', 'x', 'y', 'width', 'height', 'ink_ratio'}
    REQUIRED_ANALYSIS_KEYS = {'template', 'confidence', 'processing_method'}
    
    VALID_COMPONENT_TYPES = {
        'text', 'button', 'image', 'header', 'card', 'input', 'section',
        'footer', 'sidebar', 'container', 'form', 'main', 'nav'
    }
    
    @staticmethod
    def validate_layout(layout_dict: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Validate layout structure matches specification.
        
        Returns:
            (is_valid, error_message)
        """
        # Check required top-level keys
        missing_keys = LayoutValidator.REQUIRED_LAYOUT_KEYS - set(layout_dict.keys())
        if missing_keys:
            return False, f"Missing required layout keys: {missing_keys}"
        
        # Validate layout array
        if not isinstance(layout_dict['layout'], list):
            return False, "layout must be an array"
        
        if len(layout_dict['layout']) == 0:
            return False, "layout array cannot be empty"
        
        # Validate each component
        for i, comp in enumerate(layout_dict['layout']):
            if not isinstance(comp, dict):
                return False, f"Component {i} is not an object"
            
            missing_comp_keys = LayoutValidator.REQUIRED_COMPONENT_KEYS - set(comp.keys())
            if missing_comp_keys:
                return False, f"Component {i} missing keys: {missing_comp_keys}"
            
            if comp['type'] not in LayoutValidator.VALID_COMPONENT_TYPES:
                return False, f"Component {i} has invalid type: {comp['type']}"
            
            # Validate numeric fields
            for field in ['x', 'y', 'width', 'height']:
                if not isinstance(comp[field], (int, float)):
                    return False, f"Component {i}.{field} must be numeric"
            
            if not isinstance(comp['ink_ratio'], (int, float)):
                return False, f"Component {i}.ink_ratio must be numeric"
        
        # Validate analysis
        analysis = layout_dict.get('analysis', {})
        missing_analysis = LayoutValidator.REQUIRED_ANALYSIS_KEYS - set(analysis.keys())
        if missing_analysis:
            return False, f"Missing analysis keys: {missing_analysis}"
        
        if not isinstance(analysis['confidence'], (int, float)):
            return False, "analysis.confidence must be numeric"
        
        # Validate rows
        if not isinstance(layout_dict.get('rows'), list):
            return False, "rows must be an array"
        
        # Validate sections
        if not isinstance(layout_dict.get('sections'), list):
            return False, "sections must be an array"
        
        if len(layout_dict.get('sections', [])) == 0:
            return False, "sections array cannot be empty"
        
        for i, section in enumerate(layout_dict.get('sections', [])):
            if 'name' not in section or 'kind' not in section:
                return False, f"Section {i} missing name or kind"
        
        return True, ""


class ReactGenerator:
    """Generates React/JSX code from layout specifications."""
    
    def __init__(self):
        self.provider_trace = []
    
    def generate(self, layout_dict: Dict[str, Any], image_context: str = "") -> Dict[str, Any]:
        """
        Generate React code from layout structure.
        
        Args:
            layout_dict: Layout specification following exact format
            image_context: Optional image description for context
        
        Returns:
            {
                'code': React JSX code string,
                'layout': Input layout dict,
                'analysis': Analysis metadata,
                'provider_trace': List of generation attempts,
                'valid': Whether output is valid
            }
        """
        # Validate input layout
        is_valid, error = LayoutValidator.validate_layout(layout_dict)
        if not is_valid:
            logger.error(f"Layout validation failed: {error}")
            self.provider_trace.append({
                'provider': 'validator',
                'status': 'failed',
                'error': error
            })
            return {
                'code': None,
                'layout': layout_dict,
                'analysis': layout_dict.get('analysis', {}),
                'provider_trace': self.provider_trace,
                'valid': False,
                'error': error
            }
        
        logger.info(f"Layout validation passed")
        self.provider_trace.append({
            'provider': 'validator',
            'status': 'passed'
        })
        
        # Extract template
        template = layout_dict.get('template', 'landing')
        
        # Generate React code
        try:
            react_code = self._generate_react_code(layout_dict)
            
            self.provider_trace.append({
                'provider': 'react_generator',
                'status': 'success',
                'template': template
            })
            
            return {
                'code': react_code,
                'layout': layout_dict,
                'analysis': layout_dict.get('analysis', {}),
                'provider_trace': self.provider_trace,
                'valid': True
            }
        except Exception as e:
            logger.error(f"React generation failed: {e}")
            self.provider_trace.append({
                'provider': 'react_generator',
                'status': 'failed',
                'error': str(e)
            })
            return {
                'code': None,
                'layout': layout_dict,
                'analysis': layout_dict.get('analysis', {}),
                'provider_trace': self.provider_trace,
                'valid': False,
                'error': str(e)
            }
    
    def _generate_react_code(self, layout_dict: Dict[str, Any]) -> str:
        """
        Generate actual React/JSX code from layout.
        """
        template = layout_dict.get('template', 'landing')
        components = layout_dict.get('layout', [])
        
        # Generate component imports
        imports = self._generate_imports(components)
        
        # Generate component JSX
        component_jsx = self._generate_component_jsx(components, template)
        
        # Wrap in React component
        react_code = f"""import React from 'react';

{imports}

export default function SketchLayout() {{
  return (
    <div className="sketch-layout">
      {component_jsx}
    </div>
  );
}}
"""
        return react_code
    
    def _generate_imports(self, components: List[Dict[str, Any]]) -> str:
        """Generate necessary imports based on component types."""
        imports = []
        
        component_types = set(c.get('type') for c in components)
        
        # Add common imports
        imports.append("import './SketchLayout.css';")
        
        return '\n'.join(imports)
    
    def _generate_component_jsx(self, components: List[Dict[str, Any]], template: str) -> str:
        """
        Generate JSX for components.
        """
        jsx_lines = []
        
        for comp in components:
            comp_type = comp.get('type', 'div')
            x = comp.get('x', 0)
            y = comp.get('y', 0)
            width = comp.get('width', 100)
            height = comp.get('height', 100)
            
            # Style attributes
            style = f'position: absolute; left: {x}px; top: {y}px; width: {width}px; height: {height}px;'
            
            # Generate component JSX based on type
            if comp_type == 'button':
                jsx_lines.append(f'<button style={{{{"...defaultStyle", {style}}}}}>Click me</button>')
            elif comp_type == 'input':
                jsx_lines.append(f'<input type="text" style={{{{"...defaultStyle", {style}}}}} placeholder="Enter text" />')
            elif comp_type == 'image':
                jsx_lines.append(f'<img src="placeholder.svg" alt="Image" style={{{{"...defaultStyle", {style}}}}} />')
            elif comp_type == 'text':
                jsx_lines.append(f'<p style={{{{"...defaultStyle", {style}}}}}>Text content</p>')
            elif comp_type == 'header':
                jsx_lines.append(f'<header style={{{{"...defaultStyle", {style}}}}}>Header</header>')
            elif comp_type == 'card':
                jsx_lines.append(f'<div className="card" style={{{{"...defaultStyle", {style}}}}}>Card content</div>')
            else:
                # Default div
                jsx_lines.append(f'<div style={{{{"...defaultStyle", {style}}}}}></div>')
        
        return '\n      '.join(jsx_lines)
    
    def get_provider_trace(self) -> List[Dict[str, Any]]:
        """Return provider trace for debugging."""
        return self.provider_trace


class IntentDetector:
    """
    Deterministically detect intent from description and components.
    No random template switching.
    """
    
    # Keywords that explicitly indicate template intent
    # Use tuples (keyword, min_confidence) to define keyword specificity
    # More specific keywords should be checked first
    TEMPLATE_KEYWORDS = {
        'login': [
            ('authenticate', 0.95),
            ('password', 0.95),
            ('credentials', 0.95),
            ('sign in', 0.95),
            ('signin', 0.95),
            ('login form', 0.95),
            ('login', 0.90),
            ('email', 0.80),  # Lower confidence alone
        ],
        'dashboard': [
            ('dashboard', 0.95),
            ('analytics dashboard', 0.95),
            ('analytics', 0.90),
            ('metrics', 0.90),
            ('chart', 0.85),
            ('graph', 0.85),
            ('sidebar', 0.85),
        ],
        'gallery': [
            ('gallery', 0.95),
            ('product gallery', 0.95),
            ('product grid', 0.95),
            ('grid', 0.85),
            ('portfolio', 0.85),
            ('showcase', 0.85),
            ('items grid', 0.80),
        ],
        'form': [
            ('registration form', 0.95),
            ('form submission', 0.95),
            ('register', 0.90),
            ('signup form', 0.90),
            ('signup', 0.90),
            ('form fields', 0.85),
            ('input validation', 0.85),
        ],
        'landing': [
            ('landing page', 0.95),
            ('landing', 0.90),
            ('hero', 0.85),
            ('welcome', 0.80),
            ('home page', 0.80),
        ],
    }
    
    @staticmethod
    def detect_intent(description: str, components: List[Dict[str, Any]]) -> Tuple[str, float]:
        """
        Deterministically detect template intent.
        
        Returns:
            (template_name, confidence_score)
        """
        description_lower = description.lower().strip()
        
        # Step 1: Check explicit keywords in description
        # Check in order of specificity (multi-word phrases first, then single words)
        for template, keywords in IntentDetector.TEMPLATE_KEYWORDS.items():
            for keyword, confidence in keywords:
                if keyword in description_lower:
                    logger.info(f"Intent detected from keyword '{keyword}': {template} (confidence: {confidence})")
                    return template, confidence
        
        # Step 2: Infer from component types
        component_types = [c.get('type', '').lower() for c in components]
        component_count = len(components)
        
        # Dashboard: Has sidebar
        if 'sidebar' in component_types:
            logger.info("Intent inferred from sidebar component: dashboard")
            return 'dashboard', 0.85
        
        # Login: Has input + button
        if 'input' in component_types and 'button' in component_types:
            logger.info("Intent inferred from input+button: login")
            return 'login', 0.80
        
        # Gallery: Multiple cards
        card_count = component_types.count('card')
        if card_count >= 3:
            logger.info(f"Intent inferred from {card_count} cards: gallery")
            return 'gallery', 0.75
        
        # Form: Multiple inputs
        input_count = component_types.count('input')
        if input_count >= 3:
            logger.info(f"Intent inferred from {input_count} inputs: form")
            return 'form', 0.70
        
        # Step 3: Default fallback (no guessing, deterministic)
        logger.info("No explicit intent detected, using deterministic fallback: landing")
        return 'landing', 0.50  # Low confidence fallback


def integrate_react_output(layout_dict: Dict[str, Any], image_description: str = "") -> Dict[str, Any]:
    """
    Main function to generate React output from layout.
    
    Ensures:
    - Output is React only
    - Layout structure is validated
    - Deterministic template selection
    - Provider trace is logged
    
    Args:
        layout_dict: Layout specification (must have exact format)
        image_description: Optional description for intent detection
    
    Returns:
        Complete generation result with React code and metadata
    """
    logger.info("=" * 80)
    logger.info("REACT CODE GENERATION")
    logger.info("=" * 80)
    
    # Detect intent (deterministically)
    detected_template, intent_confidence = IntentDetector.detect_intent(
        image_description,
        layout_dict.get('layout', [])
    )
    
    # Update layout with detected intent if not already specified
    if layout_dict.get('template') == 'unknown' or 'template' not in layout_dict:
        layout_dict['template'] = detected_template
        layout_dict['analysis']['confidence'] = intent_confidence
    
    # Generate React code
    generator = ReactGenerator()
    result = generator.generate(layout_dict, image_description)
    
    # Log provider trace
    logger.info("Provider Trace:")
    for i, trace in enumerate(result['provider_trace'], 1):
        logger.info(f"  {i}. {trace['provider']}: {trace['status']}")
        if 'error' in trace:
            logger.error(f"     Error: {trace['error']}")
    
    logger.info("=" * 80)
    
    return result
