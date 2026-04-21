"""
Clean old audio and generate new audio from updated transcripts
Uses Microsoft Edge TTS (free, unlimited, high quality)
"""

import asyncio
import json
import shutil
from pathlib import Path
import sys

# Configuration
SOURCE_SCRIPTS = Path("D:/wondersofrome/final_cleaned_content")
OUTPUT_AUDIO = Path("D:/wondersofrome/generated_audio_new")
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
    """Check if required packages are installed"""
    missing = []
    
    try:
        import edge_tts
    except ImportError:
        missing.append("edge-tts")
    
    try:
        from pydub import AudioSegment
    except ImportError:
        missing.append("pydub")
    
    if missing:
        print("❌ Missing dependencies:")
        for pkg in missing:
            print(f"   - {pkg}")
        print("\nTo install:")
        print(f"   pip install {' '.join(missing)}")
        return False
    
    return True

def get_audio_duration(file_path):
    """Get duration of audio file in seconds"""
    try:
        from pydub import AudioSegment
        audio = AudioSegment.from_mp3(str(file_path))
        return len(audio) / 1000.0
    except Exception as e:
        return None

def format_duration(seconds):
    """Format seconds as MM:SS"""
    if seconds is None:
        return "N/A"
    minutes = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{minutes:02d}:{secs:02d}"

def clean_old_audio():
    """Remove old audio directories"""
    print("="*80)
    print("🗑️  CLEANING OLD AUDIO FILES")
    print("="*80)
    print()
    
    # Create fresh output directory
    if OUTPUT_AUDIO.exists():
        print(f"Removing old audio: {OUTPUT_AUDIO}")
        shutil.rmtree(OUTPUT_AUDIO)
        print("✅ Old audio removed")
    else:
        print("No old audio to remove")
    
    OUTPUT_AUDIO.mkdir(parents=True, exist_ok=True)
    print(f"✅ Created fresh directory: {OUTPUT_AUDIO}")
    print()

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
                if attempt < max_retries - 1:
                    await asyncio.sleep(2)
                    continue
                return False, 0
            
            if duration < MIN_DURATION_SECONDS:
                if attempt < max_retries - 1:
                    await asyncio.sleep(2)
                    continue
                else:
                    return False, duration
            
            # Success!
            return True, duration
            
        except Exception as e:
            if attempt < max_retries - 1:
                await asyncio.sleep(2)
                continue
            return False, 0
    
    return False, 0

async def generate_audio_for_attraction(lang: str, attraction: str, current: int, total: int):
    """Generate audio for one attraction in one language"""
    # Load script
    script_file = SOURCE_SCRIPTS / lang / attraction / "deep.txt"
    if not script_file.exists():
        print(f"   [{current}/{total}] ❌ {lang.upper()}/{attraction:20} - Script not found")
        return {"success": False, "duration": 0, "reason": "script_missing"}
    
    with open(script_file, 'r', encoding='utf-8') as f:
        text = f.read()
    
    # Generate audio
    output_file = OUTPUT_AUDIO / lang / attraction / "deep.mp3"
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    print(f"   [{current}/{total}] 🎙️  {lang.upper()}/{attraction:20} ({len(text):6} chars) ", end='', flush=True)
    
    success, duration = await generate_audio_for_text(text, lang, output_file)
    
    if success:
        file_size = output_file.stat().st_size / (1024*1024)
        print(f"→ {format_duration(duration)} ({file_size:.1f}MB) ✅")
        return {
            "success": True,
            "duration": duration,
            "file_size_mb": file_size,
            "file_path": str(output_file)
        }
    else:
        print(f"→ FAILED ❌")
        return {
            "success": False,
            "duration": duration,
            "reason": "generation_failed"
        }

