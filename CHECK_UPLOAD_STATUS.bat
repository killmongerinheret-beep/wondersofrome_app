@echo off
REM Check R2 upload status

echo ============================================================
echo Checking R2 Upload Status
echo ============================================================
echo.

python -c "import boto3; from botocore.client import Config; s3 = boto3.client('s3', endpoint_url='https://f76d2ce8d05a169a24d24d6895c13dd7.r2.cloudflarestorage.com', aws_access_key_id='606dcb72ce0c2050f02eb47b196253e9', aws_secret_access_key='6ff3514e46dd267718cc8d4614b9bb2441f88ecbc82097cfb89adb0db8e2148a', config=Config(signature_version='s3v4')); objects = s3.list_objects_v2(Bucket='wondersofrome-audio'); print(f\"Files in bucket: {objects.get('KeyCount', 0)}\"); total_size = sum(obj['Size'] for obj in objects.get('Contents', [])); print(f\"Total size: {total_size / 1024 / 1024:.2f} MB\")"

echo.
echo Public URL: https://pub-7389b9102db544bb85bdf6f8e1417995.r2.dev
echo.
echo Test a file:
echo https://pub-7389b9102db544bb85bdf6f8e1417995.r2.dev/ar/colosseum/deep.mp3
echo.
pause
