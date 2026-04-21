# Quick Start: Option 2 - Complete All Translations

## TL;DR - Just Run These Commands

```powershell
# 1. Install dependencies (5 minutes)
pip install argostranslate TTS pydub soundfile

# 2. Translate everything (2-4 hours, automated)
cd wondersofrome_app
python tools/complete_translations.py

# 3. Generate audio (4-8 hours, automated - can run overnight)
python tools/generate_tts_audio.py

# 4. Clean up Colosseum (2 minutes)
python tools/cleanup_colosseum.py

# 5. Verify quality (2 minutes)
python tools/verify_translations.py

# Done! Check d:/wondersofrome/generated_audio/
```

## What You Get

After running these commands:
- ✅ 121 complete translations (11 attractions × 11 languages)
- ✅ 121 audio files (~1.5-2 GB)
- ✅ All repetitions cleaned up
- ✅ Ready to upload to R2 and deploy

## Total Time: 8-12 hours (mostly automated)
## Total Cost: $0 (100% open-source tools)

## Next Steps After Completion

1. **Upload to R2**:
   ```powershell
   aws s3 sync d:/wondersofrome/generated_audio/ s3://wondersofrome-audio/ --profile r2
   ```

2. **Configure app** (update `.env`):
   ```env
   EXPO_PUBLIC_AUDIO_CDN_BASE_URL=https://pub-xxxxx.r2.dev
   ```

3. **Build APK**:
   ```powershell
   cd wondersofrome_app
   npx expo run:android --variant release
   ```

4. **Deploy to Play Store** ($25)

## Troubleshooting

**If translation fails:**
```powershell
pip install --upgrade argostranslate
```

**If TTS fails:**
```powershell
pip install --upgrade TTS
```

**If out of memory:**
- Close other applications
- Process one language at a time by editing the scripts

**For better quality (slower):**
```powershell
python tools/complete_translations.py --transformers
```

## Full Documentation

See `OPTION2_COMPLETE_GUIDE.md` for detailed instructions, troubleshooting, and quality comparisons.

---

**Ready? Start with:**
```powershell
pip install argostranslate TTS pydub soundfile
cd wondersofrome_app
python tools/complete_translations.py
```

Then grab a coffee ☕ and let it run!
