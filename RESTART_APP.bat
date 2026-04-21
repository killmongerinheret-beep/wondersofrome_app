@echo off
REM Restart app with cleared cache after fixes

echo ============================================================
echo Restarting App with Fixes
echo ============================================================
echo.
echo Fixed issues:
echo ✅ CORS enabled on R2 (audio will now play)
echo ✅ Removed English from supported languages
echo ✅ Updated to 11 languages: ar, de, es, fr, it, ja, ko, pl, pt, ru, zh
echo.
echo Starting app with cleared cache...
echo.

cd wondersofrome_app
npx expo start --clear

pause
