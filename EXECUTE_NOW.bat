@echo off
echo ========================================
echo  LAUNCH TODAY - STEP BY STEP
echo ========================================
echo.
echo This will prepare your app for launch TODAY
echo.
echo Step 1: Fix transcripts (5 min)
echo Step 2: Update app to Colosseum-only (10 min)
echo Step 3: Test app (30 min)
echo Step 4: Deploy (2 hours)
echo.
echo Total time: ~3 hours to working app
echo.
pause

echo.
echo ========================================
echo  STEP 1: Fixing Transcripts
echo ========================================
echo.
cd tools
python fix_all_issues.py
cd ..

echo.
echo ========================================
echo  STEP 2: Updating App Configuration
echo ========================================
echo.

echo Backing up current sights.json...
copy wondersofrome_app\src\data\sights.json wondersofrome_app\src\data\sights.json.backup

echo.
echo MANUAL STEP REQUIRED:
echo.
echo 1. Open: wondersofrome_app\src\data\sights.json
echo 2. Replace ALL content with content from: sights_colosseum_only.json
echo 3. Save and close
echo.
echo Press any key when done...
pause

echo.
echo ========================================
echo  STEP 3: Testing App
echo ========================================
echo.
echo Starting Expo...
echo.
cd wondersofrome_app
start cmd /k "npx expo start"

echo.
echo ========================================
echo  NEXT STEPS
echo ========================================
echo.
echo 1. Wait for Metro bundler to start
echo 2. Press 'a' to open in Android emulator
echo 3. Test Colosseum in multiple languages
echo 4. If everything works, proceed to deployment
echo.
echo See LAUNCH_TODAY_PLAN.md for full details
echo.
pause
