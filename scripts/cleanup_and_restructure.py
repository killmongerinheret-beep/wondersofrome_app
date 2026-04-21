#!/usr/bin/env python3
"""
Cleanup and Restructure Multilingual Audio Tour Content
- Removes repetitive text artifacts
- Converts plain text scripts to structured JSON
- Prepares content for CDN upload
"""

import json
import re
from pathlib import Path
from typing import Dict, List

# Configuration
SOURCE_SCRIPTS = Path("d:/wondersofrome/tts_scripts-20260415T211514Z-3-001/tts_scripts")
SOURCE_AUDIO = Path("d:/wondersofrome/tts_audio-20260415T211511Z-3-001/tts_audio")
SOURCE_TRANSCRIPTS = Path("d:/wondersofrome/transcripts-20260415T211509Z-3-001/transcripts")
OUTPUT_DIR = Path("d:/wondersofrome/cleaned_content")

LANGUAGES = ["ar", "de", "en", "es", "fr", "it", "ja", "ko", "pl", "pt", "ru", "zh"]
ATTRACTIONS = [
    "colosseum", "forum", "heart", "jewish-ghetto", "ostia-antica",
    "pantheon", "sistine-chapel", "st-peters-basilica", "trastevere",
    "vatican-museums", "vatican-pinacoteca"
]

def remove_repetitive_text(text: str) -> str:
    """
    Remove repetitive phrases that are TTS artifacts.
    Detects when the same phrase repeats 3+ times consecutively.
    """
    lines = text.split('. ')
    cleaned_lines = []
    prev_line = None
    repeat_count = 0
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        if line == prev_line:
            repeat_count += 1
            if repeat_count < 2:  # Keep first occurrence
                cleaned_lines.append(line)
        else:
            repeat_count = 0
            cleaned_lines.append(line)
            prev_line = line
    
    return '. '.join(cleaned_lines)

def clean_script_file(script_path: Path) -> str:
    """Clean a single script file."""
    with open(script_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove repetitive text
    cleaned = remove_repetitive_text(content)
    
    # Remove extra whitespace
    cleaned = re.sub(r'\s+', ' ', cleaned)
    cleaned = re.sub(r'\s+\.', '.', cleaned)
    
    return cleaned.strip()

def create_structured_json(lang: str, attraction: str, script_text: str, 
                          transcript_data: Dict = None) -> Dict:
    """
    Create structured JSON with metadata and content.
    """
    return {
        "sightId": attraction,
        "lang": lang,
        "variant": "deep",
        "script": script_text,
        "audioUrl": f"https://your-cdn.com/{lang}/{attraction}/deep.mp3",
        "duration": transcript_data.get("duration") if transcript_data else None,
        "segments": transcript_data.get("segments") if transcript_data else [],
        "metadata": {
            "agency": "Wonders of Rome",
            "website": "https://wondersofrome.com",
            "version": "1.0",
            "generated": "2026-04-15"
        }
    }

def process_all_content():
    """Process all languages and attractions."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    stats = {
        "processed": 0,
        "errors": 0,
        "languages": {},
        "total_size": 0
    }
    
    for lang in LANGUAGES:
        lang_dir = OUTPUT_DIR / lang
        lang_dir.mkdir(exist_ok=True)
        stats["languages"][lang] = {"attractions": 0, "size": 0}
        
        for attraction in ATTRACTIONS:
            try:
                # Read script
                script_path = SOURCE_SCRIPTS / lang / attraction / "deep.txt"
                if not script_path.exists():
                    print(f"⚠️  Missing: {lang}/{attraction}")
                    continue
                
                # Clean script
                cleaned_script = clean_script_file(script_path)
                
                # Try to load transcript with timestamps (English only)
                transcript_data = None
                if lang == "en":
                    transcript_path = SOURCE_TRANSCRIPTS / attraction / "en" / "deep.json"
                    if transcript_path.exists():
                        with open(transcript_path, 'r', encoding='utf-8') as f:
                            transcript_data = json.load(f).get("transcript", {})
                
                # Create structured JSON
                structured_data = create_structured_json(
                    lang, attraction, cleaned_script, transcript_data
                )
                
                # Save to output
                attraction_dir = lang_dir / attraction
                attraction_dir.mkdir(exist_ok=True)
                
                output_file = attraction_dir / "deep.json"
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(structured_data, f, ensure_ascii=False, indent=2)
                
                # Copy audio file
                audio_src = SOURCE_AUDIO / lang / attraction / "deep.mp3"
                audio_dst = attraction_dir / "deep.mp3"
                if audio_src.exists():
                    import shutil
                    shutil.copy2(audio_src, audio_dst)
                    file_size = audio_dst.stat().st_size
                    stats["total_size"] += file_size
                    stats["languages"][lang]["size"] += file_size
                
                stats["processed"] += 1
                stats["languages"][lang]["attractions"] += 1
                print(f"✅ Processed: {lang}/{attraction}")
                
            except Exception as e:
                print(f"❌ Error processing {lang}/{attraction}: {e}")
                stats["errors"] += 1
    
    # Save processing report
    report_path = OUTPUT_DIR / "processing_report.json"
    with open(report_path, 'w') as f:
        json.dump(stats, f, indent=2)
    
    print(f"\n{'='*60}")
    print(f"Processing Complete!")
    print(f"{'='*60}")
    print(f"✅ Processed: {stats['processed']} files")
    print(f"❌ Errors: {stats['errors']}")
    print(f"📦 Total Size: {stats['total_size'] / (1024*1024):.2f} MB")
    print(f"📁 Output: {OUTPUT_DIR}")
    print(f"\nLanguage Breakdown:")
    for lang, data in stats["languages"].items():
        size_mb = data["size"] / (1024*1024)
        print(f"  {lang}: {data['attractions']} attractions, {size_mb:.2f} MB")

if __name__ == "__main__":
    print("Starting content cleanup and restructuring...")
    print(f"Source Scripts: {SOURCE_SCRIPTS}")
    print(f"Source Audio: {SOURCE_AUDIO}")
    print(f"Output: {OUTPUT_DIR}")
    print()
    
    process_all_content()
