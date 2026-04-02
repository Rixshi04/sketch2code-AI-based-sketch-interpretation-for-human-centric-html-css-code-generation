#!/usr/bin/env python
"""
COMPREHENSIVE TEST: Check ALL errors in the entire system
"""

import sys
import json
sys.path.insert(0, r'C:\Users\Rishi\OneDrive\Desktop\final project 0')

print("\n" + "=" * 80)
print("COMPREHENSIVE SYSTEM TEST")
print("=" * 80 + "\n")

# TEST 1: Import all modules
print("TEST 1: Importing all modules...")
try:
    from backend.react_generator import integrate_react_output, LayoutValidator, ReactGenerator, IntentDetector
    from backend.layout_engine import build_layout_tree
    from backend.main import _generate_fallback_react
    print("[OK] All imports successful\n")
except Exception as e:
    print(f"[FAIL] Import failed: {e}\n")
    sys.exit(1)

# TEST 2: Test fallback layout generation
print("TEST 2: Testing _generate_fallback_react()...")
try:
    fallback_layout = {
        "layout": [
            {"type": "header", "x": 0, "y": 0, "width": 800, "height": 100, "ink_ratio": 0.3},
            {"type": "main", "x": 0, "y": 100, "width": 800, "height": 400, "ink_ratio": 0.4},
            {"type": "footer", "x": 0, "y": 500, "width": 800, "height": 100, "ink_ratio": 0.3},
        ],
        "analysis": {"template": "landing", "confidence": 0.1, "processing_method": "fallback"},
        "description": "test",
        "template": "landing",
    }
    fallback_code = _generate_fallback_react(fallback_layout)
    assert "import React" in fallback_code
    assert "export default" in fallback_code
    print("[OK] Fallback React generation works\n")
except Exception as e:
    print(f"[FAIL] Fallback generation failed: {e}\n")
    sys.exit(1)

# TEST 3: Test layout_engine.build_layout_tree
print("TEST 3: Testing layout_engine.build_layout_tree()...")
try:
    detected = {
        "layout": [
            {"type": "header", "x": 0, "y": 0, "width": 800, "height": 80, "ink_ratio": 0.3},
            {"type": "main", "x": 0, "y": 100, "width": 800, "height": 400, "ink_ratio": 0.5},
        ],
        "analysis": {"template": "landing", "confidence": 0.5, "processing_method": "test"},
        "description": "test",
        "template": "landing",
    }
    layout_tree = build_layout_tree(detected, description="test")
    
    # Check that rows are created correctly
    assert 'rows' in layout_tree, "Missing 'rows' in layout_tree"
    assert isinstance(layout_tree['rows'], list), "rows should be a list"
    assert len(layout_tree['rows']) > 0, "rows should not be empty"
    
    # Check row structure
    for i, row in enumerate(layout_tree['rows']):
        assert 'y' in row, f"Row {i} missing 'y'"
        assert 'components' in row, f"Row {i} missing 'components'"
        assert isinstance(row['components'], list), f"Row {i} components should be list"
        for j, comp in enumerate(row['components']):
            assert isinstance(comp, dict), f"Row {i} component {j} should be dict (full object)"
            assert 'type' in comp, f"Row {i} component {j} missing 'type'"
    
    print("[OK] Layout tree building works correctly\n")
except Exception as e:
    print(f"[FAIL] Layout tree test failed: {e}\n")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# TEST 4: Full integration test
