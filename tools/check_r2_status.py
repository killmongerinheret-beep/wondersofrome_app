#!/usr/bin/env python3
"""Check R2 bucket status"""

import boto3
from botocore.client import Config

R2_ENDPOINT = "https://f76d2ce8d05a169a24d24d6895c13dd7.r2.cloudflarestorage.com"
ACCESS_KEY_ID = "606dcb72ce0c2050f02eb47b196253e9"
SECRET_ACCESS_KEY = "6ff3514e46dd267718cc8d4614b9bb2441f88ecbc82097cfb89adb0db8e2148a"
BUCKET_NAME = "wondersofrome-audio"

s3 = boto3.client(
    's3',
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=ACCESS_KEY_ID,
    aws_secret_access_key=SECRET_ACCESS_KEY,
    config=Config(signature_version='s3v4')
)

objects = s3.list_objects_v2(Bucket=BUCKET_NAME)
count = objects.get('KeyCount', 0)
total_size = sum(obj['Size'] for obj in objects.get('Contents', [])) if 'Contents' in objects else 0

print(f"Files in bucket: {count}")
print(f"Total size: {total_size / 1024 / 1024:.2f} MB")
