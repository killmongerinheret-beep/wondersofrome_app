@echo off
REM Upload audio files to Cloudflare R2
REM Make sure you've configured AWS CLI with: aws configure --profile r2

echo ============================================================
echo Uploading Audio Files to Cloudflare R2
echo ============================================================
echo.

REM R2 Configuration
set R2_ENDPOINT=https://f76d2ce8d05a169a24d24d6895c13dd7.r2.cloudflarestorage.com
set BUCKET_NAME=wondersofrome-audio
set SOURCE_DIR=d:\wondersofrome\generated_audio_edge
set PUBLIC_URL=https://pub-7389b9102db544bb85bdf6f8e1417995.r2.dev

echo Source: %SOURCE_DIR%
echo Bucket: %BUCKET_NAME%
echo Endpoint: %R2_ENDPOINT%
echo.

REM Check if source directory exists
if not exist "%SOURCE_DIR%" (
    echo ERROR: Source directory not found: %SOURCE_DIR%
    pause
    exit /b 1
)

echo Starting upload...
echo This may take 10-15 minutes depending on your internet speed.
echo.

REM Upload all files
aws s3 sync "%SOURCE_DIR%" s3://%BUCKET_NAME%/ ^
    --endpoint-url %R2_ENDPOINT% ^
    --profile r2 ^
    --no-progress

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================================
    echo Upload Complete!
    echo ============================================================
    echo.
    echo Your audio files are now available at:
    echo %PUBLIC_URL%
    echo.
    echo Test URL: %PUBLIC_URL%/ar/colosseum/deep.mp3
    echo.
) else (
    echo.
    echo ============================================================
    echo Upload Failed!
    echo ============================================================
    echo.
    echo Check your R2 credentials and endpoint URL
    echo.
)

pause
