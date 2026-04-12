"""
React-Only Code Generator

Generates ONLY React/JSX code output with strict layout format compliance.
- No HTML-only output
- Follows exact layout specification with rows containing full components
- Deterministic template selection
- Provider trace logging with image context
- Inline styles for geometry; optional CSS classes for labels
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
                # Normalize unknown types to 'container' instead of failing
                comp['type'] = 'container'
            
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
        
        # Sections are optional — skip strict validation so empty sections don't fail
        # (rows may be populated even when sections are empty)
        
        return True, ""


def coerce_layout_numeric_values(layout_dict: Dict[str, Any]) -> None:
    """Pipeline/JSON may yield str or numpy scalars — normalize so validation and % formatting never crash."""

    def _as_int(v: Any, default: int) -> int:
        if v is None:
            return default
        if isinstance(v, bool):
            return int(v)
        if isinstance(v, int):
            return v
        if isinstance(v, float):
            return int(v)
        try:
            return int(float(str(v).strip()))
        except (ValueError, TypeError):
            return default

    def _as_float(v: Any, default: float) -> float:
        if v is None:
            return default
        if isinstance(v, bool):
            return float(int(v))
        if isinstance(v, (int, float)):
            return float(v)
        try:
            return float(str(v).strip())
        except (ValueError, TypeError):
            return default

    for comp in layout_dict.get("layout", []):
        if not isinstance(comp, dict):
            continue
        comp["x"] = _as_int(comp.get("x"), 0)
        comp["y"] = _as_int(comp.get("y"), 0)
        comp["width"] = max(1, _as_int(comp.get("width"), 1))
        comp["height"] = max(1, _as_int(comp.get("height"), 1))
        comp["ink_ratio"] = _as_float(comp.get("ink_ratio"), 0.5)

    for row in layout_dict.get("rows", []):
        if not isinstance(row, dict):
            continue
        row["y"] = _as_int(row.get("y"), 0)
        for comp in row.get("components", []):
            if not isinstance(comp, dict):
                continue
            comp["x"] = _as_int(comp.get("x"), 0)
            comp["y"] = _as_int(comp.get("y"), 0)
            comp["width"] = max(1, _as_int(comp.get("width"), 1))
            comp["height"] = max(1, _as_int(comp.get("height"), 1))
            comp["ink_ratio"] = _as_float(comp.get("ink_ratio"), 0.5)

    analysis = layout_dict.get("analysis")
    if isinstance(analysis, dict) and "confidence" in analysis:
        analysis["confidence"] = _as_float(analysis.get("confidence"), 0.5)


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
        
        coerce_layout_numeric_values(layout_dict)
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
    
    @staticmethod
    def _jsx_style(comp: Dict[str, Any], comp_type: str) -> str:
        """JSX style object: geometry + type-specific polish (shadows, gradients, motion)."""
        x = int(comp.get("x", 0))
        y = int(comp.get("y", 0))
        w = max(1, int(comp.get("width", 1)))
        h = max(1, int(comp.get("height", 1)))
        base = "position: 'absolute', left: %d, top: %d, width: %d, height: %d, boxSizing: 'border-box', transition: 'transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease'" % (
            x,
            y,
            w,
            h,
        )
        t = (comp_type or "container").lower()
        extras: Dict[str, str] = {
            "button": "borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontWeight: 600, fontSize: 14, boxShadow: '0 6px 20px rgba(99,102,241,0.4)', cursor: 'pointer'",
            "input": "borderRadius: 12, border: '1px solid #cbd5e1', background: 'rgba(255,255,255,0.95)', fontSize: 14, paddingLeft: 12, paddingRight: 12, boxShadow: 'inset 0 1px 2px rgba(15,23,42,0.06)'",
            "header": "borderRadius: 0, background: 'linear-gradient(90deg, #0f172a, #312e81)', color: '#f8fafc', fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', paddingLeft: 20, letterSpacing: '0.03em', boxShadow: '0 4px 24px rgba(15,23,42,0.25)'",
            "footer": "borderRadius: 0, background: '#0f172a', color: '#94a3b8', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 -4px 20px rgba(15,23,42,0.2)'",
            "main": "borderRadius: 14, background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(148,163,184,0.35)', backdropFilter: 'blur(8px)'",
            "card": "borderRadius: 16, background: 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(248,250,252,0.85))', border: '1px solid rgba(148,163,184,0.4)', boxShadow: '0 10px 40px -10px rgba(15,23,42,0.12)'",
            "sidebar": "borderRadius: 0, background: 'linear-gradient(180deg, #1e293b, #0f172a)', color: '#e2e8f0', fontSize: 13, padding: 12, boxShadow: '4px 0 24px rgba(15,23,42,0.15)'",
            "nav": "borderRadius: 12, background: 'rgba(15,23,42,0.06)', display: 'flex', alignItems: 'center', paddingLeft: 16, gap: 12, fontWeight: 600, color: '#334155'",
            "text": "borderRadius: 8, color: '#1e293b', fontSize: 15, lineHeight: 1.5, padding: 8, background: 'rgba(255,255,255,0.5)'",
            "image": "borderRadius: 14, objectFit: 'cover', background: 'linear-gradient(135deg, #e0e7ff, #fae8ff)', border: '1px solid rgba(148,163,184,0.35)'",
            "form": "borderRadius: 16, background: 'rgba(255,255,255,0.65)', border: '1px dashed rgba(99,102,241,0.35)'",
            "section": "borderRadius: 12, background: 'rgba(241,245,249,0.9)', border: '1px solid rgba(148,163,184,0.25)'",
            "container": "borderRadius: 14, background: 'rgba(59,130,246,0.08)', border: '1px dashed rgba(99,102,241,0.35)'",
        }
        extra = extras.get(t, extras["container"])
        # Single { ... } — callers use style={%s}; double braces here would become style={{{...}}} (invalid JSX).
        return "{ %s, %s }" % (base, extra)

    def _generate_react_code(self, layout_dict: Dict[str, Any]) -> str:
        """
        Generate React/JSX only. Positions MUST match layout rows/components exactly.
        Falls back to flat layout array when rows are empty.
        """
        components = layout_dict.get("layout", [])
        rows = layout_dict.get("rows", [])

        # If rows are empty but flat layout has components, generate rows from flat layout
        if not rows and components:
            logger.info("[ReactGenerator] No rows found — generating from flat layout array")
            jsx_body = self._generate_component_jsx_from_flat(components)
        else:
            jsx_body = self._generate_component_jsx_from_rows(rows)

        max_r = 520
        max_b = 680
        for c in components:
            if isinstance(c, dict):
                max_r = max(max_r, int(c.get("x", 0)) + max(1, int(c.get("width", 0))))
                max_b = max(max_b, int(c.get("y", 0)) + max(1, int(c.get("height", 0))))

        # Do not use %% on full template — jsx_body may contain "%" (e.g. data: URLs).
        head = """import React from 'react';
