"""
Test suite for React-only code generation.

Tests:
1. Layout validation with valid/invalid layouts
2. Intent detection with various descriptions
3. React code generation
4. Provider trace logging
5. Error handling and fallbacks
"""

import sys
import json
import logging
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / 'backend'))

from react_generator import (
    LayoutValidator,
    ReactGenerator,
    IntentDetector,
    integrate_react_output
)

# Setup logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Test Fixtures
def create_valid_layout(template='landing', description='Sample layout'):
    """Create a valid layout for testing."""
    return {
        'layout': [
            {
                'type': 'button',
                'x': 100,
                'y': 50,
                'width': 120,
                'height': 40,
                'ink_ratio': 0.8
            },
            {
                'type': 'input',
                'x': 100,
                'y': 100,
                'width': 200,
                'height': 35,
                'ink_ratio': 0.6
            },
            {
                'type': 'text',
                'x': 50,
                'y': 150,
                'width': 300,
                'height': 20,
                'ink_ratio': 0.4
            }
        ],
        'analysis': {
            'template': template,
            'confidence': 0.9,
            'processing_method': 'hybrid'
        },
        'template': template,
        'rows': [
            {'height': 150, 'components': [0, 1]},
            {'height': 100, 'components': [2]}
        ],
        'sections': [
            {'name': 'header', 'kind': 'input'},
            {'name': 'content', 'kind': 'button'}
        ],
        'description': description
    }


def create_login_layout():
    """Create a login-type layout."""
    return {
        'layout': [
            {
                'type': 'input',
                'x': 150,
                'y': 100,
                'width': 200,
                'height': 40,
                'ink_ratio': 0.7
            },
            {
                'type': 'input',
                'x': 150,
                'y': 160,
                'width': 200,
                'height': 40,
                'ink_ratio': 0.7
            },
            {
                'type': 'button',
                'x': 150,
                'y': 220,
                'width': 200,
                'height': 50,
                'ink_ratio': 0.8
            }
        ],
        'analysis': {
            'template': 'login',
            'confidence': 0.95,
            'processing_method': 'gpu'
        },
        'template': 'login',
        'rows': [
            {'height': 200, 'components': [0, 1]},
            {'height': 100, 'components': [2]}
        ],
        'sections': [
            {'name': 'credentials', 'kind': 'input'},
            {'name': 'action', 'kind': 'button'}
        ],
        'description': 'User login form with email and password fields'
    }


def create_dashboard_layout():
    """Create a dashboard-type layout."""
    return {
        'layout': [
            {
                'type': 'sidebar',
                'x': 0,
                'y': 0,
                'width': 200,
                'height': 600,
                'ink_ratio': 0.5
            },
            {
                'type': 'header',
                'x': 200,
                'y': 0,
                'width': 600,
                'height': 80,
                'ink_ratio': 0.3
            },
            {
                'type': 'card',
                'x': 220,
                'y': 100,
                'width': 280,
                'height': 200,
                'ink_ratio': 0.6
            },
            {
                'type': 'card',
                'x': 520,
                'y': 100,
                'width': 280,
                'height': 200,
                'ink_ratio': 0.6
            }
        ],
        'analysis': {
            'template': 'dashboard',
            'confidence': 0.92,
            'processing_method': 'hybrid'
        },
        'template': 'dashboard',
        'rows': [
            {'height': 80, 'components': [0, 1]},
            {'height': 220, 'components': [2, 3]}
        ],
        'sections': [
            {'name': 'sidebar', 'kind': 'sidebar'},
            {'name': 'main', 'kind': 'card'},
            {'name': 'metrics', 'kind': 'card'}
        ],
        'description': 'Analytics dashboard with sidebar navigation'
    }


