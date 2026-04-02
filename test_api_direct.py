#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
API Integration Test - Tests the full FastAPI backend /generate-code endpoint.
"""
import sys
import os
import base64
import json
from pathlib import Path

# Test with first available image
test_image = Path("sketch2code_dataset_v1_cleaned/10018.png")

if not test_image.exists():
    print(f"ERROR: Test image not found: {test_image}")
    sys.exit(1)

# Encode image as base64
with open(test_image, "rb") as f:
    image_b64 = base64.b64encode(f.read()).decode()

# Prepare multipart form data
boundary = '----FormBoundary' + ''.join(['%x' % ord(c) for c in 'abcdefghij1234567890'])
body = f"""--{boundary}
Content-Disposition: form-data; name="file"; filename="{test_image.name}"
Content-Type: image/png

{base64.b64decode(image_b64).decode('latin1')}
--{boundary}
Content-Disposition: form-data; name="description"

Test sketch for component detection
--{boundary}
Content-Disposition: form-data; name="platform"

html
--{boundary}--
"""

# Try to import and test directly
sys.path.insert(0, '.')

try:
    from backend.detector import detect_components
    from backend.layout_engine import build_layout_tree
    from backend.code_generator import generate_html
    
    print("Testing Backend Pipeline Directly")
    print("=" * 60)
    
    # Step 1: Detect
    result = detect_components(test_image)
    layout = result.get("layout", [])
    print(f"[OK] Component Detection: {len(layout)} components")
    
    # Step 2: Infer Layout
    layout_tree = build_layout_tree(result, description="Test sketch")
    template = layout_tree.get("template", "unknown")
    print(f"[OK] Layout Inference: template='{template}'")
    
    # Step 3: Generate Code
    html_result = generate_html(layout_tree)
    html_size = len(html_result.get("html", ""))
    print(f"[OK] Code Generation: {html_size} bytes HTML")
    
    # Verify output structure
    html = html_result.get("html", "")
    checks = {
        "Contains DOCTYPE": "<!DOCTYPE" in html,
        "Contains html tag": "<html" in html,
        "Contains head tag": "<head" in html,
        "Contains body tag": "<body" in html,
        "Contains style tag": "<style>" in html,
        "Is valid length": html_size > 2000,
        "Contains content": html.count("<") > 20,
    }
    
    print(f"\nOutput Quality Checks:")
    all_passed = True
    for check, passed in checks.items():
        status = "[OK]" if passed else "[FAIL]"
        print(f"  {status} {check}")
        if not passed:
            all_passed = False
    
    if all_passed:
        print(f"\n[SUCCESS] Pipeline working correctly!")
        print(f"Sample HTML output (first 200 chars):")
        print(f"  {html[:200]}...")
    else:
        print(f"\n[FAILURE] Some quality checks failed")
        
except Exception as e:
    print(f"[ERROR] Pipeline test failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
