"""
Test hybrid CPU/GPU pipeline performance and accuracy

This script compares:
1. GPU-only processing (fast but may fail)
2. CPU-only processing (reliable but slower)
3. Hybrid processing (GPU with CPU fallback)
"""

import sys
import time
from pathlib import Path

# Add backend to path
backend_path = Path("backend")
sys.path.insert(0, str(backend_path))

from hybrid_pipeline import HybridPipeline
import random

# Test configuration
dataset_path = Path("sketch2code_dataset_v1_cleaned")
test_images = sorted(list(dataset_path.glob("*.png")))

if not test_images:
    print("ERROR: No test images found in dataset")
    sys.exit(1)

# Pick 10 random images for testing
test_images = random.sample(test_images, min(10, len(test_images)))

print("=" * 80)
print("HYBRID CPU/GPU PIPELINE TEST")
print("=" * 80)
print(f"\nTesting {len(test_images)} random images")
print("=" * 80)

# Initialize pipelines
cpu_only = HybridPipeline(gpu_model=None, enable_gpu=False)
gpu_enabled = HybridPipeline(gpu_model=None, enable_gpu=True)  # Will skip GPU if no model

results = {
    'cpu_only': [],
    'hybrid': [],
}

# Test each image
for idx, image_path in enumerate(test_images, 1):
    print(f"\n[{idx}/{len(test_images)}] {image_path.name}")
    print("-" * 80)
    
    # CPU-only test
    try:
        start = time.time()
        result = cpu_only.process(image_path, description="Test processing")
        elapsed = (time.time() - start) * 1000
        
        results['cpu_only'].append({
            'image': image_path.name,
            'time_ms': elapsed,
            'template': result.get('template'),
            'confidence': result.get('confidence'),
            'success': True,
            'method': result.get('processing_method'),
        })
        print(f"  CPU-only:  {elapsed:.1f}ms | {result.get('template')} ({result.get('confidence'):.2f})")
    except Exception as e:
        results['cpu_only'].append({
            'image': image_path.name,
            'success': False,
            'error': str(e),
        })
        print(f"  CPU-only:  FAILED - {e}")
    
    # Hybrid test
    try:
        start = time.time()
        result = gpu_enabled.process(image_path, description="Test processing")
        elapsed = (time.time() - start) * 1000
        
        results['hybrid'].append({
            'image': image_path.name,
            'time_ms': elapsed,
            'template': result.get('template'),
            'confidence': result.get('confidence'),
            'success': True,
            'method': result.get('processing_method'),
        })
        print(f"  Hybrid:    {elapsed:.1f}ms | {result.get('template')} ({result.get('confidence'):.2f}) [{result.get('processing_method')}]")
    except Exception as e:
        results['hybrid'].append({
            'image': image_path.name,
            'success': False,
            'error': str(e),
        })
        print(f"  Hybrid:    FAILED - {e}")

# Analysis
print("\n" + "=" * 80)
print("PERFORMANCE SUMMARY")
print("=" * 80)

cpu_times = [r['time_ms'] for r in results['cpu_only'] if r.get('success')]
hybrid_times = [r['time_ms'] for r in results['hybrid'] if r.get('success')]

cpu_success = sum(1 for r in results['cpu_only'] if r.get('success'))
hybrid_success = sum(1 for r in results['hybrid'] if r.get('success'))

print(f"\nCPU-only pipeline:")
print(f"  Success rate: {cpu_success}/{len(test_images)} ({100*cpu_success//len(test_images)}%)")
if cpu_times:
    print(f"  Avg time: {sum(cpu_times)/len(cpu_times):.1f}ms")
    print(f"  Min/Max: {min(cpu_times):.1f}ms / {max(cpu_times):.1f}ms")

print(f"\nHybrid pipeline:")
print(f"  Success rate: {hybrid_success}/{len(test_images)} ({100*hybrid_success//len(test_images)}%)")
if hybrid_times:
    print(f"  Avg time: {sum(hybrid_times)/len(hybrid_times):.1f}ms")
    print(f"  Min/Max: {min(hybrid_times):.1f}ms / {max(hybrid_times):.1f}ms")

# Check processing methods used
gpu_count = sum(1 for r in results['hybrid'] if r.get('method') == 'gpu')
cpu_count = sum(1 for r in results['hybrid'] if r.get('method') == 'cpu')

print(f"\nHybrid processing distribution:")
print(f"  GPU processing: {gpu_count}")
print(f"  CPU fallback: {cpu_count}")

# Overall statistics
print(f"\n" + "=" * 80)
print("PIPELINE STATISTICS")
print("=" * 80)
print(f"\nCPU-only:")
print(f"  Total stats: {cpu_only.get_stats()}")
print(f"\nHybrid:")
print(f"  Total stats: {gpu_enabled.get_stats()}")

print("\n" + "=" * 80)
print("CONCLUSION")
print("=" * 80)

if hybrid_success == len(test_images):
    print("[SUCCESS] Hybrid pipeline achieved 100% success rate!")
    print("  - Graceful GPU/CPU switching working correctly")
    print("  - All images processed successfully")
    
    if gpu_count > 0:
        print(f"  - GPU acceleration used for {gpu_count}/{len(test_images)} images")
        speedup = sum(cpu_times) / sum(h['time_ms'] for h in results['hybrid'] if h.get('success'))
        if speedup > 1.0:
            print(f"  - GPU provides {speedup:.2f}x speedup on average")
    else:
        print("  - No GPU acceleration available (running CPU-only)")
else:
    print(f"[WARNING] Hybrid pipeline had failures ({len(test_images) - hybrid_success} images)")
    print("  - Need to investigate fallback logic")
