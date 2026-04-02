#!/usr/bin/env python
"""
VERIFICATION: Different images now produce different output
"""
import sys
sys.path.insert(0, r'C:\Users\Rishi\OneDrive\Desktop\final project 0')

from fastapi.testclient import TestClient
from backend.main import app
from PIL import Image, ImageDraw
from io import BytesIO
import json

client = TestClient(app)

print('=' * 80)
print('VERIFICATION: Different Images Produce Different Code')
print('=' * 80)

# Create 3 very different test images
test_cases = [
    {
        'name': 'LOGIN FORM',
        'size': (300, 250),
        'draw': lambda img: [
            ImageDraw.Draw(img).rectangle([20, 20, 280, 60], outline='black', width=3),
            ImageDraw.Draw(img).text((30, 25), 'Login Form', fill='black'),
            ImageDraw.Draw(img).rectangle([20, 80, 280, 110], outline='black', width=2),
            ImageDraw.Draw(img).rectangle([20, 130, 280, 160], outline='black', width=2),
            ImageDraw.Draw(img).rectangle([60, 190, 240, 220], fill='blue'),
        ],
        'desc': 'Login form with email and password'
    },
    {
        'name': 'DASHBOARD',
        'size': (500, 400),
        'draw': lambda img: [
            ImageDraw.Draw(img).rectangle([0, 0, 500, 50], fill='darkblue'),
            ImageDraw.Draw(img).rectangle([0, 50, 100, 400], fill='lightgray', outline='black'),
            *[ImageDraw.Draw(img).rectangle([120 + i*90, 70 + (j%2)*150, 200 + i*90, 150 + (j%2)*150], outline='black', width=2) for i in range(4) for j in range(2)],
        ],
        'desc': 'Dashboard with charts and analytics'
    },
    {
        'name': 'PHOTO GALLERY',
        'size': (450, 350),
        'draw': lambda img: [
            ImageDraw.Draw(img).text((150, 10), 'Gallery', fill='black'),
            *[ImageDraw.Draw(img).rectangle([20 + i*100, 50 + (j%2)*140, 110 + i*100, 140 + (j%2)*140], fill='lightgray', outline='black', width=2) for i in range(4) for j in range(2)],
        ],
        'desc': 'Photo gallery layout'
    },
]

results = {}

for test in test_cases:
    print(f'\nTesting: {test["name"]}')
    print('-' * 60)
    
    # Create image
    img = Image.new('RGB', test['size'], color='white')
    test['draw'](img)
    
    img_bytes = BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    
    # Send to backend
    response = client.post(
        '/api/generate-code',
        files={'file': ('test.png', img_bytes, 'image/png')},
        data={'description': test['desc']}
    )
    
    if response.status_code == 200:
        data = response.json()
        code = data.get('code', '')
        html = data.get('html', '')
        template = data.get('template', '')
        
        results[test['name']] = {
            'code': code,
            'html': html,
            'template': template,
            'code_len': len(code),
            'html_len': len(html),
        }
        
        print(f'  Template: {template}')
        print(f'  Code length: {len(code)} chars')
        print(f'  HTML field returned: {len(html) > 0}')
        print(f'  HTML length: {len(html)} chars')
        
        if code == html:
            print(f'  Code == HTML: YES (correct)')
        else:
            print(f'  Code == HTML: NO (ERROR)')
    else:
        print(f'  ERROR: {response.status_code}')

print('\n' + '=' * 80)
print('VERIFICATION RESULTS')
print('=' * 80)

if len(results) < 3:
    print('ERROR: Not all images processed')
    sys.exit(1)

# Check if outputs are different
codes = [r['code'] for r in results.values()]
templates = [r['template'] for r in results.values()]

print(f'\nTotal different templates: {len(set(templates))}')
print(f'Unique templates: {set(templates)}')

if len(set(codes)) == len(codes):
    print(f'\n[OK] All {len(codes)} images produced DIFFERENT code')
    print('[OK] BUG IS FIXED - Different images produce different outputs!')
else:
    duplicate_count = len(codes) - len(set(codes))
    print(f'\n[ERROR] {duplicate_count} images produced SAME code')
    print('[ERROR] Bug still exists')
    sys.exit(1)

print('\n' + '=' * 80)
print('Test completed successfully')
print('Frontend should now display different code for each sketch')
print('=' * 80)
