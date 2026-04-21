@echo off
echo ================================================================================
echo CLOUD BUILD WITH EAS - Wonders of Rome
echo ================================================================================
echo.
echo This will build your app in the cloud (no RAM issues!)
echo.
echo Prerequisites:
echo   [x] Metro bundler running (for Expo Go testing)
echo   [x] EAS CLI installed
echo   [ ] Expo account (will prompt to login)
echo.
echo Build time: 10-20 minutes
echo Result: APK download link
echo.
pause

echo.
echo ================================================================================
echo Step 1: Expo Account Setup
echo ================================================================================
echo.
echo Do you have an Expo account?
echo   1. Yes - I have an account (login)
echo   2. No - Create new account (signup)
echo.
set /p ACCOUNT_CHOICE="Enter 1 or 2: "

if "%ACCOUNT_CHOICE%"=="2" (
    echo.
    echo Creating new Expo account...
    echo.
    call eas register
    
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo Registration failed. You can also create account at:
        echo   https://expo.dev/signup
        echo.
        pause
        exit /b 1
    )
) else (
    echo.
    echo Logging into Expo...
    echo.
    call eas login
    
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo Login failed. Please try again or create an account:
        echo   Run this script again and choose option 2
        echo   Or visit: https://expo.dev/signup
        echo.
        pause
        exit /b 1
    )
)

echo.
echo ================================================================================
echo Step 2: Configure EAS Build (if needed)
echo ================================================================================
echo.

if not exist eas.json (
    echo eas.json not found. Configuring...
    call eas build:configure
) else (
    echo eas.json found. Skipping configuration.
)

echo.
echo ================================================================================
echo Step 3: Start Cloud Build
echo ================================================================================
echo.
echo Building PREVIEW version (faster, for testing)
echo.
echo This will:
echo   1. Upload your code to Expo servers
echo   2. Build APK in the cloud (10-20 minutes)
echo   3. Provide download link
echo.
echo You can close this window and check build status at:
echo   https://expo.dev
echo.
pause

call eas build -p android --profile preview

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================================================
    echo BUILD STARTED SUCCESSFULLY!
    echo ================================================================================
    echo.
    echo Your build is now running in the cloud.
    echo.
    echo To check status:
    echo   1. Go to: https://expo.dev
    echo   2. Or run: eas build:list
    echo.
    echo When complete, you'll get a download link for the APK.
    echo.
    echo Meanwhile, test with Expo Go:
    echo   1. Install Expo Go app on your phone
    echo   2. Scan QR code from Metro bundler
    echo   3. Test the app immediately!
    echo.
) else (
    echo.
    echo ================================================================================
    echo BUILD FAILED TO START
    echo ================================================================================
    echo.
    echo Common issues:
    echo   1. Not logged in - Run: eas login
    echo   2. Project not configured - Run: eas build:configure
    echo   3. Network issues - Check internet connection
    echo.
    echo Try running manually:
    echo   eas build -p android --profile preview
    echo.
)

pause