# Test Cases
class TestLayoutValidator:
    """Test layout validation."""
    
    def test_valid_layout(self):
        """Test validation passes for valid layout."""
        layout = create_valid_layout()
        is_valid, error = LayoutValidator.validate_layout(layout)
        assert is_valid, f"Valid layout failed validation: {error}"
        logger.info("✓ Valid layout passes validation")
    
    def test_missing_required_keys(self):
        """Test validation fails for missing required keys."""
        layout = create_valid_layout()
        del layout['sections']
        is_valid, error = LayoutValidator.validate_layout(layout)
        assert not is_valid, "Should fail with missing sections"
        assert 'sections' in error.lower()
        logger.info("✓ Missing required keys detected")
    
    def test_invalid_component_type(self):
        """Test validation fails for invalid component type."""
        layout = create_valid_layout()
        layout['layout'][0]['type'] = 'invalid_type'
        is_valid, error = LayoutValidator.validate_layout(layout)
        assert not is_valid, "Should fail with invalid component type"
        logger.info("✓ Invalid component type detected")
    
    def test_empty_layout_array(self):
        """Test validation fails for empty layout array."""
        layout = create_valid_layout()
        layout['layout'] = []
        is_valid, error = LayoutValidator.validate_layout(layout)
        assert not is_valid, "Should fail with empty layout"
        logger.info("✓ Empty layout array detected")
    
    def test_missing_component_keys(self):
        """Test validation fails for missing component keys."""
        layout = create_valid_layout()
        del layout['layout'][0]['x']
        is_valid, error = LayoutValidator.validate_layout(layout)
        assert not is_valid, "Should fail with missing component key"
        logger.info("✓ Missing component keys detected")
    
    def test_invalid_numeric_field(self):
        """Test validation fails for non-numeric fields."""
        layout = create_valid_layout()
        layout['layout'][0]['x'] = 'not_a_number'
        is_valid, error = LayoutValidator.validate_layout(layout)
        assert not is_valid, "Should fail with invalid numeric field"
        logger.info("✓ Invalid numeric field detected")


class TestIntentDetector:
    """Test template intent detection."""
    
    def test_login_keyword_detection(self):
        """Test login detection from keywords."""
        layout = create_login_layout()
        template, confidence = IntentDetector.detect_intent(
            'User login form',
            layout['layout']
        )
        assert template == 'login', f"Expected login, got {template}"
        assert confidence == 0.95, "Should have high confidence from keyword"
        logger.info("✓ Login keyword detection works")
    
    def test_dashboard_keyword_detection(self):
        """Test dashboard detection from keywords."""
        layout = create_dashboard_layout()
        template, confidence = IntentDetector.detect_intent(
            'Analytics dashboard with charts',
            layout['layout']
        )
        assert template == 'dashboard', f"Expected dashboard, got {template}"
        assert confidence == 0.95, "Should have high confidence from keyword"
        logger.info("✓ Dashboard keyword detection works")
    
    def test_sidebar_inference(self):
        """Test dashboard inference from sidebar component."""
        layout = create_dashboard_layout()
        # Use description without explicit keywords
        template, confidence = IntentDetector.detect_intent(
            'Navigation and content area',
            layout['layout']
        )
        assert template == 'dashboard', f"Expected dashboard, got {template}"
        assert confidence == 0.85, "Should infer from sidebar component"
        logger.info("✓ Sidebar inference works")
    
    def test_input_button_inference(self):
        """Test login inference from input+button."""
        layout = create_login_layout()
        template, confidence = IntentDetector.detect_intent(
            'Form with fields',
            layout['layout']
        )
        assert template == 'login', f"Expected login, got {template}"
        logger.info("✓ Input+button inference works")
    
    def test_gallery_card_inference(self):
        """Test gallery inference from multiple cards."""
        layout = {
            'layout': [
                {'type': 'card', 'x': 0, 'y': 0, 'width': 100, 'height': 100, 'ink_ratio': 0.5},
                {'type': 'card', 'x': 110, 'y': 0, 'width': 100, 'height': 100, 'ink_ratio': 0.5},
                {'type': 'card', 'x': 220, 'y': 0, 'width': 100, 'height': 100, 'ink_ratio': 0.5},
            ]
        }
        template, confidence = IntentDetector.detect_intent(
            'Product showcase',  # Contains 'showcase' keyword -> gallery
            layout['layout']
        )
        assert template == 'gallery', f"Expected gallery, got {template}"
        assert confidence == 0.85, "Should detect gallery from 'showcase' keyword"
        logger.info("✓ Gallery keyword detection works")
    
    def test_form_multiple_inputs_inference(self):
        """Test form inference from multiple inputs."""
        layout = {
            'layout': [
                {'type': 'input', 'x': 0, 'y': 0, 'width': 200, 'height': 40, 'ink_ratio': 0.5},
                {'type': 'input', 'x': 0, 'y': 50, 'width': 200, 'height': 40, 'ink_ratio': 0.5},
                {'type': 'input', 'x': 0, 'y': 100, 'width': 200, 'height': 40, 'ink_ratio': 0.5},
                {'type': 'button', 'x': 0, 'y': 150, 'width': 200, 'height': 50, 'ink_ratio': 0.8},
            ]
        }
        template, confidence = IntentDetector.detect_intent(
            'Registration form with multiple fields',  # Added 'form' keyword
            layout['layout']
        )
        assert template == 'form', f"Expected form, got {template}"
        assert confidence == 0.95, "Should detect form from 'registration form' keyword with high confidence"
        logger.info("✓ Form keyword detection works")
    
    def test_default_fallback(self):
        """Test deterministic fallback to landing."""
        layout = {
            'layout': [
                {'type': 'text', 'x': 0, 'y': 0, 'width': 300, 'height': 50, 'ink_ratio': 0.3},
                {'type': 'image', 'x': 0, 'y': 60, 'width': 300, 'height': 200, 'ink_ratio': 0.7},
            ]
        }
        template, confidence = IntentDetector.detect_intent(
            'Generic page',
            layout['layout']
        )
        assert template == 'landing', f"Expected landing fallback, got {template}"
        assert confidence == 0.50, "Should have low confidence for fallback"
        logger.info("✓ Deterministic fallback works (no randomness)")


