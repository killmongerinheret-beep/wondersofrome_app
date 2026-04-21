#!/usr/bin/env python3
"""
TTS Audio Generation using Microsoft Edge TTS
- No rate limits, unlimited requests
- High quality neural voices
- Built-in duration checking and retry logic
"""

import asyncio
import json
from pathlib import Path
import sys
from pydub import AudioSegment

# Configuration
SOURCE_SCRIPTS = Path("D:/wondersofrome/cleaned_production_content")
OUTPUT_AUDIO = Path("D:/wondersofrome/generated_audio_production")
MIN_DURATION_SECONDS = 10

LANGUAGES = {
    "en": {"code": "en-US", "voice": "en-US-JennyNeural"},
    "ar": {"code": "ar-SA", "voice": "ar-SA-ZariyahNeural"},
    "de": {"code": "de-DE", "voice": "de-DE-KatjaNeural"},
    "es": {"code": "es-ES", "voice": "es-ES-ElviraNeural"},
    "fr": {"code": "fr-FR", "voice": "fr-FR-DeniseNeural"},
    "it": {"code": "it-IT", "voice": "it-IT-ElsaNeural"},
    "ja": {"code": "ja-JP", "voice": "ja-JP-NanamiNeural"},
    "ko": {"code": "ko-KR", "voice": "ko-KR-SunHiNeural"},
    "pl": {"code": "pl-PL", "voice": "pl-PL-ZofiaNeural"},
    "pt": {"code": "pt-BR", "voice": "pt-BR-FranciscaNeural"},
    "ru": {"code": "ru-RU", "voice": "ru-RU-SvetlanaNeural"},
    "zh": {"code": "zh-CN", "voice": "zh-CN-XiaoxiaoNeural"}
}

def check_dependencies():
    """Check if edge-tts is installed"""
    try:
        import edge_tts
        return True
    except ImportError:
        print("❌ edge-tts not installed!")
        print("\nTo install:")
        print("  pip install edge-tts")
        return False

def get_audio_duration(file_path):
    """Get duration of audio file in seconds"""
    try:
        audio = AudioSegment.from_mp3(str(file_path))
        return len(audio) / 1000.0
    except Exception as e:
        print(f"    ⚠️  Error reading audio duration: {e}")
        return None

def format_duration(seconds):
    """Format seconds as MM:SS"""
    if seconds is None:
        return "N/A"
    minutes = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{minutes:02d}:{secs:02d}"

async def generate_audio_for_text(text: str, lang: str, output_file: Path, max_retries: int = 3):
    """Generate audio for given text using Edge TTS with retry logic"""
    import edge_tts
    
    voice = LANGUAGES[lang]["voice"]
    
    for attempt in range(max_retries):
        try:
            # Generate audio
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(str(output_file))
            
            # Check duration
            duration = get_audio_duration(output_file)
            
            if duration is None:
                print(f"    ⚠️  Attempt {attempt + 1}: Could not read audio file")
                if attempt < max_retries - 1:
                    await asyncio.sleep(2)
                    continue
                return False, 0
            
            if duration < MIN_DURATION_SECONDS:
                print(f"    ⚠️  Attempt {attempt + 1}: Audio too short ({format_duration(duration)})")
                if attempt < max_retries - 1:
                    print(f"    🔄 Retrying...")
                    await asyncio.sleep(2)
                    continue
                else:
                    print(f"    ❌ Failed after {max_retries} attempts")
                    return False, duration
            
            # Success!
            return True, duration
            
        except Exception as e:
            print(f"    ⚠️  Attempt {attempt + 1} error: {e}")
            if attempt < max_retries - 1:
                await asyncio.sleep(2)
                continue
            return False, 0
    
    return False, 0

async def generate_audio_for_attraction(lang: str, attraction: str):
    """Generate audio for one attraction in one language"""
    print(f"\n{'='*70}")
    print(f"🎙️  {attraction} → {lang.upper()}")
    print(f"{'='*70}")
    
    # Check if already exists
    output_file = OUTPUT_AUDIO / lang / attraction / "deep.mp3"
    if output_file.exists():
        duration = get_audio_duration(output_file)
        if duration and duration >= MIN_DURATION_SECONDS:
            file_size = output_file.stat().st_size / (1024*1024)
            print(f"⏭️  Already exists: {format_duration(duration)} ({file_size:.2f} MB) - SKIPPING")
            return {
                "success": True,
                "duration": duration,
                "file_size_mb": file_size,
                "file_path": str(output_file),
                "skipped": True
            }
        else:
            print(f"⚠️  Exists but too short ({format_duration(duration)}) - REGENERATING")
    
    # Load script
    script_file = SOURCE_SCRIPTS / lang / attraction / "deep.txt"
    if not script_file.exists():
        print(f"❌ Script not found: {script_file}")
        return {"success": False, "duration": 0, "reason": "script_missing"}
    
    with open(script_file, 'r', encoding='utf-8') as f:
        text = f.read()
    
    print(f"📝 Script: {len(text)} characters")
    
    # Generate audio
    output_file = OUTPUT_AUDIO / lang / attraction / "deep.mp3"
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    success, duration = await generate_audio_for_text(text, lang, output_file)
    
    if success:
        file_size = output_file.stat().st_size / (1024*1024)
        print(f"✅ Success: {format_duration(duration)} ({file_size:.2f} MB)")
        return {
            "success": True,
            "duration": duration,
            "file_size_mb": file_size,
            "file_path": str(output_file)
        }
    else:
        print(f"❌ Failed: {format_duration(duration) if duration > 0 else 'No audio'}")
        return {
            "success": False,
            "duration": duration,
            "reason": "generation_failed"
        }

