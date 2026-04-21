@echo off
echo ========================================
echo  Starting Wonders of Rome App
echo ========================================
echo.

cd wondersofrome_app

echo [1/3] Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo.
echo [2/3] Starting Metro bundler...
echo.
echo Choose how to run:
echo   1. Expo Dev Client (Recommended)
echo   2. Direct Android Build
echo.
set /p choice="Enter choice (1 or 2): "

if "%choice%"=="1" (
    echo.
    echo Starting Expo...
    echo Press 'a' when Metro is ready to open in Android emulator
    echo.
    call npx expo start
) else if "%choice%"=="2" (
    echo.
    echo Building and running on Android...
    echo This will take a few minutes on first run...
    echo.
    call npx expo run:android
) else (
    echo Invalid choice. Running Expo by default...
    call npx expo start
)

pause
