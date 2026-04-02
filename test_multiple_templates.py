"""
Comprehensive test of different template types without needing HTTP server
"""
import sys
from pathlib import Path
import random

# Add backend to path
backend_path = Path("backend")
sys.path.insert(0, str(backend_path))

# Import the functions directly
from detector import detect_components
from layout_engine import build_layout_tree
from code_generator import generate_html

# Get test images
dataset_path = Path("sketch2code_dataset_v1_cleaned")
test_images = sorted(list(dataset_path.glob("*.png")))

if not test_images:
    print("ERROR: No test images found")
    sys.exit(1)

# Pick 6 random images for testing
test_images = random.sample(test_images, min(6, len(test_images)))

print(f"Testing {len(test_images)} random images from the dataset")
print("=" * 80)

results = []

for idx, test_image_path in enumerate(test_images, 1):
    print(f"\n[{idx}/{len(test_images)}] Testing: {test_image_path.name}")
    print("-" * 80)
    
    try:
        # Detect components
        detection_result = detect_components(test_image_path)
        components = detection_result["layout"]
        
        # Build layout tree
        layout_tree = build_layout_tree(
            detection_result, 
            description='Auto-detected layout'
        )
        
        # Generate HTML
        result = generate_html(layout_tree)
        html = result.get('html', '') if isinstance(result, dict) else result
        
        # Extract template
        template = layout_tree.get('template', 'unknown')
        
        # Check for markers
        has_signin = 'Sign in' in html
        has_email = 'Email' in html or 'email' in html
        has_password = 'Password' in html or 'password' in html
        has_dashboard = 'Dashboard' in html or 'dashboard' in html
        has_gallery = 'Gallery' in html or 'gallery' in html
        has_wireframe = 'CUDA Sketch Layout' in html
        
        # Determine if rendering looks correct
        is_correct = not has_wireframe
        
        results.append({
            'image': test_image_path.name,
            'template': template,
            'is_correct': is_correct,
            'has_signin': has_signin,
            'has_email': has_email,
            'has_password': has_password,
            'has_dashboard': has_dashboard,
            'has_gallery': has_gallery,
            'has_wireframe': has_wireframe,
        })
        
        # Print result
        status = "[PASS]" if is_correct else "[FAIL]"
        print(f"  Template: {template}")
        print(f"  Status: {status}")
        print(f"  Markers:")
        print(f"    - Wireframe: {has_wireframe}")
        if template == 'login':
            print(f"    - Sign In: {has_signin}, Email: {has_email}, Password: {has_password}")
        elif template == 'dashboard':
            print(f"    - Dashboard: {has_dashboard}")
        elif template == 'gallery':
            print(f"    - Gallery: {has_gallery}")
            
    except Exception as e:
        print(f"  ERROR: {e}")
        results.append({
            'image': test_image_path.name,
            'template': 'error',
            'is_correct': False,
            'error': str(e),
        })

# Summary
print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)

correct_count = sum(1 for r in results if r.get('is_correct', False))
error_count = sum(1 for r in results if r.get('template') == 'error')
wireframe_count = sum(1 for r in results if r.get('has_wireframe', False))

print(f"Total tests: {len(results)}")
print(f"Passed: {correct_count}")
print(f"Failed: {len(results) - correct_count}")
print(f"Errors: {error_count}")
print(f"Wireframe bug detections: {wireframe_count}")

print("\nBreakdown by template:")
templates = set(r['template'] for r in results)
for tmpl in sorted(templates):
    count = sum(1 for r in results if r['template'] == tmpl)
    correct = sum(1 for r in results if r['template'] == tmpl and r.get('is_correct'))
    print(f"  {tmpl}: {correct}/{count} correct")

if wireframe_count > 0:
    print(f"\n[ISSUE] {wireframe_count} images still rendering wireframes!")
elif error_count > 0:
    print(f"\n[ISSUE] {error_count} errors occurred!")
else:
    print("\n[SUCCESS] All tests passed! Template rendering is working correctly.")
