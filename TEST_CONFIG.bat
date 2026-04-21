@echo off
REM Test app configuration

echo ============================================================
echo Testing App Configuration
echo ============================================================
echo.

echo Checking .env file...
if exist "wondersofrome_app\.env" (
    echo ✅ .env file exists
    type "wondersofrome_app\.env"
) else (
    echo ❌ .env file missing!
)

echo.
echo ============================================================
echo Checking sights.json...
python -c "import json; data = json.load(open('wondersofrome_app/src/data/sights.json')); print(f'✅ {len(data)} attractions loaded'); print(f'✅ First attraction: {data[0][\"name\"]}'); print(f'✅ Languages: {len(data[0][\"audioFiles\"])}'); print(f'✅ Sample URL: {list(data[0][\"audioFiles\"].values())[0][\"deep\"][\"url\"]}')"

echo.
echo ============================================================
echo Starting app with cleared cache...
echo.

cd wondersofrome_app
npx expo start --clear

pause