async def generate_all_audio():
    """Generate audio for all translations"""
    stats = {
        "completed": 0,
        "failed": 0,
        "total": 0,
        "total_duration": 0,
        "by_language": {},
        "failed_files": []
    }
    
    # Count total files
    all_tasks = []
    for lang in LANGUAGES:
        lang_dir = SOURCE_SCRIPTS / lang
        if lang_dir.exists():
            attractions = sorted([d.name for d in lang_dir.iterdir() if d.is_dir()])
            for attraction in attractions:
                all_tasks.append((lang, attraction))
    
    stats["total"] = len(all_tasks)
    
    print("="*80)
    print("🎙️  GENERATING NEW AUDIO FROM UPDATED TRANSCRIPTS")
    print("="*80)
    print(f"Source: {SOURCE_SCRIPTS}")
    print(f"Output: {OUTPUT_AUDIO}")
    print(f"Total files: {stats['total']}")
    print(f"Languages: {len(LANGUAGES)}")
    print(f"Using: Microsoft Edge TTS (Neural Voices)")
    print()
    
    # Generate audio for all files
    for idx, (lang, attraction) in enumerate(all_tasks, 1):
        if lang not in stats["by_language"]:
            stats["by_language"][lang] = {
                "completed": 0,
                "failed": 0,
                "total_duration": 0
            }
        
        result = await generate_audio_for_attraction(lang, attraction, idx, stats["total"])
        
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
    
    # Save stats
    stats_file = OUTPUT_AUDIO / "generation_stats.json"
    with open(stats_file, 'w', encoding='utf-8') as f:
        json.dump(stats, f, indent=2)
    
    # Final summary
    print()
    print("="*80)
    print("📊 FINAL SUMMARY")
    print("="*80)
    print(f"✅ Completed: {stats['completed']}/{stats['total']}")
    print(f"❌ Failed: {stats['failed']}")
    print(f"⏱️  Total Duration: {format_duration(stats['total_duration'])}")
    print()
    
    # Per-language summary
    print("Per-Language Results:")
    for lang in sorted(LANGUAGES.keys()):
        if lang in stats["by_language"]:
            lang_stats = stats["by_language"][lang]
            status = "✅" if lang_stats["failed"] == 0 else "⚠️"
            print(f"   {status} {lang.upper()}: {lang_stats['completed']:2} files, {format_duration(lang_stats['total_duration'])}")
    
    print()
    print(f"📁 Output directory: {OUTPUT_AUDIO}")
    print(f"📄 Stats saved: {stats_file}")
    
    if stats["failed_files"]:
        print(f"\n⚠️  Failed Files ({len(stats['failed_files'])}):")
        for failed in stats["failed_files"][:10]:  # Show first 10
            print(f"   - {failed['language']}/{failed['attraction']}: {failed['reason']}")
        if len(stats["failed_files"]) > 10:
            print(f"   ... and {len(stats['failed_files']) - 10} more")
    
    return stats

async def main():
    """Main entry point"""
    print()
    print("="*80)
    print("🎙️  AUDIO REGENERATION PIPELINE")
    print("="*80)
    print()
    print("This will:")
    print("  1. Clean old audio files")
    print("  2. Generate NEW audio from updated transcripts")
    print("  3. Use Microsoft Edge TTS (free, unlimited)")
    print()
    print("Estimated time: 30-60 minutes for 132 files")
    print()
    
    if not check_dependencies():
        print("\n💡 Install missing packages:")
        print("   pip install edge-tts pydub")
        sys.exit(1)
    
    # Auto-confirm if running with --auto flag
    if "--auto" not in sys.argv:
        response = input("Continue? (yes/no): ").strip().lower()
        if response != "yes":
            print("Cancelled.")
            sys.exit(0)
    
    print()
    
    # Step 1: Clean old audio
    clean_old_audio()
    
    # Step 2: Generate new audio
    print("🚀 Starting audio generation...\n")
    stats = await generate_all_audio()
    
    # Check results
    print()
    if stats["failed"] == 0:
        print("="*80)
        print("🎉 ALL AUDIO GENERATED SUCCESSFULLY!")
        print("="*80)
        print()
        print("✅ All 132 audio files created from updated transcripts")
        print(f"✅ Total duration: {format_duration(stats['total_duration'])}")
        print(f"✅ Output: {OUTPUT_AUDIO}")
        print()
        print("Next steps:")
        print("  1. Test a few audio files")
        print("  2. Upload to Cloudflare R2")
        print("  3. Update app to use new audio")
        sys.exit(0)
    else:
        print("="*80)
        print("⚠️  GENERATION COMPLETE WITH SOME FAILURES")
        print("="*80)
        print()
        print(f"✅ Succeeded: {stats['completed']}/{stats['total']}")
        print(f"❌ Failed: {stats['failed']}")
        print()
        print("Check the failed files list above and retry if needed.")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
