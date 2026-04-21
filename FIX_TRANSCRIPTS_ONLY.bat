@echo off
echo ========================================
echo  FIX AUDIO TRANSCRIPTS ONLY
echo ========================================
echo.
echo This will ONLY fix the transcript files:
echo   1. Remove repetition loops (3-33x repeats)
echo   2. Remove Rick Steves branding
echo   3. Remove URLs and credits
echo.
echo Source: D:\wondersofrome\cleaned_production_content_v2
echo Output: D:\wondersofrome\final_cleaned_content
echo Report: D:\wondersofrome\fix_report.json
echo.
echo NO app changes, NO deployment, JUST transcript fixes
echo.
pause

cd tools
python fix_all_issues.py

echo.
echo ========================================
echo  Transcript Fixes Complete!
echo ========================================
echo.
echo Results:
echo   - Fixed files: D:\wondersofrome\final_cleaned_content\
echo   - Report: D:\wondersofrome\fix_report.json
echo.
echo What was fixed:
echo   ✓ Removed sentence repetitions (max 2 consecutive)
echo   ✓ Removed "Rick Steves" in all languages
echo   ✓ Removed ricksteves.com URLs
echo   ✓ Removed production credits
echo   ✓ Flagged short files (need re-translation)
echo.
echo Next steps:
echo   1. Check the report: D:\wondersofrome\fix_report.json
echo   2. Verify a few files manually
echo   3. Use clean files for TTS/audio generation
echo.
pause