print("TEST 4: Full integration test (pipeline -> layout tree -> React generator)...")
try:
    # Simulate hybrid pipeline output
    pipeline_result = {
        'layout': [
            {"type": "header", "x": 0, "y": 0, "width": 800, "height": 80, "ink_ratio": 0.3},
            {"type": "main", "x": 0, "y": 100, "width": 800, "height": 400, "ink_ratio": 0.5},
            {"type": "footer", "x": 0, "y": 520, "width": 800, "height": 80, "ink_ratio": 0.3},
        ],
        'template': 'landing',
        'confidence': 0.7,
        'processing_method': 'gpu',
    }
    
    # Build detected layout
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
        "description": "Landing page with header, main content, and footer",
        "template": pipeline_result.get('template', 'unknown'),
    }
    
    # Build layout tree
    layout_tree = build_layout_tree(detected, description=detected["description"])
    detected['rows'] = layout_tree.get('rows', [])
    detected['sections'] = layout_tree.get('sections', [])
    
    # Validate detected layout
    is_valid, error = LayoutValidator.validate_layout(detected)
    if not is_valid:
        raise Exception(f"Layout validation failed: {error}")
    
    # Generate React code
    react_result = integrate_react_output(
        detected,
        image_description=detected["description"],
        image_data=""
    )
    
    assert react_result['valid'], f"React generation failed: {react_result.get('error')}"
    assert react_result['code'] is not None, "Generated code is None"
    assert "import React" in react_result['code'], "Code doesn't import React"
    assert "export default" in react_result['code'], "Code doesn't export component"
    assert len(react_result['provider_trace']) > 0, "Provider trace is empty"
    
    print("[OK] Full integration test PASSED\n")
    print("Generated React code (first 400 chars):")
    print(react_result['code'][:400])
    print("\nProvider trace:")
    for trace in react_result['provider_trace']:
        print(f"  - {trace['provider']}: {trace['status']}")
    
except Exception as e:
    print(f"[FAIL] Integration test failed: {e}\n")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# TEST 5: Test with actual negative dimensions (should fail)
print("\nTEST 5: Negative dimension rejection...")
try:
    bad_layout = {
        "layout": [
            {"type": "button", "x": 100, "y": 50, "width": -25, "height": 40, "ink_ratio": 0.8},  # NEGATIVE WIDTH
        ],
        "analysis": {"template": "landing", "confidence": 0.9, "processing_method": "test"},
        "template": "landing",
        "rows": [{"y": 50, "components": [
            {"type": "button", "x": 100, "y": 50, "width": -25, "height": 40, "ink_ratio": 0.8}
        ]}],
        "sections": [{"name": "test", "kind": "button"}],
        "description": "test"
    }
    
    is_valid, error = LayoutValidator.validate_layout(bad_layout)
    assert not is_valid, "Should reject negative dimensions"
    assert "negative" in error.lower(), f"Error message should mention negative: {error}"
    print(f"[OK] Correctly rejected negative dimensions: {error}\n")
except Exception as e:
    print(f"[FAIL] Negative dimension test failed: {e}\n")
    sys.exit(1)

# TEST 6: Test intent detection
print("TEST 6: Intent detection (deterministic, no randomness)...")
try:
    test_cases = [
        ("login form with password", "login", 0.95),
        ("dashboard with analytics", "dashboard", 0.95),
        ("product gallery", "gallery", 0.95),
        ("registration form", "form", 0.95),
        ("landing page", "landing", 0.95),
        ("generic page", "landing", 0.50),
    ]
    
    for description, expected_template, expected_confidence in test_cases:
        template, confidence = IntentDetector.detect_intent(description, [])
        assert template == expected_template, f"Expected {expected_template}, got {template} for '{description}'"
        assert confidence == expected_confidence, f"Expected confidence {expected_confidence}, got {confidence}"
    
    print("[OK] Intent detection works correctly (deterministic)\n")
except Exception as e:
    print(f"[FAIL] Intent detection test failed: {e}\n")
    sys.exit(1)

print("=" * 80)
print("ALL TESTS PASSED - SYSTEM IS WORKING CORRECTLY")
print("=" * 80)
print("\nKey validations:")
print("[OK] React generator works")
print("[OK] Layout validation enforces spec")
print("[OK] Negative dimensions are rejected")
print("[OK] Row structure with full components validated")
print("[OK] Intent detection is deterministic")
print("[OK] Full pipeline integration works")
print("[OK] Provider trace logging works")
print("\nReady for production deployment!")
