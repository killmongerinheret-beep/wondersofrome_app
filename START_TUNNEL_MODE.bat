@echo off
echo ================================================================================
echo TUNNEL MODE - Test from Anywhere in the World!
echo ================================================================================
echo.
echo This will create a public URL that works:
echo   - From ANY WiFi network
echo   - From mobile data (4G/5G)
echo   - From anywhere in the world
echo   - Share with friends/testers globally
echo.
echo Note: Tunnel mode is slower than local WiFi
echo.
pause

echo.
echo ================================================================================
echo Step 1: Installing ngrok (tunnel package)
echo ================================================================================
echo.

npm install -g @expo/ngrok@latest

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Failed to install ngrok. Trying alternative...
    echo.
    npx @expo/ngrok@latest --version
)

echo.
echo ================================================================================
echo Step 2: Starting tunnel
echo ================================================================================
echo.
echo This may take 1-2 minutes...
echo You'll get a public URL that works globally!
echo.

npx expo start --tunnel

echo.
echo ================================================================================
echo Tunnel stopped
echo ================================================================================
echo.
pause