import './SketchLayout.css';

export default function SketchLayout() {
  const [vibe, setVibe] = React.useState(0);
  return (
    <div
      className="sketch-layout"
      style={{ position: 'relative', width: %d, height: %d, margin: '0 auto', borderRadius: 20, overflow: 'hidden',
        border: '1px solid rgba(148,163,184,0.35)', boxSizing: 'border-box',
        background: 'linear-gradient(165deg, #f8fafc, #eef2ff, #faf5ff)',
        boxShadow: '0 25px 50px -12px rgba(15,23,42,0.15)' }}
    >
      <button type="button" className="sketch-vibe-fab" onClick={() => setVibe(v => v + 1)} aria-label="Interactive vibe"
        style={{ position: 'absolute', top: 10, right: 10, zIndex: 50, padding: '8px 14px', borderRadius: 999, border: 'none',
          background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(99,102,241,0.45)' }}>
        Vibe {vibe}
      </button>
""" % (
            max_r,
            max_b,
        )
        tail = """    </div>
  );
}
"""
        return head + jsx_body + "\n" + tail

    def _generate_component_jsx_from_rows(self, rows: List[Dict[str, Any]]) -> str:
        """One DOM node per row component; geometry from JSON only (deterministic)."""
        jsx_lines: List[str] = []

        for row_idx, row in enumerate(rows):
            row_components = row.get("components", [])

            for comp_idx, comp in enumerate(row_components):
                if not isinstance(comp, dict):
                    continue
                comp_type = comp.get("type", "div")
                st = self._jsx_style(comp, comp_type)
                comp_id = "r%d-c%d-%s" % (row_idx, comp_idx, comp_type)
                data_attrs = 'data-id="%s" data-type="%s"' % (comp_id, comp_type)

                if comp_type == "button":
                    jsx_lines.append(
                        "      <button type=\"button\" className=\"sketch-component sketch-button\" %s style={%s}>Button</button>"
                        % (data_attrs, st)
                    )
                elif comp_type == "input":
                    jsx_lines.append(
                        "      <input type=\"text\" className=\"sketch-component sketch-input\" %s style={%s} placeholder=\"\" />"
                        % (data_attrs, st)
                    )
                elif comp_type == "image":
                    jsx_lines.append(
                        "      <img src=\"data:image/svg+xml,%%3Csvg xmlns='http://www.w3.org/2000/svg'/%%3E\" alt=\"\" className=\"sketch-component sketch-image\" %s style={%s} />"
                        % (data_attrs, st)
                    )
                elif comp_type == "text":
                    jsx_lines.append(
                        "      <p className=\"sketch-component sketch-text\" %s style={%s}>Text</p>"
                        % (data_attrs, st)
                    )
                elif comp_type == "header":
                    jsx_lines.append(
                        "      <header className=\"sketch-component sketch-header\" %s style={%s}>Header</header>"
                        % (data_attrs, st)
                    )
                elif comp_type == "card":
                    jsx_lines.append(
                        "      <div className=\"sketch-component sketch-card\" %s style={%s}>Card</div>"
                        % (data_attrs, st)
                    )
                elif comp_type == "section":
                    jsx_lines.append(
                        "      <section className=\"sketch-component sketch-section\" %s style={%s} />"
                        % (data_attrs, st)
                    )
                elif comp_type == "footer":
                    jsx_lines.append(
                        "      <footer className=\"sketch-component sketch-footer\" %s style={%s}>Footer</footer>"
                        % (data_attrs, st)
                    )
                elif comp_type == "sidebar":
                    jsx_lines.append(
                        "      <aside className=\"sketch-component sketch-sidebar\" %s style={%s}>Sidebar</aside>"
                        % (data_attrs, st)
                    )
                elif comp_type == "nav":
                    jsx_lines.append(
                        "      <nav className=\"sketch-component sketch-nav\" %s style={%s}>Nav</nav>"
                        % (data_attrs, st)
                    )
                elif comp_type == "container":
                    jsx_lines.append(
                        "      <div className=\"sketch-component sketch-container\" %s style={%s} />"
                        % (data_attrs, st)
                    )
                elif comp_type == "form":
                    jsx_lines.append(
                        "      <form className=\"sketch-component sketch-form\" %s style={%s} />"
                        % (data_attrs, st)
                    )
                elif comp_type == "main":
                    jsx_lines.append(
                        "      <main className=\"sketch-component sketch-main\" %s style={%s} />"
                        % (data_attrs, st)
                    )
                else:
                    jsx_lines.append(
                        "      <div className=\"sketch-component sketch-default\" %s style={%s} />"
                        % (data_attrs, st)
                    )

        return "\n".join(jsx_lines) if jsx_lines else "      <div style={{ padding: '20px', color: '#64748b' }}>No components detected</div>"

    def _generate_component_jsx_from_flat(self, components: List[Dict[str, Any]]) -> str:
        """Generate JSX from flat layout array (when rows are not available)."""
        jsx_lines: List[str] = []
        for comp_idx, comp in enumerate(components):
            if not isinstance(comp, dict):
                continue
            comp_type = comp.get("type", "container")
            st = self._jsx_style(comp, comp_type)
            comp_id = "comp-%d-%s" % (comp_idx, comp_type)
            data_attrs = 'data-id="%s" data-type="%s"' % (comp_id, comp_type)

            if comp_type == "button":
                jsx_lines.append(
                    "      <button type=\"button\" className=\"sketch-component sketch-button\" %s style={%s}>Button</button>"
                    % (data_attrs, st)
                )
            elif comp_type == "input":
                jsx_lines.append(
                    "      <input type=\"text\" className=\"sketch-component sketch-input\" %s style={%s} placeholder=\"Enter text...\" />"
                    % (data_attrs, st)
                )
            elif comp_type == "header":
                jsx_lines.append(
                    "      <header className=\"sketch-component sketch-header\" %s style={%s}>Header</header>"
                    % (data_attrs, st)
                )
            elif comp_type == "footer":
                jsx_lines.append(
                    "      <footer className=\"sketch-component sketch-footer\" %s style={%s}>Footer</footer>"
                    % (data_attrs, st)
                )
            elif comp_type == "sidebar":
                jsx_lines.append(
                    "      <aside className=\"sketch-component sketch-sidebar\" %s style={%s}>Sidebar</aside>"
                    % (data_attrs, st)
                )
            elif comp_type == "text":
                jsx_lines.append(
                    "      <p className=\"sketch-component sketch-text\" %s style={%s}>Text</p>"
                    % (data_attrs, st)
                )
            elif comp_type == "card":
                jsx_lines.append(
                    "      <div className=\"sketch-component sketch-card\" %s style={%s}>Card</div>"
                    % (data_attrs, st)
                )
            elif comp_type == "nav":
                jsx_lines.append(
                    "      <nav className=\"sketch-component sketch-nav\" %s style={%s}>Nav</nav>"
                    % (data_attrs, st)
                )
            elif comp_type == "image":
                jsx_lines.append(
                    "      <img alt=\"\" className=\"sketch-component sketch-image\" %s style={%s} />"
                    % (data_attrs, st)
                )
            elif comp_type == "main":
                jsx_lines.append(
                    "      <main className=\"sketch-component sketch-main\" %s style={%s} />"
                    % (data_attrs, st)
                )
            elif comp_type == "form":
                jsx_lines.append(
                    "      <form className=\"sketch-component sketch-form\" %s style={%s} />"
                    % (data_attrs, st)
                )
            elif comp_type == "section":
                jsx_lines.append(
                    "      <section className=\"sketch-component sketch-section\" %s style={%s} />"
                    % (data_attrs, st)
                )
            else:
                jsx_lines.append(
                    "      <div className=\"sketch-component sketch-container\" %s style={%s} />"
                    % (data_attrs, st)
                )
        return "\n".join(jsx_lines) if jsx_lines else "      <div style={{ padding: '20px', color: '#64748b' }}>No components detected</div>"
    
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
    
    # Keep pipeline template when set; only fill when missing/unknown (no random switching)
    if layout_dict.get('template') in (None, '', 'unknown'):
        layout_dict['template'] = detected_template
        layout_dict.setdefault('analysis', {})
        if isinstance(layout_dict['analysis'], dict):
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
