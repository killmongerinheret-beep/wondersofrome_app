@echo off
echo ================================================================================
echo TEST AUDIO URLs
echo ================================================================================
echo.
echo Opening sample audio files in browser...
echo.

REM Test English files
start https://pub-7389b9102db544bb85bdf6f8e1417995.r2.dev/en/colosseum/deep.mp3
timeout /t 2 /nobreak >nul

start https://pub-7389b9102db544bb85bdf6f8e1417995.r2.dev/en/heart/deep.mp3
timeout /t 2 /nobreak >nul

start https://pub-7389b9102db544bb85bdf6f8e1417995.r2.dev/en/sistine-chapel/deep.mp3
timeout /t 2 /nobreak >nul

REM Test other languages
start https://pub-7389b9102db544bb85bdf6f8e1417995.r2.dev/es/colosseum/deep.mp3
timeout /t 2 /nobreak >nul

start https://pub-7389b9102db544bb85bdf6f8e1417995.r2.dev/ja/heart/deep.mp3

echo.
echo ================================================================================
echo.
echo If audio files play correctly, the upload was successful!
echo.
echo Test URLs:
echo   EN Colosseum: https://pub-7389b9102db544bb85bdf6f8e1417995.r2.dev/en/colosseum/deep.mp3
echo   EN Heart: https://pub-7389b9102db544bb85bdf6f8e1417995.r2.dev/en/heart/deep.mp3
echo   EN Sistine: https://pub-7389b9102db544bb85bdf6f8e1417995.r2.dev/en/sistine-chapel/deep.mp3
echo   ES Colosseum: https://pub-7389b9102db544bb85bdf6f8e1417995.r2.dev/es/colosseum/deep.mp3
echo   JA Heart: https://pub-7389b9102db544bb85bdf6f8e1417995.r2.dev/ja/heart/deep.mp3
echo.
pause
