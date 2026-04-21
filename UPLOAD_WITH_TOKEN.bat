@echo off
echo ================================================================================
echo UPLOAD TO GITHUB WITH PERSONAL ACCESS TOKEN
echo ================================================================================
echo.
echo Step 1: Create a Personal Access Token
echo ----------------------------------------
echo 1. Go to: https://github.com/settings/tokens
echo 2. Click "Generate new token (classic)"
echo 3. Give it a name: "WondersOfRome Upload"
echo 4. Select scope: [x] repo (Full control of private repositories)
echo 5. Click "Generate token"
echo 6. COPY THE TOKEN (you won't see it again!)
echo.
echo Step 2: Paste your token below
echo --------------------------------
echo.
set /p TOKEN="Enter your GitHub Personal Access Token: "
echo.
echo Uploading to GitHub...
echo.

git push https://%TOKEN%@github.com/killmongerinheret-beep/wondersofrome_app.git master

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================================================
    echo SUCCESS! All files uploaded to GitHub
    echo ================================================================================
    echo.
    echo Repository: https://github.com/killmongerinheret-beep/wondersofrome_app
    echo Commit: 87 files, 12,991 lines
    echo.
    echo Files uploaded:
    echo   - 26 Python tools
    echo   - 20 Batch files
    echo   - 41 Documentation files
    echo   - Android app fixes
    echo.
) else (
    echo.
    echo ================================================================================
    echo UPLOAD FAILED
    echo ================================================================================
    echo.
    echo Possible issues:
    echo   - Invalid token
    echo   - Token doesn't have 'repo' scope
    echo   - Not logged into killmongerinheret-beep account
    echo.
    echo Try again or use GitHub Desktop instead.
    echo.
)

pause
