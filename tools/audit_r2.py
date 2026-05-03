import json
import boto3
import os
from botocore.config import Config

# --- CONFIGURATION ---
# Replace these with your keys or use environment variables
ENDPOINT_URL = "https://f76d2ce8d05a169a24d24d6895c13dd7.r2.cloudflarestorage.com"
ACCESS_KEY_ID = "877207055aa0ffe680d097592ea84acd"
SECRET_ACCESS_KEY = "23d6e383326615c4df8a8939ecd7dcae32e3c9db80dc2e351d065df061043aff"
BUCKET_NAME = "wondersofrome-audio"

# The mapping we created in the app
FOLDER_MAP = {
    'vatican': 'vatican-museums',
    'trevi': 'heart',
    'st-peters-basilica': 'st-peters-basilica',
    'sistine-chapel': 'sistine-chapel',
    'vatican-museums': 'vatican-museums',
    'castel-santangelo': 'castel-santangelo',
    'borghese-gallery': 'borghese-gallery',
    'capitoline-museums': 'capitoline-museums',
    'vittoriano': 'vittoriano',
    'baths-caracalla': 'baths-caracalla',
    'circus-maximus': 'circus-maximus',
    'piazza-navona': 'heart',
    'vatican-pinacoteca': 'vatican-pinacoteca',
}

LANGS = ['en', 'it', 'es', 'fr', 'de', 'pt', 'pl', 'ru', 'ar', 'zh', 'ja', 'ko']
VARIANTS = ['deep'] # You said you only have deep.mp3 for now

def audit():
    print(f"--- Starting Audit of R2 Bucket: {BUCKET_NAME} ---")
    
    # Setup S3 Client
    s3 = boto3.client(
        's3',
        endpoint_url=ENDPOINT_URL,
        aws_access_key_id=ACCESS_KEY_ID,
        aws_secret_access_key=SECRET_ACCESS_KEY,
        config=Config(signature_version='s3v4'),
        region_name='auto'
    )

    # Load Sights
    sights_path = os.path.join('..', 'src', 'data', 'sights.json')
    with open(sights_path, 'r', encoding='utf-8') as f:
        sights = json.load(f)

    # Get all objects in bucket to avoid thousands of small requests
    print("Fetching file list from Cloudflare...")
    all_files = set()
    paginator = s3.get_paginator('list_objects_v2')
    for page in paginator.paginate(Bucket=BUCKET_NAME):
        if 'Contents' in page:
            for obj in page['Contents']:
                all_files.add(obj['Key'])

    missing = []
    found_count = 0
    total_checks = 0

    for sight in sights:
        sid = sight['id']
        folder = FOLDER_MAP.get(sid, sid)
        
        for lang in LANGS:
            for variant in VARIANTS:
                total_checks += 1
                # Expected path in R2: en/colosseum/deep.mp3
                key = f"{lang}/{folder}/{variant}.mp3"
                
                if key in all_files:
                    found_count += 1
                else:
                    missing.append(key)

    print("\n--- AUDIT REPORT ---")
    print(f"Total Audio Files Checked: {total_checks}")
    print(f"Found: {found_count}")
    print(f"Missing: {len(missing)}")
    
    if missing:
        print("\nTop 10 Missing Files (Upload these to fix 404s):")
        for m in missing[:10]:
            print(f" [ ] {m}")
        
        # Save full report to file
        with open('missing_audio_report.txt', 'w') as rf:
            rf.write("\n".join(missing))
        print(f"\nFull report saved to: tools/missing_audio_report.txt")
    else:
        print("\nSuccess! All audio files are present in R2.")

if __name__ == "__main__":
    audit()
