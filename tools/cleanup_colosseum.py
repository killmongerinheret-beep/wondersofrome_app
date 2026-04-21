#!/usr/bin/env python3
"""
Cleanup Colosseum Translations
- Removes repetitive phrases from existing Colosseum translations
- Merges with new complete translations if available
- Prepares clean output for TTS
"""

import re
from pathlib import Path

SOURCE_SCRIPTS = Path("D:/wondersofrome/tts_scripts-20260415T211514Z-3-001/tts_scripts")
NEW_TRANSLATIONS = Path("D:/wondersofrome/completed_translations")
OUTPUT_DIR = Path("D:/wondersofrome/cleaned_colosseum")

LANGUAGES = ["ar", "de", "es", "fr", "it", "ja", "ko", "pl", "pt", "ru", "zh"]

def remove_consecutive_repetitions(text: str, min_repeats: int = 3) -> str:
    """Remove phrases that repeat consecutively"""
    sentences = text.split('. ')
    cleaned = []
    prev_sentence = None
    repeat_count = 0
    
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        
        if sentence == prev_sentence:
            repeat_count += 1
            if repeat_count < min_repeats:
                cleaned.append(sentence)
        else:
            repeat_count = 0
            cleaned.append(sentence)
            prev_sentence = sentence
    
    return '. '.join(cleaned)

def remove_phrase_repetitions(text: str, max_occurrences: int = 3) -> str:
    """Remove phrases that appear too many times throughout text"""
    sentences = text.split('. ')
    
    # Count occurrences
    phrase_counts = {}
    for sentence in sentences:
        if len(sentence) > 20:  # Only check substantial phrases
            phrase_counts[sentence] = phrase_counts.get(sentence, 0) + 1
    
    # Keep only first N occurrences of each phrase
    phrase_seen = {}
    cleaned = []
    
    for sentence in sentences:
        if sentence in phrase_counts and phrase_counts[sentence] > max_occurrences:
            count = phrase_seen.get(sentence, 0)
            if count < max_occurrences:
                cleaned.append(sentence)
                phrase_seen[sentence] = count + 1
        else:
            cleaned.append(sentence)
    
    return '. '.join(cleaned)

def clean_colosseum_script(lang: str) -> str:
    """Clean Colosseum script for a language"""
    # Try new translation first
    new_file = NEW_TRANSLATIONS / lang / "colosseum" / "deep.txt"
    if new_file.exists():
        print(f"  Using new translation for {lang}")
        with open(new_file, 'r', encoding='utf-8') as f:
            text = f.read()
    else:
        # Fall back to existing
        old_file = SOURCE_SCRIPTS / lang / "colosseum" / "deep.txt"
        if not old_file.exists():
            print(f"  ⚠️  No file found for {lang}")
            return None
        
        print(f"  Using existing translation for {lang}")
        with open(old_file, 'r', encoding='utf-8') as f:
            text = f.read()
    
    print(f"    Original length: {len(text)} chars")
    
    # Remove consecutive repetitions
    text = remove_consecutive_repetitions(text, min_repeats=3)
    print(f"    After removing consecutive: {len(text)} chars")
    
    # Remove excessive phrase repetitions
    text = remove_phrase_repetitions(text, max_occurrences=2)
    print(f"    After removing repetitions: {len(text)} chars")
    
    # Clean up whitespace
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\s+\.', '.', text)
    text = text.strip()
    
    print(f"    Final length: {len(text)} chars")
    
    return text

def cleanup_all():
    """Clean up Colosseum for all languages"""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    stats = {
        "processed": 0,
        "failed": 0,
        "total_original_chars": 0,
        "total_cleaned_chars": 0
    }
    
    for lang in LANGUAGES:
        print(f"\nCleaning {lang}...")
        
        try:
            cleaned_text = clean_colosseum_script(lang)
            
            if cleaned_text:
                # Save cleaned version
                lang_dir = OUTPUT_DIR / lang / "colosseum"
                lang_dir.mkdir(parents=True, exist_ok=True)
                
                output_file = lang_dir / "deep.txt"
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(cleaned_text)
                
                stats["processed"] += 1
                stats["total_cleaned_chars"] += len(cleaned_text)
                
                print(f"  ✅ Saved: {output_file}")
            else:
                stats["failed"] += 1
                
        except Exception as e:
            print(f"  ❌ Error: {e}")
            stats["failed"] += 1
    
    print(f"\n{'='*60}")
    print(f"CLEANUP COMPLETE")
    print(f"{'='*60}")
    print(f"✅ Processed: {stats['processed']}")
    print(f"❌ Failed: {stats['failed']}")
    print(f"📊 Average cleaned length: {stats['total_cleaned_chars'] // stats['processed'] if stats['processed'] > 0 else 0} chars")
    print(f"\nOutput: {OUTPUT_DIR}")

if __name__ == "__main__":
    print("="*60)
    print("Colosseum Cleanup Tool")
    print("="*60)
    print(f"Source: {SOURCE_SCRIPTS}")
    print(f"New translations: {NEW_TRANSLATIONS}")
    print(f"Output: {OUTPUT_DIR}")
    print()
    
    cleanup_all()
