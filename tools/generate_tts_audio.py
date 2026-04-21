#!/usr/bin/env python3
"""
TTS Audio Generation using Open-Source Models
- Uses Coqui TTS (open-source, free, high quality)
- Generates audio for all translated scripts
- Supports multiple languages and voices
- No API costs, runs locally
"""

import json
from pathlib import Path
import sys

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

# Coqui TTS model recommendations per language
TTS_MODELS = {
    "en": "tts_models/en/ljspeech/tacotron2-DDC",
    "es": "tts_models/es/mai/tacotron2-DDC",
    "fr": "tts_models/fr/mai/tacotron2-DDC",
    "de": "tts_models/de/thorsten/tacotron2-DDC",
    "it": "tts_models/it/mai_female/glow-tts",
    "pt": "tts_models/pt/cv/vits",
    "ru": "tts_models/ru/cv/vits",
    "zh": "tts_models/zh-CN/baker/tacotron2-DDC",
    "ja": "tts_models/ja/kokoro/tacotron2-DDC",
    "ko": "tts_models/ko/cv/vits",
    "ar": "tts_models/ar/cv/vits",
    "pl": "tts_models/pl/mai_female/vits"
}

def check_dependencies():
    """Check if Coqui TTS is installed"""
    try:
        from TTS.api import TTS
        return True
    except ImportError:
        print("❌ Coqui TTS not installed!")
        print("\nTo install:")
        print("  pip install TTS")
        print("\nNote: Requires Python 3.9-3.11")
        return False

def split_text_for_tts(text: str, max_length: int = 500) -> list:
    """Split long text into chunks suitable for TTS"""
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

def generate_audio_for_text(text: str, lang: str, output_file: Path, tts_model=None):
    """Generate audio for given text"""
    from TTS.api import TTS
    import soundfile as sf
    import numpy as np
    
    # Initialize TTS if not provided
    if tts_model is None:
        model_name = TTS_MODELS.get(lang, TTS_MODELS["en"])
        print(f"    Loading TTS model: {model_name}")
        tts_model = TTS(model_name)
    
    # Split text into manageable chunks
    chunks = split_text_for_tts(text)
    print(f"    Processing {len(chunks)} text chunks...")
    
    all_audio = []
    
    for i, chunk in enumerate(chunks):
        try:
            # Generate audio for chunk
            audio = tts_model.tts(chunk)
            all_audio.append(audio)
            
            if (i + 1) % 10 == 0:
                print(f"    Generated {i + 1}/{len(chunks)} chunks...")
                
        except Exception as e:
            print(f"    ⚠️  Error generating chunk {i}: {e}")
            # Add silence for failed chunks
            all_audio.append(np.zeros(16000))  # 1 second of silence at 16kHz
    
    # Concatenate all audio chunks
    final_audio = np.concatenate(all_audio)
    
    # Save as MP3
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    # Save as WAV first (Coqui TTS outputs WAV)
    wav_file = output_file.with_suffix('.wav')
    sf.write(wav_file, final_audio, 22050)
    
    # Convert to MP3 using pydub
    try:
        from pydub import AudioSegment
        audio_segment = AudioSegment.from_wav(str(wav_file))
        audio_segment.export(str(output_file), format="mp3", bitrate="128k")
        wav_file.unlink()  # Delete WAV file
        print(f"    ✅ Saved MP3: {output_file}")
    except ImportError:
        print(f"    ⚠️  pydub not installed, saved as WAV: {wav_file}")
        print(f"       Install pydub and ffmpeg to convert to MP3")
    except Exception as e:
        print(f"    ⚠️  MP3 conversion failed: {e}")
        print(f"       Kept WAV file: {wav_file}")
    
    return tts_model

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
        generate_audio_for_text(text, lang, output_file)
        return True
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
    print("TTS Audio Generation Pipeline")
    print("="*60)
    print(f"Source Scripts: {SOURCE_SCRIPTS}")
    print(f"Output Audio: {OUTPUT_AUDIO}")
    print()
    
    if not check_dependencies():
        print("\n💡 Install Coqui TTS:")
        print("   pip install TTS")
        print("\n💡 For MP3 conversion:")
        print("   pip install pydub")
        print("   # Also install ffmpeg on your system")
        sys.exit(1)
    
    print("⚠️  This will generate audio for all translated scripts")
    print("   Estimated time: 4-8 hours depending on hardware")
    print("   Estimated size: ~2-3 GB of audio files")
    print()
    
    response = input("Continue? (yes/no): ").strip().lower()
    if response != "yes":
        print("Cancelled.")
        sys.exit(0)
    
    print("\n🚀 Starting TTS generation...\n")
    stats = generate_all_audio()
    
    print("\n✅ All audio generated!")
    print(f"📁 Check output in: {OUTPUT_AUDIO}")
