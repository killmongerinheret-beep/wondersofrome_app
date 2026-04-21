@echo off
echo ================================================================================
echo RE-TRANSLATE ALL ENGLISH FILES TO ALL LANGUAGES
echo ================================================================================
echo.
echo This will translate ALL 11 English attractions to ALL 11 languages:
echo.
echo Attractions:
echo   1. Colosseum
echo   2. Forum
echo   3. Heart
echo   4. Jewish Ghetto
echo   5. Ostia Antica
echo   6. Pantheon
echo   7. Sistine Chapel
echo   8. St. Peter's Basilica
echo   9. Trastevere
echo  10. Vatican Museums
echo  11. Vatican Pinacoteca
echo.
echo Languages:
echo   Arabic, German, Spanish, French, Italian, Japanese,
echo   Korean, Polish, Portuguese, Russian, Chinese
echo.
echo Total: 121 translations (11 attractions x 11 languages)
echo Time: 45-90 minutes
echo.
echo This ensures ALL languages match the English content exactly.
echo.
pause

python tools/retranslate_all_languages.py

echo.
echo ================================================================================
echo COMPLETE!
echo ================================================================================
echo.
echo Check the output above for results.
echo Report saved to: D:\wondersofrome\retranslation_report.json
echo.
pause
