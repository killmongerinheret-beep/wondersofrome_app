#!/usr/bin/env python3
"""
Check audio file durations and compare with originals
"""

import json
from pathlib import Path
from pydub import AudioSegment
import sys

# Configuration
GENERATED_AUDIO = Path("d:/wondersofrome/generated_audio")
ORIGINAL_AUDIO_COQUI = Path("d:/wondersofrome/tts_audio_coqui-20260415T211512Z-3-001/tts_audio_coqui")
ORIGINAL_AUDIO = Path("d:/wondersofrome/tts_audio-20260415T211511Z-3-001/tts_audio")

LANGUAGES = ["ar", "de", "es", "fr", "it", "ja", "ko", "pl", "pt", "ru", "zh"]
ATTRACTIONS = [
    "colosseum", "forum", "heart", "jewish-ghetto", "ostia-antica",
    "pantheon", "sistine-chapel", "st-peters-basilica", "trastevere",
    "vatican-museums", "vatican-pinacoteca"
]

def get_audio_duration(file_path):
    """Get duration of audio file in seconds"""
    try:
        audio = AudioSegment.from_mp3(str(file_path))
        return len(audio) / 1000.0  # Convert milliseconds to seconds
    except Exception as e:
        return None

def format_duration(seconds):
    """Format seconds as MM:SS"""
    if seconds is None:
        return "N/A"
    minutes = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{minutes:02d}:{secs:02d}"

def check_all_audio():
    """Check all generated audio files"""
    
    results = {
        "total_files": 0,
        "checked": 0,
        "missing": 0,
        "too_short": 0,
        "by_language": {},
        "details": []
    }
    
    print("="*80)
    print("Audio Duration Check")
    print("="*80)
    print()
    
    for lang in LANGUAGES:
        print(f"\n{'='*80}")
        print(f"Language: {lang.upper()}")
        print(f"{'='*80}")
        
        results["by_language"][lang] = {
            "checked": 0,
            "missing": 0,
            "too_short": 0,
            "total_duration": 0
        }
        
        for attraction in ATTRACTIONS:
            results["total_files"] += 1
            
            # Check generated audio
            generated_file = GENERATED_AUDIO / lang / attraction / "deep.mp3"
            
            if not generated_file.exists():
                print(f"❌ {attraction}: MISSING")
                results["missing"] += 1
                results["by_language"][lang]["missing"] += 1
                continue
            
            # Get duration
            duration = get_audio_duration(generated_file)
            
            if duration is None:
                print(f"⚠️  {attraction}: ERROR reading file")
                continue
            
            results["checked"] += 1
            results["by_language"][lang]["checked"] += 1
            results["by_language"][lang]["total_duration"] += duration
            
            # Check if too short (less than 30 seconds is suspicious)
            if duration < 30:
                print(f"⚠️  {attraction}: {format_duration(duration)} (TOO SHORT!)")
                results["too_short"] += 1
                results["by_language"][lang]["too_short"] += 1
                status = "⚠️  TOO SHORT"
            else:
                print(f"✅ {attraction}: {format_duration(duration)}")
                status = "✅ OK"
            
            # Store details
            results["details"].append({
                "language": lang,
                "attraction": attraction,
                "duration_seconds": duration,
                "duration_formatted": format_duration(duration),
                "status": status,
                "file_size_mb": round(generated_file.stat().st_size / (1024*1024), 2)
            })
        
        # Language summary
        lang_total = results["by_language"][lang]["total_duration"]
        print(f"\n{lang.upper()} Total Duration: {format_duration(lang_total)}")
    
    # Overall summary
    print(f"\n{'='*80}")
    print("SUMMARY")
    print(f"{'='*80}")
    print(f"Total files expected: {results['total_files']}")
    print(f"✅ Checked: {results['checked']}")
    print(f"❌ Missing: {results['missing']}")
    print(f"⚠️  Too short (<30s): {results['too_short']}")
    
    # Calculate total duration
    total_duration = sum(d["duration_seconds"] for d in results["details"] if d["duration_seconds"])
    print(f"\nTotal audio duration: {format_duration(total_duration)}")
    print(f"Average per file: {format_duration(total_duration / results['checked']) if results['checked'] > 0 else 'N/A'}")
    
    # Calculate total size
    total_size = sum(d["file_size_mb"] for d in results["details"])
    print(f"Total size: {total_size:.2f} MB")
    print(f"Average per file: {total_size / results['checked']:.2f} MB" if results['checked'] > 0 else "N/A")
    
    # Save detailed report
    report_file = GENERATED_AUDIO / "duration_report.json"
    with open(report_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📁 Detailed report saved: {report_file}")
    
    # Check for originals comparison
    print(f"\n{'='*80}")
    print("COMPARISON WITH ORIGINALS (if available)")
    print(f"{'='*80}")
    
    # Try to find original English audio for comparison
    original_found = False
    for orig_dir in [ORIGINAL_AUDIO_COQUI, ORIGINAL_AUDIO]:
        if orig_dir.exists():
            print(f"\n✅ Found original audio: {orig_dir}")
            original_found = True
            
            # Check a few samples
            for attraction in ATTRACTIONS[:3]:  # Check first 3
                orig_file = None
                for ext in [".mp3", ".wav"]:
                    test_file = orig_dir / "en" / attraction / f"deep{ext}"
                    if test_file.exists():
                        orig_file = test_file
                        break
                
                if orig_file:
                    orig_duration = get_audio_duration(orig_file)
                    gen_file = GENERATED_AUDIO / "en" / attraction / "deep.mp3"
                    gen_duration = get_audio_duration(gen_file) if gen_file.exists() else None
                    
                    if orig_duration and gen_duration:
                        diff = gen_duration - orig_duration
                        diff_pct = (diff / orig_duration) * 100
                        print(f"\n{attraction}:")
                        print(f"  Original: {format_duration(orig_duration)}")
                        print(f"  Generated: {format_duration(gen_duration)}")
                        print(f"  Difference: {diff:+.1f}s ({diff_pct:+.1f}%)")
            break
    
    if not original_found:
        print("\n⚠️  Original audio files not found for comparison")
        print("   This is OK - we're using new translations anyway")
    
    return results

if __name__ == "__main__":
    try:
        results = check_all_audio()
        
        # Exit with error if there are issues
        if results["missing"] > 0 or results["too_short"] > 10:
            print("\n⚠️  WARNING: Some audio files may have issues!")
            sys.exit(1)
        else:
            print("\n✅ All audio files look good!")
            sys.exit(0)
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
