@echo off
echo ================================================================================
echo LAUNCH WONDERS OF ROME APP ON ANDROID EMULATOR
echo ================================================================================
echo.
echo Step 1: Starting Metro bundler...
echo.

cd wondersofrome_app

REM Start Metro bundler in a new window
start "Metro Bundler" cmd /k "npm start"

echo.
echo Waiting 10 seconds for Metro to start...
timeout /t 10 /nobreak

echo.
echo ================================================================================
echo Step 2: Building and launching on Android emulator...
echo ================================================================================
echo.
echo Make sure you have:
echo   1. Android Studio installed
echo   2. An emulator created and running
echo   3. Or a physical device connected via USB
echo.
echo If you don't have an emulator running, press Ctrl+C and:
echo   1. Open Android Studio
echo   2. Click "Device Manager" (phone icon on right side)
echo   3. Click "Create Device" or start an existing one
echo.
pause

echo.
echo Launching app on Android...
echo.

npx react-native run-android

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================================================
    echo SUCCESS! App is running on emulator
    echo ================================================================================
    echo.
    echo The app should now be visible on your emulator.
    echo Metro bundler is running in the other window.
    echo.
    echo To reload the app: Press 'R' twice in the Metro window
    echo To open dev menu: Press 'D' in the Metro window
    echo.
) else (
    echo.
    echo ================================================================================
    echo LAUNCH FAILED
    echo ================================================================================
    echo.
    echo Common issues:
    echo   1. No emulator running - Start one in Android Studio
    echo   2. Android SDK not found - Set ANDROID_HOME environment variable
    echo   3. Build errors - Check the error messages above
    echo.
    echo Try these commands manually:
    echo   1. npm start (in one terminal)
    echo   2. npx react-native run-android (in another terminal)
    echo.
)

pause
