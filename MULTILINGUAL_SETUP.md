# Multilingual Audio Tour Setup Guide

## ⚠️ IMPORTANT COPYRIGHT NOTICE
The existing audio appears to be Rick Steves content. For your travel agency app, you should:
1. Create original tour scripts
2. License existing content properly
3. Use this as a template only

## Current Status
- ✅ App structure ready
- ✅ Transcripts available (English only)
- ✅ Audio files available (220MB)
- ⏳ Need: Multi-language support
- ⏳ Need: Cloud storage setup

## Target Languages for Travel Agency
Recommended languages based on Rome tourism:
- English (en) - Already have
- Spanish (es) - Large market
- French (fr) - European tourists
- German (de) - European tourists  
- Italian (it) - Local context
- Chinese (zh) - Growing market
- Portuguese (pt) - Brazilian tourists

## Implementation Plan

### Phase 1: Content Creation (Week 1-2)
1. **Write Original Scripts**
   - Create your agency's unique tour narratives
   - Include wondersofrome.com booking info
   - Add local tips and recommendations
   - Keep segments 2-5 minutes each

2. **Professional Translation**
   - Use DeepL API or hire translators
   - Review for cultural accuracy
   - Estimated cost: $100-300

### Phase 2: Audio Generation (Week 2-3)
1. **Choose TTS Service**
   - **ElevenLabs** (Recommended): Natural, high quality
   - **Google Cloud TTS**: Good quality, affordable
   - **Azure TTS**: Enterprise-grade

2. **Generate Audio Files**
   - Convert scripts to speech
   - Match timing with original structure
   - Estimated cost: $50-800 depending on service

### Phase 3: Storage Setup (Week 3)
1. **Set up Cloudflare R2**
   ```bash
   # Create R2 bucket
   # Upload audio files organized by language
   # Configure public access
   ```

2. **File Structure**
   ```
   wondersofrome-audio/
     en/colosseum/deep.mp3
     es/colosseum/deep.mp3
     fr/colosseum/deep.mp3
     ...
   ```

### Phase 4: App Configuration (Week 4)
1. **Update Environment Variables**
   ```env
   EXPO_PUBLIC_AUDIO_CDN_BASE_URL=https://your-r2.dev
   EXPO_PUBLIC_BRAND_DOMAIN=https://wondersofrome.com
   EXPO_PUBLIC_SUPPORTED_LANGUAGES=en,es,fr,de,it,zh,pt
   ```

2. **Add Language Selector**
   - Settings screen
   - Download manager per language
   - Offline playback support

## Cost Breakdown

### One-Time Costs:
- Translation: $100-300
- TTS Generation: $50-800
- **Total: $150-1,100**

### Monthly Costs:
- R2 Storage (1-2GB): $0.02
- R2 Bandwidth: $0 (free egress!)
- **Total: ~$0.02/month**

## Quick Start Commands

### 1. Extract Audio Files
```powershell
Expand-Archive -Path "D:\wondersofrome\tts_audio-*.zip" -DestinationPath "D:\wondersofrome\tts_audio"
```

### 2. Check App Languages
The app already supports multiple languages in the code. Check:
- `wondersofrome_app/src/` for language handling

### 3. Test with Sample Audio
Upload a test file to R2 and update the .env file

## Next Actions

**What would you like to do first?**

1. ✍️ Create original tour scripts for your agency
2. 🌍 Set up translation service
3. 🎙️ Generate sample audio in one language
4. ☁️ Set up R2 storage bucket
5. 📱 Configure app for multi-language

Let me know and I'll help you with the specific implementation!
