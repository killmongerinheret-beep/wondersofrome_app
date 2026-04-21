#!/usr/bin/env python3
"""
Upload audio files to Cloudflare R2 using boto3
No AWS CLI installation required!
"""

import os
import sys
from pathlib import Path

try:
    import boto3
    from botocore.client import Config
except ImportError:
    print("❌ boto3 not installed")
    print("Installing boto3...")
    os.system(f"{sys.executable} -m pip install boto3")
    import boto3
    from botocore.client import Config

# R2 Configuration
R2_ENDPOINT = "https://f76d2ce8d05a169a24d24d6895c13dd7.r2.cloudflarestorage.com"
ACCESS_KEY_ID = "606dcb72ce0c2050f02eb47b196253e9"
SECRET_ACCESS_KEY = "6ff3514e46dd267718cc8d4614b9bb2441f88ecbc82097cfb89adb0db8e2148a"
BUCKET_NAME = "wondersofrome-audio"
PUBLIC_URL = "https://pub-7389b9102db544bb85bdf6f8e1417995.r2.dev"

# Source directory
SOURCE_DIR = r"D:\wondersofrome\generated_audio_production"

def upload_to_r2():
    """Upload English audio files to R2"""
    
    print("=" * 60)
    print("Uploading English Audio Files to Cloudflare R2")
    print("=" * 60)
    print()
    
    # Check source directory
    if not os.path.exists(SOURCE_DIR):
        print(f"❌ Source directory not found: {SOURCE_DIR}")
        return False
    
    # Initialize S3 client for R2
    print("🔗 Connecting to Cloudflare R2...")
    s3 = boto3.client(
        's3',
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=ACCESS_KEY_ID,
        aws_secret_access_key=SECRET_ACCESS_KEY,
        config=Config(signature_version='s3v4')
    )
    
    # Test connection
    try:
        s3.head_bucket(Bucket=BUCKET_NAME)
        print(f"✅ Connected to bucket: {BUCKET_NAME}")
    except Exception as e:
        print(f"❌ Cannot connect to bucket: {e}")
        return False
    
    print()
    print(f"📁 Source: {SOURCE_DIR}")
    print(f"☁️  Bucket: {BUCKET_NAME}")
    print(f"🌐 Public URL: {PUBLIC_URL}")
    print()
    print("📤 Starting upload...")
    
    uploaded = 0
    failed = 0
    total_size = 0
    
    # Walk through all files in 'en' subfolder
    SOURCE_EN = os.path.join(SOURCE_DIR, 'en')
    if not os.path.exists(SOURCE_EN):
        print(f"❌ English source directory not found: {SOURCE_EN}")
        return False
        
    for root, dirs, files in os.walk(SOURCE_EN):
        for file in files:
            local_path = os.path.join(root, file)
            
            # Calculate relative path for S3 key
            relative_path = os.path.relpath(local_path, SOURCE_DIR)
            s3_key = relative_path.replace('\\', '/')
            
            try:
                # Get file size
                file_size = os.path.getsize(local_path)
                total_size += file_size
                
                # Upload file
                print(f"⬆️  Uploading: {s3_key} ({file_size / 1024 / 1024:.2f} MB)")
                
                # Set content type based on extension
                content_type = 'audio/mpeg' if file.endswith('.mp3') else 'application/json'
                
                s3.upload_file(
                    local_path,
                    BUCKET_NAME,
                    s3_key,
                    ExtraArgs={
                        'ContentType': content_type,
                        'CacheControl': 'public, max-age=31536000'  # Cache for 1 year
                    }
                )
                
                uploaded += 1
                
            except Exception as e:
                print(f"❌ Failed to upload {s3_key}: {e}")
                failed += 1
    
    print()
    print("=" * 60)
    print("Upload Complete!")
    print("=" * 60)
    print()
    print(f"✅ Uploaded: {uploaded} files")
    print(f"❌ Failed: {failed} files")
    print(f"📦 Total size: {total_size / 1024 / 1024:.2f} MB")
    print()
    
    return failed == 0

if __name__ == "__main__":
    success = upload_to_r2()
    sys.exit(0 if success else 1)