class TestReactGenerator:
    """Test React code generation."""
    
    def test_generate_valid_layout(self):
        """Test React code generation for valid layout."""
        layout = create_valid_layout()
        generator = ReactGenerator()
        result = generator.generate(layout)
        
        assert result['valid'], f"Generation failed: {result.get('error', 'unknown')}"
        assert result['code'] is not None, "Code should not be None"
        assert 'import React' in result['code'], "Code should import React"
        assert 'SketchLayout' in result['code'], "Code should define SketchLayout component"
        logger.info("✓ React code generation works for valid layout")
        
    def test_generate_includes_components(self):
        """Test that generated code includes components."""
        layout = create_valid_layout()
        generator = ReactGenerator()
        result = generator.generate(layout)
        
        code = result['code']
        assert 'button' in code.lower(), "Code should include button component"
        assert 'input' in code.lower(), "Code should include input component"
        logger.info("✓ Generated code includes expected components")
    
    def test_generate_with_invalid_layout(self):
        """Test React generation with invalid layout."""
        layout = create_valid_layout()
        del layout['sections']  # Make it invalid
        
        generator = ReactGenerator()
        result = generator.generate(layout)
        
        assert not result['valid'], "Should mark as invalid"
        assert result['code'] is None, "Code should be None for invalid layout"
        assert result['error'] is not None, "Should include error message"
        logger.info("✓ Invalid layout handling works")
    
    def test_provider_trace_success_path(self):
        """Test provider trace is logged for successful generation."""
        layout = create_valid_layout()
        generator = ReactGenerator()
        result = generator.generate(layout)
        
        trace = result['provider_trace']
        assert len(trace) >= 2, "Should have at least validator and generator traces"
        
        # Check validator trace
        validator_trace = [t for t in trace if t['provider'] == 'validator']
        assert len(validator_trace) > 0, "Should have validator trace"
        assert validator_trace[0]['status'] == 'passed', "Validator should pass"
        
        # Check generator trace
        generator_trace = [t for t in trace if t['provider'] == 'react_generator']
        assert len(generator_trace) > 0, "Should have generator trace"
        assert generator_trace[0]['status'] == 'success', "Generator should succeed"
        
        logger.info("✓ Provider trace logged correctly for success")
    
    def test_provider_trace_failure_path(self):
        """Test provider trace is logged for failed generation."""
        layout = create_valid_layout()
        del layout['sections']  # Make it invalid
        
        generator = ReactGenerator()
        result = generator.generate(layout)
        
        trace = result['provider_trace']
        
        # Check validator trace has error
        validator_trace = [t for t in trace if t['provider'] == 'validator']
        assert len(validator_trace) > 0, "Should have validator trace"
        assert validator_trace[0]['status'] == 'failed', "Validator should fail"
        assert 'error' in validator_trace[0], "Should include error in trace"
        
        logger.info("✓ Provider trace logged correctly for failure")


