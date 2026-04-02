"""
Integration test for /api/generate-code endpoint

Tests:
1. Start backend server
2. Send image to /api/generate-code
3. Verify response includes React code + layout spec
4. Verify response format matches exact specification
5. Verify platform is "react"
"""

import sys
import json
import time
import subprocess
from pathlib import Path
import requests
from typing import Dict, Any

# Project paths
PROJECT_ROOT = Path(__file__).parent
BACKEND_DIR = PROJECT_ROOT / 'backend'
TEST_IMAGE = PROJECT_ROOT / 'sketch2code_dataset_v1_cleaned' / '1009.png'

# API configuration
API_BASE_URL = "http://localhost:8000"
API_PREFIX = "/api"
GENERATE_CODE_ENDPOINT = f"{API_BASE_URL}{API_PREFIX}/generate-code"
HEALTH_ENDPOINT = f"{API_BASE_URL}{API_PREFIX}/health"

# Wait times
STARTUP_WAIT = 10  # seconds to wait for server to start
ENDPOINT_TIMEOUT = 30  # seconds to wait for endpoint response
RETRY_COUNT = 3


def wait_for_server(timeout: int = STARTUP_WAIT) -> bool:
    """Wait for server to be ready."""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            response = requests.get(HEALTH_ENDPOINT, timeout=5)
            if response.status_code == 200:
                print("[OK] Server is healthy")
                return True
        except requests.exceptions.RequestException:
            pass
        time.sleep(1)
    
    print(f"[FAILED] Server did not start within {timeout} seconds")
    return False


def test_health_endpoint():
    """Test health endpoint returns 200."""
    try:
        response = requests.get(HEALTH_ENDPOINT, timeout=5)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert 'status' in data, "Health response missing 'status'"
        print("[OK] Health endpoint works")
        return True
    except Exception as e:
        print(f"[FAILED] Health endpoint failed: {e}")
        return False


def test_generate_code_with_image():
    """Test /api/generate-code with an actual image."""
    if not TEST_IMAGE.exists():
        print(f"[FAILED] Test image not found: {TEST_IMAGE}")
        return False
    
    try:
        with open(TEST_IMAGE, 'rb') as f:
            files = {'file': f}
            data = {
                'description': 'Login form with email and password fields',
                'platform': 'react',
            }
            
            response = requests.post(
                GENERATE_CODE_ENDPOINT,
                files=files,
                data=data,
                timeout=ENDPOINT_TIMEOUT
            )
        
        if response.status_code != 200:
            print(f"[FAILED] Generate code endpoint returned {response.status_code}")
            print(f"  Response: {response.text[:200]}")
            return False
        
        result = response.json()
        
        # Verify response structure
        required_fields = ['code', 'template', 'analysis', 'provider_trace', 'platform']
        for field in required_fields:
            if field not in result:
                print(f"[FAILED] Missing required field: {field}")
                return False
        
        # Verify platform is "react"
        if result['platform'] != 'react':
            print(f"[FAILED] Expected platform='react', got {result['platform']}")
            return False
        
        # Verify code is React/JSX
        code = result['code']
        if not code:
            print(f"[FAILED] Code is empty")
            return False
        
        if 'import React' not in code:
            print(f"[FAILED] Code doesn't import React")
            return False
        
        if 'export default' not in code:
            print(f"[FAILED] Code doesn't export default component")
            return False
        
        # Verify layout structure
        if 'layout' in result:
            layout = result['layout']
            if isinstance(layout, dict):
                # Check for required layout keys
                layout_keys = set(layout.keys())
                expected_keys = {'layout', 'analysis', 'template'}
                if not expected_keys.issubset(layout_keys):
                    print(f"[FAILED] Layout missing keys: {expected_keys - layout_keys}")
                    return False
        
        # Verify provider trace
        provider_trace = result['provider_trace']
        if not isinstance(provider_trace, list):
            print(f"[FAILED] provider_trace should be a list")
            return False
        
        if len(provider_trace) == 0:
            print(f"[FAILED] provider_trace is empty")
            return False
        
        # Verify template detection
        template = result['template']
        if template not in ['login', 'dashboard', 'gallery', 'form', 'landing']:
            print(f"[FAILED] Unexpected template: {template}")
            return False
        
        print("[OK] Generate code endpoint works")
        print(f"  Template detected: {template}")
        print(f"  Platform: {result['platform']}")
        print(f"  Code length: {len(code)} characters")
        print(f"  Provider trace steps: {len(provider_trace)}")
        
        return True
        
    except Exception as e:
        print(f"[FAILED] Generate code endpoint failed: {e}")
        return False


