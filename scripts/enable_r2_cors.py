#!/usr/bin/env python3
"""
Enable CORS on Cloudflare R2 bucket
"""

import boto3
from botocore.client import Config

# R2 Configuration
R2_ENDPOINT = "https://f76d2ce8d05a169a24d24d6895c13dd7.r2.cloudflarestorage.com"
ACCESS_KEY_ID = "606dcb72ce0c2050f02eb47b196253e9"
SECRET_ACCESS_KEY = "6ff3514e46dd267718cc8d4614b9bb2441f88ecbc82097cfb89adb0db8e2148a"
BUCKET_NAME = "wondersofrome-audio"

print("=" * 60)
print("Enabling CORS on R2 Bucket")
print("=" * 60)
print()

# Initialize S3 client
s3 = boto3.client(
    's3',
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=ACCESS_KEY_ID,
    aws_secret_access_key=SECRET_ACCESS_KEY,
    config=Config(signature_version='s3v4')
)

# CORS configuration
cors_configuration = {
    'CORSRules': [
        {
            'AllowedHeaders': ['*'],
            'AllowedMethods': ['GET', 'HEAD'],
            'AllowedOrigins': ['*'],
            'ExposeHeaders': ['ETag', 'Content-Length', 'Content-Type'],
            'MaxAgeSeconds': 3600
        }
    ]
}

try:
    print(f"Setting CORS policy on bucket: {BUCKET_NAME}")
    s3.put_bucket_cors(
        Bucket=BUCKET_NAME,
        CORSConfiguration=cors_configuration
    )
    print("✅ CORS enabled successfully!")
    print()
    print("CORS Policy:")
    print("  - Allowed Origins: * (all)")
    print("  - Allowed Methods: GET, HEAD")
    print("  - Allowed Headers: *")
    print("  - Max Age: 3600 seconds")
    print()
    print("Your audio files should now play in the app!")
    
except Exception as e:
    print(f"❌ Failed to enable CORS: {e}")
    print()
    print("You may need to enable CORS manually in Cloudflare dashboard:")
    print("1. Go to R2 → wondersofrome-audio bucket")
    print("2. Settings → CORS Policy")
    print("3. Add rule:")
    print("   - Allowed origins: *")
    print("   - Allowed methods: GET, HEAD")
    print("   - Allowed headers: *")
