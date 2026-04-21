@echo off
REM Quick start script for Option 2 translation pipeline
REM Uses system Python to avoid virtual environment conflicts

echo ============================================================
echo Wonders of Rome - Translation Pipeline
echo ============================================================
echo.

REM Use system Python directly
set PYTHON=C:\Users\nehru\AppData\Local\Programs\Python\Python311\python.exe

echo Step 1: Running translation (2-4 hours)...
echo.
%PYTHON% tools\complete_translations.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Translation failed! Check the error above.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo Translation complete!
echo ============================================================
echo.
echo Next step: Generate audio
echo Run: START_TTS.bat
echo.
pause