def test_response_format():
    """Test response format matches exact specification."""
    if not TEST_IMAGE.exists():
        print(f"[FAILED] Test image not found: {TEST_IMAGE}")
        return False
    
    try:
        with open(TEST_IMAGE, 'rb') as f:
            files = {'file': f}
            data = {'description': 'Test layout'}
            
            response = requests.post(
                GENERATE_CODE_ENDPOINT,
                files=files,
                data=data,
                timeout=ENDPOINT_TIMEOUT
            )
        
        if response.status_code != 200:
            return False
        
        result = response.json()
        
        # Check exact response format
        checks = [
            ('code' in result and isinstance(result['code'], str), "code should be string"),
            ('layout' in result and isinstance(result['layout'], dict), "layout should be dict"),
            ('template' in result and isinstance(result['template'], str), "template should be string"),
            ('analysis' in result and isinstance(result['analysis'], dict), "analysis should be dict"),
            ('provider_trace' in result and isinstance(result['provider_trace'], list), "provider_trace should be list"),
            ('platform' in result and result['platform'] == 'react', "platform should be 'react'"),
            ('processing_time' in result, "processing_time should be present"),
            ('source' in result, "source should be present"),
        ]
        
        all_passed = True
        for check, description in checks:
            if not check:
                print(f"[FAILED] {description}")
                all_passed = False
        
        if all_passed:
            print("[OK] Response format matches exact specification")
        
        return all_passed
        
    except Exception as e:
        print(f"[FAILED] Format check failed: {e}")
        return False


def run_integration_tests():
    """Run all integration tests."""
    print("\n" + "=" * 80)
    print("INTEGRATION TEST: /api/generate-code endpoint")
    print("=" * 80 + "\n")
    
    # Start backend server
    print("Starting backend server...")
    process = None
    try:
        # Start backend in a subprocess
        # Note: This assumes you can run the backend with uvicorn
        process = subprocess.Popen(
            [sys.executable, '-m', 'uvicorn', 'backend.main:app', '--host', '0.0.0.0', '--port', '8000'],
            cwd=str(PROJECT_ROOT),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Wait for server to start
        print(f"Waiting up to {STARTUP_WAIT} seconds for server to start...")
        if not wait_for_server(STARTUP_WAIT):
            if process:
                process.terminate()
            print("\n✗ Could not start server")
            return False
        
        print("\nRunning tests...\n")
        
        # Run tests
        tests = [
            ("Health endpoint", test_health_endpoint),
            ("Generate code endpoint", test_generate_code_with_image),
            ("Response format", test_response_format),
        ]
        
        passed = 0
        for name, test_func in tests:
            try:
                if test_func():
                    passed += 1
                print()
            except Exception as e:
                print(f"[FAILED] {name} failed with exception: {e}\n")
        
        print("=" * 80)
        print(f"RESULTS: {passed}/{len(tests)} tests passed")
        print("=" * 80 + "\n")
        
        return passed == len(tests)
        
    except Exception as e:
        print(f"[FAILED] Test setup failed: {e}")
        return False
    finally:
        # Cleanup: terminate server
        if process:
            print("Shutting down server...")
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()


if __name__ == '__main__':
    success = run_integration_tests()
    sys.exit(0 if success else 1)
