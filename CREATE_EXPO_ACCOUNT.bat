@echo off
echo ================================================================================
echo CREATE EXPO ACCOUNT
echo ================================================================================
echo.
echo This will create a new Expo account for cloud builds.
echo.
echo You'll need:
echo   - Email address
echo   - Username
echo   - Password
echo.
echo Or you can create account in browser:
echo   https://expo.dev/signup
echo.
pause

echo.
echo Creating account...
echo.

call eas register

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================================================
    echo ACCOUNT CREATED SUCCESSFULLY!
    echo ================================================================================
    echo.
    echo You can now run cloud builds:
    echo   CLOUD_BUILD.bat
    echo.
    echo Or manually:
    echo   eas build -p android --profile preview
    echo.
) else (
    echo.
    echo ================================================================================
    echo ACCOUNT CREATION FAILED
    echo ================================================================================
    echo.
    echo Alternative: Create account in browser
    echo   1. Go to: https://expo.dev/signup
    echo   2. Fill in the form
    echo   3. Verify your email
    echo   4. Run: eas login
    echo.
)

pause
