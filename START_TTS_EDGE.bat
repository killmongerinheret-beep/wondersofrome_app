@echo off
REM Edge TTS generation script
REM Uses system Python to avoid virtual environment conflicts

echo ============================================================
echo Wonders of Rome - Edge TTS Generation Pipeline
echo ============================================================
echo.

REM Use system Python directly
set PYTHON=C:\Users\nehru\AppData\Local\Programs\Python\Python311\python.exe

echo Generating audio using Microsoft Edge TTS...
echo This will skip already completed files...
echo.
%PYTHON% tools\generate_tts_edge.py --auto

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo TTS generation failed! Check the error above.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo Audio generation complete!
echo ============================================================
echo.
echo Check output in: d:\wondersofrome\generated_audio_edge\
echo.
pause
