@echo off
REM Setup script for Cloudflare R2 upload

echo ============================================================
echo Cloudflare R2 Setup
echo ============================================================
echo.

REM Check if AWS CLI is installed
where aws >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo AWS CLI is already installed.
    goto configure
)

echo AWS CLI not found. Installing...
echo.
echo Downloading AWS CLI installer...
powershell -Command "Invoke-WebRequest -Uri 'https://awscli.amazonaws.com/AWSCLIV2.msi' -OutFile '%TEMP%\AWSCLIV2.msi'"

echo Installing AWS CLI - this may take a minute...
msiexec /i "%TEMP%\AWSCLIV2.msi" /qn /norestart

echo Waiting for installation to complete...
timeout /t 30 /nobreak

echo Cleaning up...
del "%TEMP%\AWSCLIV2.msi"

echo.
echo AWS CLI installed!
echo Please close this terminal and open a new one.
echo Then run SETUP_R2.bat again to configure.
pause
exit /b 0

:configure
echo Configuring AWS CLI for Cloudflare R2...
echo.

REM Create AWS config directory
if not exist "%USERPROFILE%\.aws" mkdir "%USERPROFILE%\.aws"

REM Write credentials file
(
echo [r2]
echo aws_access_key_id = 606dcb72ce0c2050f02eb47b196253e9
echo aws_secret_access_key = 6ff3514e46dd267718cc8d4614b9bb2441f88ecbc82097cfb89adb0db8e2148a
) > "%USERPROFILE%\.aws\credentials"

REM Write config file
(
echo [profile r2]
echo region = auto
echo output = json
) > "%USERPROFILE%\.aws\config"

echo.
echo ============================================================
echo Configuration Complete!
echo ============================================================
echo.
echo R2 credentials saved successfully
echo Public URL: https://pub-7389b9102db544bb85bdf6f8e1417995.r2.dev
echo.
echo Next: Run UPLOAD_TO_R2.bat to upload audio files
echo.
pause
