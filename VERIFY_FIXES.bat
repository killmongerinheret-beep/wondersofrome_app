@echo off
echo ========================================
echo  AUTOMATED VERIFICATION
echo ========================================
echo.
echo This will verify the fixes WITHOUT needing to know the languages
echo.
echo Checks:
echo   1. No sentences repeating 3+ times
echo   2. No "Rick Steves" branding (any language)
echo   3. No URLs or credits
echo   4. File lengths are reasonable
echo.
echo Source: D:\wondersofrome\final_cleaned_content
echo Report: D:\wondersofrome\verification_report.json
echo.
pause

cd tools
python verify_fixes.py

echo.
echo ========================================
echo  Verification Complete!
echo ========================================
echo.
echo Check the detailed report at:
echo D:\wondersofrome\verification_report.json
echo.
pause
