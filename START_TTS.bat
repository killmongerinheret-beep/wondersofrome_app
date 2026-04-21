@echo off
REM TTS generation script using gTTS
REM Uses system Python to avoid virtual environment conflicts

echo ============================================================
echo Wonders of Rome - TTS Generation Pipeline
echo ============================================================
echo.

REM Use system Python directly
set PYTHON=C:\Users\nehru\AppData\Local\Programs\Python\Python311\python.exe

echo Generating audio using Google Text-to-Speech (gTTS)...
echo This will take 2-4 hours...
echo.
%PYTHON% tools\generate_tts_audio_gtts.py

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
echo Check output in: d:\wondersofrome\generated_audio\
echo.
pause
