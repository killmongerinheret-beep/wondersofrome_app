#!/usr/bin/env python3
"""
Upload ALL audio files (12 languages) to Cloudflare R2
"""

import os
import sys
from pathlib import Path
import json

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

# Source directory with NEW audio
SOURCE_DIR = r"D:\wondersofrome\generated_audio_new"

LANGUAGES = ['en', 'ar', 'de', 'es', 'fr', 'it', 'ja', 'ko', 'pl', 'pt', 'ru', 'zh']

def upload_to_r2():
    """Upload all audio files to R2"""
    
    print("=" * 80)
    print("🎙️  UPLOADING ALL AUDIO FILES TO CLOUDFLARE R2")
    print("=" * 80)
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
    print(f"🌍 Languages: {len(LANGUAGES)}")
    print()
    
    stats = {
        "uploaded": 0,
        "failed": 0,
        "total_size_mb": 0,
        "by_language": {}
    }
    
    # Upload each language
    for lang in LANGUAGES:
        lang_dir = os.path.join(SOURCE_DIR, lang)
        
        if not os.path.exists(lang_dir):
            print(f"⚠️  {lang.upper()}: Directory not found")
            continue
        
        print(f"\n📤 Uploading {lang.upper()}...")
        
        lang_stats = {"uploaded": 0, "failed": 0, "size_mb": 0}
        
        for root, dirs, files in os.walk(lang_dir):
            for file in files:
                local_path = os.path.join(root, file)
                
                # Calculate relative path for S3 key
                relative_path = os.path.relpath(local_path, SOURCE_DIR)
                s3_key = relative_path.replace('\\', '/')
                
                try:
                    # Get file size
                    file_size = os.path.getsize(local_path)
                    size_mb = file_size / 1024 / 1024
                    
                    # Upload file
                    print(f"   ⬆️  {s3_key} ({size_mb:.1f} MB)", end=' ')
                    
                    # Set content type
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
                    
                    print("✅")
                    
                    stats["uploaded"] += 1
                    stats["total_size_mb"] += size_mb
                    lang_stats["uploaded"] += 1
                    lang_stats["size_mb"] += size_mb
                    
                except Exception as e:
                    print(f"❌ {e}")
                    stats["failed"] += 1
                    lang_stats["failed"] += 1
        
        stats["by_language"][lang] = lang_stats
        print(f"   ✅ {lang.upper()}: {lang_stats['uploaded']} files ({lang_stats['size_mb']:.1f} MB)")
    
    # Save upload report
    report_file = Path(SOURCE_DIR) / "upload_report.json"
    with open(report_file, 'w') as f:
        json.dump(stats, f, indent=2)
    
    print()
    print("=" * 80)
    print("📊 UPLOAD COMPLETE")
    print("=" * 80)
    print()
    print(f"✅ Uploaded: {stats['uploaded']} files")
    print(f"❌ Failed: {stats['failed']} files")
    print(f"📦 Total size: {stats['total_size_mb']:.2f} MB ({stats['total_size_mb']/1024:.2f} GB)")
    print()
    
    # Per-language summary
    print("Per-Language Summary:")
    for lang in LANGUAGES:
        if lang in stats["by_language"]:
            lang_stats = stats["by_language"][lang]
            status = "✅" if lang_stats["failed"] == 0 else "⚠️"
            print(f"   {status} {lang.upper()}: {lang_stats['uploaded']:2} files, {lang_stats['size_mb']:6.1f} MB")
    
    print()
    print(f"📄 Report saved: {report_file}")
    print()
    print("🌐 Audio files are now accessible at:")
    print(f"   {PUBLIC_URL}/[language]/[attraction]/deep.mp3")
    print()
    print("Example URLs:")
    print(f"   {PUBLIC_URL}/en/colosseum/deep.mp3")
    print(f"   {PUBLIC_URL}/es/sistine-chapel/deep.mp3")
    print(f"   {PUBLIC_URL}/ja/heart/deep.mp3")
    print()
    
    return stats["failed"] == 0

if __name__ == "__main__":
    success = upload_to_r2()
    sys.exit(0 if success else 1)
