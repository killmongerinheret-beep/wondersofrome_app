@echo off
echo ================================================================================
echo RE-TRANSLATE HEART ^& SISTINE CHAPEL TO ALL LANGUAGES
echo ================================================================================
echo.
echo This will:
echo   1. Re-translate Heart ^& Sistine Chapel to all 11 languages
echo   2. Verify all other files match English content
echo.
echo Time: ~30-45 minutes
echo.
pause

python tools/retranslate_and_verify.py

echo.
echo ================================================================================
echo COMPLETE!
echo ================================================================================
echo.
pause
