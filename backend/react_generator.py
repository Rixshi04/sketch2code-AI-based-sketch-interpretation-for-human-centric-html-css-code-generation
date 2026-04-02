"""
React-Only Code Generator

Generates ONLY React/JSX code output with strict layout format compliance.
- No HTML-only output
- Follows exact layout specification with rows containing full components
- Deterministic template selection
- Provider trace logging with image context
- CSS classes for styling (not inline styles)
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
                # CRITICAL: Reject negative dimensions
                if field in ['width', 'height'] and comp[field] < 0:
                    return False, f"Component {i}.{field} cannot be negative: {comp[field]}"
            
            if not isinstance(comp['ink_ratio'], (int, float)):
                return False, f"Component {i}.ink_ratio must be numeric"
        
        # Validate analysis
        analysis = layout_dict.get('analysis', {})
        missing_analysis = LayoutValidator.REQUIRED_ANALYSIS_KEYS - set(analysis.keys())
        if missing_analysis:
            return False, f"Missing analysis keys: {missing_analysis}"
        
        if not isinstance(analysis['confidence'], (int, float)):
            return False, "analysis.confidence must be numeric"
        
        # Validate rows - must have full component objects
        rows = layout_dict.get('rows', [])
        if not isinstance(rows, list):
            return False, "rows must be an array"
        
        for i, row in enumerate(rows):
            if not isinstance(row, dict):
                return False, f"Row {i} is not an object"
            
            if 'y' not in row:
                return False, f"Row {i} missing 'y' coordinate"
            
            if 'components' not in row:
                return False, f"Row {i} missing 'components' array"
            
            if not isinstance(row['components'], list):
                return False, f"Row {i} components must be an array"
            
            # Components in rows should be objects (not indices)
            for j, comp in enumerate(row['components']):
                if not isinstance(comp, dict):
                    return False, f"Row {i}, component {j} is not an object (should be full component data)"
                
                # Validate component fields
                if 'type' not in comp or 'x' not in comp or 'y' not in comp:
                    return False, f"Row {i}, component {j} missing required fields"
        
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
    
    def generate(self, layout_dict: Dict[str, Any], image_context: str = "", image_data: str = "") -> Dict[str, Any]:
        """
        Generate React code from layout structure.
        
        Args:
            layout_dict: Layout specification following exact format
            image_context: Optional image description for context
            image_data: Optional base64-encoded image data
        
        Returns:
            {
                'code': React JSX code string,
                'layout': Input layout dict,
                'analysis': Analysis metadata,
                'provider_trace': List of generation attempts,
                'valid': Whether output is valid
            }
        """
        # Log image context in trace
        if image_context or image_data:
            self.provider_trace.append({
                'provider': 'image_context',
                'status': 'loaded',
                'description_length': len(image_context) if image_context else 0,
                'has_image_data': bool(image_data),
            })
        
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
                'template': template,
                'image_context_used': bool(image_context),
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
        Uses CSS classes for positioning and styling.
        """
        template = layout_dict.get('template', 'landing')
        components = layout_dict.get('layout', [])
        rows = layout_dict.get('rows', [])
        
        # Generate component JSX from rows (using the row structure)
        component_jsx = self._generate_component_jsx_from_rows(rows)
        
        # Generate CSS positioning data
        css_data = self._generate_css_data(components)
        
        # Wrap in React component with CSS
        react_code = f"""import React from 'react';
import './SketchLayout.css';

// Component positioning data
const layoutStyles = {repr(css_data)};

export default function SketchLayout() {{
  return (
    <div className="sketch-layout">
      {component_jsx}
    </div>
  );
}}
"""
        return react_code
    
    def _generate_css_data(self, components: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
        """Generate CSS positioning data for components."""
        css_data = {}
        
        for i, comp in enumerate(components):
            css_data[f'component-{i}'] = {
                'position': 'absolute',
                'left': f"{int(comp.get('x', 0))}px",
                'top': f"{int(comp.get('y', 0))}px",
                'width': f"{max(1, int(comp.get('width', 100)))}px",
                'height': f"{max(1, int(comp.get('height', 100)))}px",
            }
        
        return css_data
    
    def _generate_component_jsx_from_rows(self, rows: List[Dict[str, Any]]) -> str:
        """
        Generate JSX for components based on row structure.
        Uses CSS classes for positioning.
        """
        jsx_lines = []
        
        for row_idx, row in enumerate(rows):
            row_components = row.get('components', [])
            
            for comp_idx, comp in enumerate(row_components):
                comp_type = comp.get('type', 'div')
                comp_id = f"component-{row_idx}-{comp_idx}"
                
                # Generate component JSX based on type
                if comp_type == 'button':
                    jsx_lines.append(f'      <button className="sketch-component sketch-button" data-id="{comp_id}">Click me</button>')
                elif comp_type == 'input':
                    jsx_lines.append(f'      <input type="text" className="sketch-component sketch-input" data-id="{comp_id}" placeholder="Enter text" />')
                elif comp_type == 'image':
                    jsx_lines.append(f'      <img src="data:image/svg+xml,%3Csvg/%3E" alt="Image" className="sketch-component sketch-image" data-id="{comp_id}" />')
                elif comp_type == 'text':
                    jsx_lines.append(f'      <p className="sketch-component sketch-text" data-id="{comp_id}">Text content</p>')
                elif comp_type == 'header':
                    jsx_lines.append(f'      <header className="sketch-component sketch-header" data-id="{comp_id}">Header</header>')
                elif comp_type == 'card':
                    jsx_lines.append(f'      <div className="sketch-component sketch-card" data-id="{comp_id}">Card content</div>')
                elif comp_type == 'section':
                    jsx_lines.append(f'      <section className="sketch-component sketch-section" data-id="{comp_id}"></section>')
                elif comp_type == 'footer':
                    jsx_lines.append(f'      <footer className="sketch-component sketch-footer" data-id="{comp_id}">Footer</footer>')
                elif comp_type == 'sidebar':
                    jsx_lines.append(f'      <aside className="sketch-component sketch-sidebar" data-id="{comp_id}">Sidebar</aside>')
                elif comp_type == 'nav':
                    jsx_lines.append(f'      <nav className="sketch-component sketch-nav" data-id="{comp_id}">Navigation</nav>')
                elif comp_type == 'container':
                    jsx_lines.append(f'      <div className="sketch-component sketch-container" data-id="{comp_id}"></div>')
                elif comp_type == 'form':
                    jsx_lines.append(f'      <form className="sketch-component sketch-form" data-id="{comp_id}"></form>')
                elif comp_type == 'main':
                    jsx_lines.append(f'      <main className="sketch-component sketch-main" data-id="{comp_id}"></main>')
                else:
                    # Default div
                    jsx_lines.append(f'      <div className="sketch-component sketch-default" data-id="{comp_id}"></div>')
        
        return '\n'.join(jsx_lines) if jsx_lines else '      <div>No components</div>'
    
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


def integrate_react_output(layout_dict: Dict[str, Any], image_description: str = "", image_data: str = "") -> Dict[str, Any]:
    """
    Main function to generate React output from layout.
    
    Ensures:
    - Output is React only
    - Layout structure is validated
    - Deterministic template selection
    - Provider trace is logged with image context
    
    Args:
        layout_dict: Layout specification (must have exact format)
        image_description: Optional description for intent detection
        image_data: Optional base64-encoded image data
    
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
    result = generator.generate(layout_dict, image_description, image_data)
    
    # Log provider trace
    logger.info("Provider Trace:")
    for i, trace in enumerate(result['provider_trace'], 1):
        logger.info(f"  {i}. {trace['provider']}: {trace['status']}")
        if 'error' in trace:
            logger.error(f"     Error: {trace['error']}")
    
    logger.info("=" * 80)
    
    return result
