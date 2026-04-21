@echo off
echo ================================================================================
echo QUICK EXPO SETUP - Choose Your Option
echo ================================================================================
echo.
echo What do you want to do?
echo.
echo   1. Create new Expo account (signup)
echo   2. Login to existing account
echo   3. Create account in browser (opens expo.dev/signup)
echo   4. Skip - Just test with Expo Go (no account needed)
echo.
set /p CHOICE="Enter 1, 2, 3, or 4: "

if "%CHOICE%"=="1" (
    echo.
    echo ================================================================================
    echo Creating New Account
    echo ================================================================================
    echo.
    echo You'll be asked for:
    echo   - Email address
    echo   - Username
    echo   - Password
    echo.
    pause
    
    call eas register
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo SUCCESS! Account created.
        echo.
        echo Next step: Run CLOUD_BUILD.bat to build your app
        echo.
    ) else (
        echo.
        echo Failed. Try option 3 to create account in browser.
        echo.
    )
    
) else if "%CHOICE%"=="2" (
    echo.
    echo ================================================================================
    echo Login to Existing Account
    echo ================================================================================
    echo.
    pause
    
    call eas login
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo SUCCESS! Logged in.
        echo.
        echo Next step: Run CLOUD_BUILD.bat to build your app
        echo.
    ) else (
        echo.
        echo Login failed. Check your credentials.
        echo.
    )
    
) else if "%CHOICE%"=="3" (
    echo.
    echo Opening browser...
    start https://expo.dev/signup
    echo.
    echo After creating account in browser:
    echo   1. Verify your email
    echo   2. Run this script again and choose option 2 (login)
    echo.
    
) else if "%CHOICE%"=="4" (
    echo.
    echo ================================================================================
    echo Test with Expo Go (No Account Needed)
    echo ================================================================================
    echo.
    echo Metro bundler is already running with QR code.
    echo.
    echo Steps:
    echo   1. Install "Expo Go" app on your phone
    echo   2. Open Expo Go app
    echo   3. Tap "Scan QR Code"
    echo   4. Scan the QR code from your terminal
    echo   5. App loads on your phone!
    echo.
    echo This lets you test immediately without building.
    echo.
    echo See: EXPO_GO_INSTRUCTIONS.md for details
    echo.
    
) else (
    echo.
    echo Invalid choice. Please run again and enter 1, 2, 3, or 4.
    echo.
)

pause
