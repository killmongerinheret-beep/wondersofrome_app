@echo off
echo ========================================
echo  Fixing All Transcript Issues
echo ========================================
echo.
echo This will fix:
echo   1. Repetition loops (sentences repeating 3-33x)
echo   2. Branding violations (Rick Steves, URLs)
echo   3. Document content gaps (90-97%% missing)
echo.
echo Source: D:\wondersofrome\cleaned_production_content_v2
echo Output: D:\wondersofrome\final_cleaned_content
echo Report: D:\wondersofrome\fix_report.json
echo.
pause

cd tools
python fix_all_issues.py

echo.
echo ========================================
echo  Fix Complete!
echo ========================================
echo.
echo Check the report at:
echo D:\wondersofrome\fix_report.json
echo.
echo Cleaned files are in:
echo D:\wondersofrome\final_cleaned_content
echo.
pause
