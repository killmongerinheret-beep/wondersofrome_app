@echo off
echo ============================================================
echo Edge TTS Generation - Progress Check
echo ============================================================
echo.

REM Count generated files
echo Checking generated files...
powershell -Command "Get-ChildItem -Path 'd:\wondersofrome\generated_audio_edge' -Recurse -Filter '*.mp3' | Measure-Object | Select-Object -ExpandProperty Count"

echo.
echo Expected: 121 files total
echo.
echo Check detailed progress in the terminal or wait for completion.
echo Output folder: d:\wondersofrome\generated_audio_edge\
echo.
pause
