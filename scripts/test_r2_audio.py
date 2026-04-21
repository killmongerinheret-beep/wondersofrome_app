#!/usr/bin/env python3
"""Test R2 audio accessibility"""

import requests

# Test URLs
test_urls = [
    "https://pub-7389b9102db544bb85bdf6f8e1417995.r2.dev/ar/colosseum/deep.mp3",
    "https://pub-7389b9102db544bb85bdf6f8e1417995.r2.dev/es/forum/deep.mp3",
]

print("Testing R2 audio accessibility...")
print("=" * 60)

for url in test_urls:
    try:
        # Try GET request with Origin header to trigger CORS
        response = requests.get(url, timeout=10, headers={'Origin': 'http://localhost:8081'}, stream=True)
        response.close()
        print(f"\n✅ {url}")
        print(f"   Status: {response.status_code}")
        print(f"   Content-Type: {response.headers.get('Content-Type', 'N/A')}")
        print(f"   Content-Length: {response.headers.get('Content-Length', 'N/A')}")
        print(f"   CORS: {response.headers.get('Access-Control-Allow-Origin', 'NOT SET')}")
    except Exception as e:
        print(f"\n❌ {url}")
        print(f"   Error: {e}")

print("\n" + "=" * 60)
print("\nIf CORS is 'NOT SET', audio won't play in the app!")
print("You need to enable CORS in Cloudflare R2 bucket settings.")