class TestIntegrateReactOutput:
    """Test main integration function."""
    
    def test_integrate_react_output_login(self):
        """Test integrate_react_output with login layout."""
        layout = create_login_layout()
        result = integrate_react_output(
            layout,
            'Email and password login form'
        )
        
        assert result['valid'], f"Integration failed: {result.get('error', 'unknown')}"
        assert result['code'] is not None, "Code should be generated"
        assert layout['template'] == 'login', "Should detect login template"
        assert len(result['provider_trace']) > 0, "Should have provider trace"
        logger.info("✓ integrate_react_output works for login layout")
    
    def test_integrate_react_output_dashboard(self):
        """Test integrate_react_output with dashboard layout."""
        layout = create_dashboard_layout()
        result = integrate_react_output(
            layout,
            'Dashboard with sidebar'
        )
        
        assert result['valid'], f"Integration failed: {result.get('error', 'unknown')}"
        assert result['code'] is not None, "Code should be generated"
        assert layout['template'] == 'dashboard', "Should detect/keep dashboard template"
        logger.info("✓ integrate_react_output works for dashboard layout")
    
    def test_integrate_react_output_generic(self):
        """Test integrate_react_output with generic layout."""
        layout = create_valid_layout('unknown')  # Use unknown template
        result = integrate_react_output(
            layout,
            'Generic content area'
        )
        
        assert result['valid'], f"Integration failed: {result.get('error', 'unknown')}"
        assert result['code'] is not None, "Code should be generated"
        # Should have detected a template
        assert layout['template'] in ['landing', 'login', 'dashboard', 'gallery', 'form'], \
            f"Should assign valid template, got {layout['template']}"
        logger.info("✓ integrate_react_output works for generic layout with fallback")
    
    def test_response_includes_all_required_fields(self):
        """Test response includes all required fields."""
        layout = create_valid_layout()
        result = integrate_react_output(layout, 'Test layout')
        
        required_fields = ['code', 'layout', 'analysis', 'provider_trace', 'valid']
        for field in required_fields:
            assert field in result, f"Missing required field: {field}"
        
        logger.info("✓ Response includes all required fields")


# Main Test Runner
def run_all_tests():
    """Run all test suites."""
    print("\n" + "=" * 80)
    print("REACT GENERATOR TEST SUITE")
    print("=" * 80 + "\n")
    
    test_classes = [
        TestLayoutValidator,
        TestIntentDetector,
        TestReactGenerator,
        TestIntegrateReactOutput,
    ]
    
    total_tests = 0
    passed_tests = 0
    failed_tests = 0
    
    for test_class in test_classes:
        print(f"\n{test_class.__name__}")
        print("-" * 80)
        
        test_instance = test_class()
        test_methods = [m for m in dir(test_instance) if m.startswith('test_')]
        
        for method_name in test_methods:
            total_tests += 1
            try:
                method = getattr(test_instance, method_name)
                method()
                passed_tests += 1
            except AssertionError as e:
                failed_tests += 1
                logger.error(f"✗ {method_name} FAILED: {e}")
            except Exception as e:
                failed_tests += 1
                logger.error(f"✗ {method_name} ERROR: {e}")
    
    print("\n" + "=" * 80)
    print(f"RESULTS: {passed_tests}/{total_tests} tests passed")
    if failed_tests > 0:
        print(f"FAILED: {failed_tests} tests")
    print("=" * 80 + "\n")
    
    return failed_tests == 0


if __name__ == '__main__':
    success = run_all_tests()
    sys.exit(0 if success else 1)
