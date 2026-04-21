@echo off
echo ========================================
echo  FIX EMPTY/SHORT FILES
echo ========================================
echo.
echo This will fix 25 empty/short files by translating from English:
echo.
echo   Japanese:  10 files
echo   Chinese:   10 files
echo   Korean:     5 files
echo.
echo Method: Google Translate (free)
echo Time: 30-60 minutes
echo.
echo First, we need to install the translation library...
echo.
pause

echo Installing deep-translator...
pip install deep-translator

echo.
echo ========================================
echo  Starting Translation
echo ========================================
echo.

cd tools
python fix_empty_files.py

echo.
echo ========================================
echo  Translation Complete!
echo ========================================
echo.
echo Report: D:\wondersofrome\empty_files_fix_report.json
echo.
echo Next: Run VERIFY_FIXES.bat to confirm all files pass
echo.
pause