async def generate_all_audio():
    """Generate audio for all translations"""
    OUTPUT_AUDIO.mkdir(parents=True, exist_ok=True)
    
    stats = {
        "completed": 0,
        "failed": 0,
        "too_short": 0,
        "total": 0,
        "total_duration": 0,
        "by_language": {},
        "failed_files": []
    }
    
    # Count total files
    for lang in LANGUAGES:
        lang_dir = SOURCE_SCRIPTS / lang
        if lang_dir.exists():
            attractions = [d.name for d in lang_dir.iterdir() if d.is_dir()]
            stats["total"] += len(attractions)
    
    print("="*70)
    print("🎙️  Edge TTS Audio Generation Pipeline")
    print("="*70)
    print(f"Total files to generate: {stats['total']}")
    print(f"Minimum duration: {MIN_DURATION_SECONDS}s")
    print()
    
    for lang in LANGUAGES:
        lang_dir = SOURCE_SCRIPTS / lang
        if not lang_dir.exists():
            print(f"⚠️  No translations found for {lang.upper()}")
            continue
        
        stats["by_language"][lang] = {
            "completed": 0,
            "failed": 0,
            "total_duration": 0
        }
        
        attractions = sorted([d.name for d in lang_dir.iterdir() if d.is_dir()])
        
        print(f"\n{'='*70}")
        print(f"🌍 Language: {lang.upper()} ({len(attractions)} attractions)")
        print(f"{'='*70}")
        
        for attraction in attractions:
            result = await generate_audio_for_attraction(lang, attraction)
            
            if result["success"]:
                stats["completed"] += 1
                stats["by_language"][lang]["completed"] += 1
                stats["by_language"][lang]["total_duration"] += result["duration"]
                stats["total_duration"] += result["duration"]
            else:
                stats["failed"] += 1
                stats["by_language"][lang]["failed"] += 1
                stats["failed_files"].append({
                    "language": lang,
                    "attraction": attraction,
                    "reason": result.get("reason", "unknown")
                })
                
                if result["duration"] > 0 and result["duration"] < MIN_DURATION_SECONDS:
                    stats["too_short"] += 1
        
        # Language summary
        lang_stats = stats["by_language"][lang]
        print(f"\n{lang.upper()} Summary:")
        print(f"  ✅ Completed: {lang_stats['completed']}")
        print(f"  ❌ Failed: {lang_stats['failed']}")
        print(f"  ⏱️  Total Duration: {format_duration(lang_stats['total_duration'])}")
    
    # Save stats
    stats_file = OUTPUT_AUDIO / "generation_stats.json"
    with open(stats_file, 'w') as f:
        json.dump(stats, f, indent=2)
    
    # Final summary
    print(f"\n{'='*70}")
    print("📊 FINAL SUMMARY")
    print(f"{'='*70}")
    print(f"✅ Completed: {stats['completed']}/{stats['total']}")
    print(f"❌ Failed: {stats['failed']}")
    print(f"⚠️  Too short: {stats['too_short']}")
    print(f"⏱️  Total Duration: {format_duration(stats['total_duration'])}")
    print(f"📁 Output: {OUTPUT_AUDIO}")
    
    if stats["failed_files"]:
        print(f"\n⚠️  Failed Files:")
        for failed in stats["failed_files"]:
            print(f"  - {failed['language']}/{failed['attraction']}: {failed['reason']}")
    
    return stats

async def main():
    """Main entry point"""
    if not check_dependencies():
        print("\n💡 Install edge-tts:")
        print("   pip install edge-tts")
        sys.exit(1)
    
    print("\n⚠️  This will generate audio for all translated scripts")
    print("   Using: Microsoft Edge TTS (Neural Voices)")
    print("   Quality: High (8-9/10)")
    print("   Estimated time: 2-4 hours")
    print("   Rate limits: None")
    print()
    
    # Auto-confirm if running in background
    if "--auto" in sys.argv:
        print("Auto-confirmed (--auto flag)")
    else:
        response = input("Continue? (yes/no): ").strip().lower()
        if response != "yes":
            print("Cancelled.")
            sys.exit(0)
    
    print("\n🚀 Starting TTS generation...\n")
    stats = await generate_all_audio()
    
    # Check results
    if stats["failed"] == 0 and stats["too_short"] == 0:
        print("\n✅ All audio generated successfully!")
        sys.exit(0)
    elif stats["failed"] > 0 or stats["too_short"] > 10:
        print("\n⚠️  Some files had issues. Check the summary above.")
        sys.exit(1)
    else:
        print("\n✅ Generation complete with minor issues.")
        sys.exit(0)

if __name__ == "__main__":
    asyncio.run(main())
