#!/usr/bin/env python3
"""
TTS Audio Generation using Google Text-to-Speech (gTTS)
- Uses gTTS (free, no compilation needed, works immediately)
- Generates audio for all translated scripts
- Supports all 12 languages
- No API costs, no build tools required
"""

import json
from pathlib import Path
import sys
import time

# Configuration
SOURCE_SCRIPTS = Path("d:/wondersofrome/completed_translations")
OUTPUT_AUDIO = Path("d:/wondersofrome/generated_audio")

LANGUAGES = {
    "ar": "Arabic",
    "de": "German",
    "es": "Spanish",
    "fr": "French",
    "it": "Italian",
    "ja": "Japanese",
    "ko": "Korean",
    "pl": "Polish",
    "pt": "Portuguese",
    "ru": "Russian",
    "zh": "Chinese"
}

# gTTS language codes
GTTS_LANG_CODES = {
    "ar": "ar",
    "de": "de",
    "es": "es",
    "fr": "fr",
    "it": "it",
    "ja": "ja",
    "ko": "ko",
    "pl": "pl",
    "pt": "pt",
    "ru": "ru",
    "zh": "zh-CN"
}

def check_dependencies():
    """Check if gTTS is installed"""
    try:
        from gtts import gTTS
        return True
    except ImportError:
        print("❌ gTTS not installed!")
        print("\nTo install:")
        print("  pip install gtts")
        return False

def split_text_for_tts(text: str, max_length: int = 5000) -> list:
    """Split long text into chunks (gTTS has character limits)"""
    import re
    
    # Split on sentence boundaries
    sentences = re.split(r'(?<=[.!?])\s+', text)
    
    chunks = []
    current_chunk = ""
    
    for sentence in sentences:
        if len(current_chunk) + len(sentence) < max_length:
            current_chunk += sentence + " "
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = sentence + " "
    
    if current_chunk:
        chunks.append(current_chunk.strip())
    
    return chunks

def generate_audio_for_text(text: str, lang: str, output_file: Path):
    """Generate audio for given text using gTTS"""
    from gtts import gTTS
    from pydub import AudioSegment
    import io
    
    # Split text into manageable chunks
    chunks = split_text_for_tts(text)
    print(f"    Processing {len(chunks)} text chunks...")
    
    audio_segments = []
    
    for i, chunk in enumerate(chunks):
        try:
            # Generate audio for chunk
            tts = gTTS(text=chunk, lang=GTTS_LANG_CODES[lang], slow=False)
            
            # Save to memory buffer
            fp = io.BytesIO()
            tts.write_to_fp(fp)
            fp.seek(0)
            
            # Load as audio segment
            audio_segment = AudioSegment.from_mp3(fp)
            audio_segments.append(audio_segment)
            
            if (i + 1) % 5 == 0:
                print(f"    Generated {i + 1}/{len(chunks)} chunks...")
            
            # Rate limiting to avoid Google blocking
            time.sleep(0.5)
                
        except Exception as e:
            print(f"    ⚠️  Error generating chunk {i}: {e}")
            # Add silence for failed chunks
            silence = AudioSegment.silent(duration=1000)  # 1 second
            audio_segments.append(silence)
    
    # Concatenate all audio chunks
    if audio_segments:
        final_audio = audio_segments[0]
        for segment in audio_segments[1:]:
            final_audio += segment
        
        # Save as MP3
        output_file.parent.mkdir(parents=True, exist_ok=True)
        final_audio.export(str(output_file), format="mp3", bitrate="128k")
        print(f"    ✅ Saved MP3: {output_file}")
        return True
    
    return False

def generate_audio_for_attraction(lang: str, attraction: str):
    """Generate audio for one attraction in one language"""
    print(f"\n{'='*60}")
    print(f"Generating Audio: {attraction} → {LANGUAGES[lang]} ({lang})")
    print(f"{'='*60}")
    
    # Load script
    script_file = SOURCE_SCRIPTS / lang / attraction / "deep.txt"
    if not script_file.exists():
        print(f"❌ Script not found: {script_file}")
        return False
    
    with open(script_file, 'r', encoding='utf-8') as f:
        text = f.read()
    
    print(f"📝 Script length: {len(text)} characters")
    
    # Generate audio
    output_file = OUTPUT_AUDIO / lang / attraction / "deep.mp3"
    
    try:
        return generate_audio_for_text(text, lang, output_file)
    except Exception as e:
        print(f"❌ Error generating audio: {e}")
        return False

def generate_all_audio():
    """Generate audio for all translations"""
    OUTPUT_AUDIO.mkdir(parents=True, exist_ok=True)
    
    stats = {
        "completed": 0,
        "failed": 0,
        "total": 0,
        "by_language": {}
    }
    
    # Count total files
    for lang in LANGUAGES:
        lang_dir = SOURCE_SCRIPTS / lang
        if lang_dir.exists():
            attractions = [d.name for d in lang_dir.iterdir() if d.is_dir()]
            stats["total"] += len(attractions)
    
    print(f"Total audio files to generate: {stats['total']}")
    print()
    
    for lang in LANGUAGES:
        lang_dir = SOURCE_SCRIPTS / lang
        if not lang_dir.exists():
            print(f"⚠️  No translations found for {LANGUAGES[lang]} ({lang})")
            continue
        
        stats["by_language"][lang] = {"completed": 0, "failed": 0}
        
        attractions = [d.name for d in lang_dir.iterdir() if d.is_dir()]
        
        for attraction in attractions:
            try:
                success = generate_audio_for_attraction(lang, attraction)
                
                if success:
                    stats["completed"] += 1
                    stats["by_language"][lang]["completed"] += 1
                else:
                    stats["failed"] += 1
                    stats["by_language"][lang]["failed"] += 1
                    
            except Exception as e:
                print(f"❌ Error: {e}")
                stats["failed"] += 1
                stats["by_language"][lang]["failed"] += 1
    
    # Save stats
    stats_file = OUTPUT_AUDIO / "generation_stats.json"
    with open(stats_file, 'w') as f:
        json.dump(stats, f, indent=2)
    
    print(f"\n{'='*60}")
    print(f"AUDIO GENERATION COMPLETE")
    print(f"{'='*60}")
    print(f"✅ Completed: {stats['completed']}/{stats['total']}")
    print(f"❌ Failed: {stats['failed']}")
    print(f"\nOutput directory: {OUTPUT_AUDIO}")
    
    return stats

if __name__ == "__main__":
    print("="*60)
    print("TTS Audio Generation Pipeline (gTTS)")
    print("="*60)
    print(f"Source Scripts: {SOURCE_SCRIPTS}")
    print(f"Output Audio: {OUTPUT_AUDIO}")
    print()
    
    if not check_dependencies():
        print("\n💡 Install gTTS:")
        print("   pip install gtts")
        sys.exit(1)
    
    print("⚠️  This will generate audio for all translated scripts")
    print("   Using: Google Text-to-Speech (gTTS)")
    print("   Quality: Good (7-8/10)")
    print("   Estimated time: 2-4 hours")
    print("   Estimated size: ~1-2 GB of audio files")
    print()
    
    response = input("Continue? (yes/no): ").strip().lower()
    if response != "yes":
        print("Cancelled.")
        sys.exit(0)
    
    print("\n🚀 Starting TTS generation...\n")
    stats = generate_all_audio()
    
    print("\n✅ All audio generated!")
    print(f"📁 Check output in: {OUTPUT_AUDIO}")
