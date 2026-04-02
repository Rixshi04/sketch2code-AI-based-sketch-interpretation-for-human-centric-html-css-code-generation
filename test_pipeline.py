#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Test script for sketch-to-code pipeline.
Tests detector, layout engine, and code generator with sample images.
"""
import sys
import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

import json
import time
from backend.detector import detect_components
from backend.layout_engine import build_layout_tree
from backend.code_generator import generate_html

def test_detector(image_path: Path):
    """Test component detection on a single image."""
    print(f"\n{'='*60}")
    print(f"Testing: {image_path.name}")
    print(f"{'='*60}")
    
    start = time.time()
    try:
        result = detect_components(image_path)
        elapsed = time.time() - start
        
        layout = result.get("layout", [])
        print(f"[OK] Detector: {len(layout)} components in {elapsed:.2f}s")
        
        # Show component types
        types = {}
        for comp in layout:
            t = comp.get("type", "unknown")
            types[t] = types.get(t, 0) + 1
        print(f"      Types: {types}")
        
        return result
    except Exception as e:
        print(f"[ERROR] Detector: {e}")
        return None

def test_layout_engine(detected):
    """Test layout inference on detected components."""
    try:
        layout_tree = build_layout_tree(detected)
        template = layout_tree.get("template", "unknown")
        rows = layout_tree.get("rows", [])
        print(f"[OK] Layout Engine: template='{template}', {len(rows)} rows")
        return layout_tree
    except Exception as e:
        print(f"[ERROR] Layout Engine: {e}")
        return None

def test_code_generator(layout_tree):
    """Test HTML/CSS generation."""
    try:
        result = generate_html(layout_tree)
        html_len = len(result.get("html", ""))
        css_len = len(result.get("css", ""))
        print(f"[OK] Code Generator: {html_len} bytes HTML, {css_len} bytes CSS")
        return result
    except Exception as e:
        print(f"[ERROR] Code Generator: {e}")
        return None

def main():
    """Run full pipeline tests on sample sketches."""
    dataset_dir = Path("sketch2code_dataset_v1_cleaned")
    
    if not dataset_dir.exists():
        print(f"ERROR: Dataset directory not found: {dataset_dir}")
        return
    
    # Get first 5 test images
    images = sorted(dataset_dir.glob("*.png"))[:5]
    
    if not images:
        print(f"ERROR: No PNG files found in {dataset_dir}")
        return
    
    results = []
    
    for image_path in images:
        detected = test_detector(image_path)
        if detected:
            layout_tree = test_layout_engine(detected)
            if layout_tree:
                html_result = test_code_generator(layout_tree)
                if html_result:
                    results.append({
                        "image": image_path.name,
                        "components": len(detected.get("layout", [])),
                        "template": layout_tree.get("template"),
                        "html_size": len(html_result.get("html", "")),
                        "success": True
                    })
                else:
                    results.append({
                        "image": image_path.name,
                        "success": False,
                        "error": "code_generator_failed"
                    })
    
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    print(f"Total tests: {len(results)}")
    print(f"Passed: {sum(1 for r in results if r.get('success'))}")
    print(f"Failed: {sum(1 for r in results if not r.get('success'))}")
    
    for r in results:
        if r.get("success"):
            print(f"\n[PASS] {r['image']}: {r['components']} components -> {r['template']} -> {r['html_size']} bytes")
        else:
            print(f"\n[FAIL] {r['image']}: {r.get('error', 'unknown error')}")

if __name__ == "__main__":
    main()
