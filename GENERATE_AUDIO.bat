@echo off
echo ================================================================================
echo AUDIO GENERATION - Continue or Restart
echo ================================================================================
echo.
echo Current Progress:
python -c "from pathlib import Path; files = list(Path('D:/wondersofrome/generated_audio_new').rglob('*.mp3')); print(f'Generated: {len(files)}/132 files'); total_mb = sum(f.stat().st_size for f in files) / (1024*1024); print(f'Total Size: {total_mb:.1f} MB')"
echo.
echo This will continue generating audio from updated transcripts.
echo Estimated time: 30-60 minutes for remaining files
echo.
pause

python tools/regenerate_all_audio.py --auto

echo.
echo ================================================================================
echo GENERATION COMPLETE
echo ================================================================================
echo.
pause
