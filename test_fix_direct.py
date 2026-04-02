"""
Direct test of the template rendering fix without needing HTTP server
"""
import sys
from pathlib import Path

# Add backend to path
backend_path = Path("backend")
sys.path.insert(0, str(backend_path))

# Import the functions directly
from detector import detect_components
from layout_engine import build_layout_tree
from code_generator import generate_html
import cv2

# Get test image
dataset_path = Path("sketch2code_dataset_v1_cleaned")
test_image_path = list(dataset_path.glob("*.png"))[0]

print(f"Testing image: {test_image_path.name}")
print("=" * 80)

# Step 1: Load image and detect components
print(f"\n1. COMPONENT DETECTION")
print("=" * 80)
detection_result = detect_components(test_image_path)
components = detection_result["layout"]
print(f"Detected {len(components)} components:")
for comp in components:
    print(f"  - Type: {comp.get('type', 'unknown')}, Position: ({comp.get('x', 0)}, {comp.get('y', 0)}), Size: {comp.get('width', 0)}x{comp.get('height', 0)}")

# Step 2: Build layout tree and detect template
print(f"\n2. TEMPLATE DETECTION")
print("=" * 80)
layout_tree = build_layout_tree(detection_result, description='A login page with email and password')
print(f"Template detected: {layout_tree.get('template', 'NOT FOUND')}")
print(f"Layout sections: {layout_tree.get('sections', [])}")

# Step 3: Generate HTML
print(f"\n3. HTML GENERATION")
print("=" * 80)
result = generate_html(layout_tree)
html = result.get('html', '') if isinstance(result, dict) else result

# Check for template markers
print(f"\n4. TEMPLATE MARKERS CHECK")
print("=" * 80)
print(f"Has 'Sign in' (login): {'Sign in' in html}")
print(f"Has 'Email' (login): {'Email' in html or 'email' in html}")
print(f"Has 'Password' (login): {'Password' in html or 'password' in html}")
print(f"Has 'Dashboard': {'Dashboard' in html}")
print(f"Has 'CUDA Sketch Layout' (wireframe bug): {'CUDA Sketch Layout' in html}")

# Print first part of HTML to see structure
print(f"\n5. HTML CONTENT (first 800 chars)")
print("=" * 80)
print(html[:800])

# Success check
print(f"\n6. RESULT")
print("=" * 80)
if 'Sign in' in html and 'CUDA Sketch Layout' not in html:
    print("[SUCCESS] Template rendering is working correctly!")
    print("   - Detected as 'login' template")
    print("   - Rendered semantic login form (not wireframe)")
elif 'CUDA Sketch Layout' in html:
    print("[FAIL] Still rendering wireframe (old bug not fixed)")
else:
    print("[UNKNOWN] HTML doesn't contain expected markers")
