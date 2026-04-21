@echo off
echo ================================================================================
echo PUSH TO GITHUB - killmongerinheret-beep/wondersofrome_app
echo ================================================================================
echo.
echo This will push all committed files to GitHub.
echo.
echo If you get a permission error, you need to:
echo 1. Make sure you're logged into the correct GitHub account
echo 2. Or use a Personal Access Token
echo.
echo Opening GitHub authentication...
echo.
pause

REM Clear any cached credentials
git credential reject https://github.com

REM Try to push - this will prompt for credentials
git push -u origin master

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================================================
    echo SUCCESS! All files uploaded to GitHub
    echo ================================================================================
    echo.
    echo Repository: https://github.com/killmongerinheret-beep/wondersofrome_app
    echo.
) else (
    echo.
    echo ================================================================================
    echo PUSH FAILED - Authentication Required
    echo ================================================================================
    echo.
    echo Option 1: Use GitHub Desktop
    echo   - Download: https://desktop.github.com/
    echo   - Login with killmongerinheret-beep account
    echo   - Open this repository and push
    echo.
    echo Option 2: Use Personal Access Token
    echo   - Go to: https://github.com/settings/tokens
    echo   - Generate new token with 'repo' scope
    echo   - Run: git push https://YOUR_TOKEN@github.com/killmongerinheret-beep/wondersofrome_app.git master
    echo.
    echo Option 3: Use SSH Key
    echo   - Set up SSH key: https://docs.github.com/en/authentication/connecting-to-github-with-ssh
    echo   - Change remote: git remote set-url origin git@github.com:killmongerinheret-beep/wondersofrome_app.git
    echo   - Push: git push -u origin master
    echo.
)

pause
