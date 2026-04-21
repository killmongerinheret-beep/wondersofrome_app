@echo off
echo ================================================================================
echo QUICK LAUNCH - Wonders of Rome App
echo ================================================================================
echo.
echo This will launch the app on your Android emulator.
echo.
echo Prerequisites:
echo   [x] Android Studio installed
echo   [x] Emulator created and running
echo   [x] Node.js and npm installed
echo.
echo If you don't have an emulator running:
echo   1. Open Android Studio
echo   2. Click "Device Manager" (phone icon)
echo   3. Start an emulator
echo.
pause

cd wondersofrome_app

echo.
echo [1/3] Installing dependencies...
call npm install

echo.
echo [2/3] Starting Metro bundler...
start "Metro Bundler - Keep This Open" cmd /k "npm start"

echo.
echo Waiting 15 seconds for Metro to initialize...
timeout /t 15 /nobreak

echo.
echo [3/3] Building and launching app...
echo This may take 2-5 minutes on first run...
echo.

npx react-native run-android

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================================================
    echo SUCCESS! App is running
    echo ================================================================================
    echo.
    echo The app should now be visible on your emulator.
    echo.
    echo Useful commands:
    echo   - Press 'R' twice in Metro window to reload
    echo   - Press 'D' in Metro window for dev menu
    echo   - Shake the emulator for dev menu
    echo.
    echo To test:
    echo   1. Check if app loads without crashes
    echo   2. Tap on an attraction (e.g., Colosseum)
    echo   3. Play audio and verify it works
    echo   4. Try changing language in settings
    echo.
) else (
    echo.
    echo ================================================================================
    echo LAUNCH FAILED - See ANDROID_STUDIO_GUIDE.md for help
    echo ================================================================================
    echo.
)

pause
