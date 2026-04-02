#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Comprehensive end-to-end pipeline test with 20+ sketches.
Tests detection, layout inference, code generation, and measures performance metrics.
"""
import sys
import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
from pathlib import Path
sys.path.insert(0, '.')

import json
import time
from backend.detector import detect_components
from backend.layout_engine import build_layout_tree
from backend.code_generator import generate_html

def test_full_pipeline(image_path: Path) -> dict:
    """Run full pipeline on single image and collect metrics."""
    metrics = {
        "image": image_path.name,
        "success": False,
        "error": None,
        "components_detected": 0,
        "template_inferred": None,
        "html_size_bytes": 0,
        "processing_time_ms": 0,
        "component_types": {}
    }
    
    try:
        start = time.time()
        
        # Step 1: Detect components
        detected = detect_components(image_path)
        layout = detected.get("layout", [])
        metrics["components_detected"] = len(layout)
        
        # Count component types
        for comp in layout:
            t = comp.get("type", "unknown")
            metrics["component_types"][t] = metrics["component_types"].get(t, 0) + 1
        
        # Step 2: Build layout tree and infer template
        layout_tree = build_layout_tree(detected)
        metrics["template_inferred"] = layout_tree.get("template", "unknown")
        
        # Step 3: Generate HTML/CSS
        html_result = generate_html(layout_tree)
        metrics["html_size_bytes"] = len(html_result.get("html", ""))
        
        metrics["success"] = True
        metrics["processing_time_ms"] = round((time.time() - start) * 1000, 2)
        
        return metrics
    except Exception as e:
        metrics["error"] = str(e)
        metrics["processing_time_ms"] = round((time.time() - start) * 1000, 2)
        return metrics

def main():
    """Run full suite of tests and generate report."""
    dataset_dir = Path("sketch2code_dataset_v1_cleaned")
    
    if not dataset_dir.exists():
        print(f"ERROR: Dataset directory not found: {dataset_dir}")
        return
    
    # Get up to 20 test images
    images = sorted(dataset_dir.glob("*.png"))[:20]
    
    if not images:
        print(f"ERROR: No PNG files found in {dataset_dir}")
        return
    
    print(f"Running pipeline tests on {len(images)} images...")
    print("=" * 80)
    
    results = []
    total_time = 0
    
    for image_path in images:
        result = test_full_pipeline(image_path)
        results.append(result)
        total_time += result["processing_time_ms"]
        
        status = "[PASS]" if result["success"] else "[FAIL]"
        comp_summary = ", ".join([f"{k}={v}" for k, v in sorted(result["component_types"].items())])
        print(f"{status} {result['image']:20} | {result['components_detected']:2}comp | {result['template_inferred']:10} | {result['html_size_bytes']:5}b | {result['processing_time_ms']:6.2f}ms")
        
        if result["error"]:
            print(f"       Error: {result['error']}")
    
    # Generate report
    passed = sum(1 for r in results if r["success"])
    failed = len(results) - passed
    avg_time = total_time / len(results) if results else 0
    avg_size = sum(r["html_size_bytes"] for r in results) / len(results) if results else 0
    
    print("=" * 80)
    print("\nTEST SUMMARY")
    print("=" * 80)
    print(f"Total tests:           {len(results)}")
    print(f"Passed:                {passed} ({100*passed//len(results)}%)")
    print(f"Failed:                {failed}")
    print(f"Avg processing time:   {avg_time:.2f} ms")
    print(f"Avg HTML size:         {avg_size:.0f} bytes")
    print(f"Total execution time:  {total_time:.0f} ms")
    
    # Template distribution
    templates = {}
    for r in results:
        t = r.get("template_inferred", "unknown")
        templates[t] = templates.get(t, 0) + 1
    
    print(f"\nTemplate Distribution:")
    for t, count in sorted(templates.items(), key=lambda x: -x[1]):
        print(f"  {t:15} {count:2} images ({100*count//len(results)}%)")
    
    # Component type distribution
    all_types = {}
    for r in results:
        for t, count in r["component_types"].items():
            all_types[t] = all_types.get(t, 0) + count
    
    print(f"\nComponent Types Detected:")
    for t, count in sorted(all_types.items(), key=lambda x: -x[1]):
        print(f"  {t:15} {count:3} total")
    
    # Save detailed report
    report = {
        "summary": {
            "total_tests": len(results),
            "passed": passed,
            "failed": failed,
            "success_rate_percent": round(100*passed/len(results), 1),
            "avg_processing_time_ms": round(avg_time, 2),
            "avg_html_size_bytes": round(avg_size, 0),
            "total_execution_time_ms": round(total_time, 0)
        },
        "template_distribution": templates,
        "component_type_distribution": all_types,
        "detailed_results": results
    }
    
    with open("pipeline_test_report.json", "w") as f:
        json.dump(report, f, indent=2)
    
    print(f"\nDetailed report saved to: pipeline_test_report.json")

if __name__ == "__main__":
    main()
