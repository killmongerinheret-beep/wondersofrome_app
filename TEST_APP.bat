@echo off
REM Test the Wonders of Rome app locally

echo ============================================================
echo Testing Wonders of Rome App
echo ============================================================
echo.
echo Configuration:
echo - Audio CDN: https://pub-7389b9102db544bb85bdf6f8e1417995.r2.dev
echo - Languages: 11 (ar, de, es, fr, it, ja, ko, pl, pt, ru, zh)
echo - Attractions: 11
echo.
echo Starting Expo development server...
echo.
echo Once started:
echo - Press 'a' to open on Android
echo - Press 'i' to open on iOS
echo - Press 'w' to open in web browser
echo - Scan QR code with Expo Go app
echo.

cd wondersofrome_app
npm start

pause
