@echo off
echo ================================================================================
echo UPLOAD ALL AUDIO FILES TO CLOUDFLARE R2
echo ================================================================================
echo.
echo This will upload all 132 audio files (12 languages) to Cloudflare R2
echo.
echo Source: D:\wondersofrome\generated_audio_new
echo Total: 132 files (1.45 GB)
echo Languages: EN, AR, DE, ES, FR, IT, JA, KO, PL, PT, RU, ZH
echo.
echo Estimated time: 10-20 minutes
echo.
pause

python tools/upload_all_audio_to_r2.py

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================================================
    echo SUCCESS! All audio files uploaded
    echo ================================================================================
    echo.
    echo Next steps:
    echo   1. Test audio URLs in browser
    echo   2. Update app to use new audio
    echo   3. Test app with new audio
    echo.
) else (
    echo.
    echo ================================================================================
    echo UPLOAD FAILED
    echo ================================================================================
    echo.
    echo Check the error messages above and try again.
    echo.
)

pause
