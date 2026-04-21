@echo off
echo ================================================================================
echo AUDIO GENERATION PROGRESS CHECK
echo ================================================================================
echo.

python -c "from pathlib import Path; import json; files = list(Path('D:/wondersofrome/generated_audio_new').rglob('*.mp3')); print(f'\nGenerated: {len(files)}/132 files ({len(files)*100//132}%%)'); total_mb = sum(f.stat().st_size for f in files) / (1024*1024); print(f'Total Size: {total_mb:.1f} MB\n'); langs = {}; for f in files: lang = f.parent.parent.name; langs[lang] = langs.get(lang, 0) + 1; print('Per Language:'); [print(f'  {lang.upper()}: {count}/11 files') for lang, count in sorted(langs.items())]"

echo.
echo ================================================================================
echo.
pause
