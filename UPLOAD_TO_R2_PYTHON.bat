@echo off
REM Upload audio files to Cloudflare R2 using Python (no AWS CLI needed!)

echo ============================================================
echo Uploading Audio Files to Cloudflare R2
echo ============================================================
echo.
echo Using Python boto3 (no AWS CLI installation required)
echo.

python tools\upload_to_r2.py

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Upload successful!
) else (
    echo.
    echo ❌ Upload failed. Check the error messages above.
)

pause
