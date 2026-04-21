import os
import json
from pathlib import Path
from pydub import AudioSegment

AUDIO_DIR = Path("D:/wondersofrome/generated_audio_production")
SCRIPT_DIR = Path("D:/wondersofrome/cleaned_production_content_v2")

def verify_durations():
    print("🕵️  Verifying Audio Quality & Lag Detection...")
    
    issues = 0
    for root, dirs, files in os.walk(AUDIO_DIR):
        for file in files:
            if file.endswith(".mp3"):
                audio_path = Path(root) / file
                
                # Get duration
                audio = AudioSegment.from_mp3(str(audio_path))
                duration_sec = len(audio) / 1000.0
                
                # Logic: If duration > 10 mins but script < 10k chars, it's a repetition bug
                # 10k chars is usually ~12-15 mins of speech.
                
                # Find matching script
                rel_path = audio_path.relative_to(AUDIO_DIR).with_suffix(".txt")
                script_path = SCRIPT_DIR / rel_path
                
                if script_path.exists():
                    with open(script_path, 'r', encoding='utf-8') as f:
                        text = f.read()
                    
                    # Estimate expected duration (approx 150 words per minute, 6 chars per word)
                    # 900 chars per minute. 
                    expected_max = (len(text) / 500) * 60 # Very conservative (500 chars/min)
                    
                    if duration_sec > expected_max + 120 and duration_sec > 600:
                        print(f"🔴 LAG DETECTED: {audio_path.parent.parent.name}/{audio_path.parent.name}")
                        print(f"   Actual: {duration_sec/60:.1f}m, Max Expected: {expected_max/60:.1f}m")
                        issues += 1
    
    if issues == 0:
        print("\n✅ All audio files verified! No repetition loops or lag detected.")
    else:
        print(f"\n⚠️  Found {issues} files with potential lag issues.")

if __name__ == "__main__":
    verify_durations()
