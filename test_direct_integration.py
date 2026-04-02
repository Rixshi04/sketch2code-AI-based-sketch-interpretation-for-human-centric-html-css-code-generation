#!/usr/bin/env python
"""Test the React generator integration directly"""

import sys
sys.path.insert(0, r'C:\Users\Rishi\OneDrive\Desktop\final project 0')

from backend.react_generator import integrate_react_output, LayoutValidator

# Simulate what main.py creates after hybrid pipeline
detected = {
    'layout': [
        {'type': 'header', 'x': 0, 'y': 0, 'width': 800, 'height': 100, 'ink_ratio': 0.3},
        {'type': 'main', 'x': 0, 'y': 100, 'width': 800, 'height': 400, 'ink_ratio': 0.4},
    ],
    'analysis': {
        'template': 'landing',
        'confidence': 0.1,
        'processing_method': 'fallback',
    },
    'template': 'landing',
    'description': 'test',
    'rows': [
        {'y': 0, 'components': [
            {'type': 'header', 'x': 0, 'y': 0, 'width': 800, 'height': 100, 'ink_ratio': 0.3}
        ]},
        {'y': 100, 'components': [
            {'type': 'main', 'x': 0, 'y': 100, 'width': 800, 'height': 400, 'ink_ratio': 0.4}
        ]},
    ],
    'sections': [
        {'name': 'header', 'kind': 'header'},
        {'name': 'content', 'kind': 'main'},
    ]
}

print("=" * 80)
print("TEST 1: Validate layout")
print("=" * 80)

# Validate
is_valid, error = LayoutValidator.validate_layout(detected)
print(f"Valid: {is_valid}")
if not is_valid:
    print(f"Error: {error}")
    sys.exit(1)
else:
    print("Validation passed!")

print("\n" + "=" * 80)
print("TEST 2: Generate React code")
print("=" * 80)

result = integrate_react_output(detected, 'test description')
print(f"Generation valid: {result['valid']}")

if result['valid']:
    print("Code generated successfully!")
    print("\nFirst 300 chars of generated code:")
    print(result['code'][:300])
    print("\nProvider trace:")
    for trace in result['provider_trace']:
        print(f"  - {trace['provider']}: {trace['status']}")
else:
    print(f"Error: {result.get('error')}")
    print(f"Provider trace: {result.get('provider_trace')}")
    sys.exit(1)

print("\n" + "=" * 80)
print("ALL TESTS PASSED")
print("=" * 80)
