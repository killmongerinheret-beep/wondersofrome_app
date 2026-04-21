#!/usr/bin/env python3
"""
Cleanup All Translations
- Removes repetitive phrases from all attractions and languages
- Prepares clean output for TTS
"""

import re
import os
from pathlib import Path

SOURCE_SCRIPTS = Path("D:/wondersofrome/tts_scripts-20260415T211514Z-3-001/tts_scripts")
NEW_TRANSLATIONS = Path("D:/wondersofrome/completed_translations")
OUTPUT_DIR = Path("D:/wondersofrome/cleaned_content")

LANGUAGES = ["ar", "de", "es", "fr", "it", "ja", "ko", "pl", "pt", "ru", "zh"]
ATTRACTIONS = [
    "colosseum", "forum", "heart", "jewish-ghetto", "ostia-antica",
    "pantheon", "sistine-chapel", "st-peters-basilica", "trastevere",
    "vatican-museums", "vatican-pinacoteca"
]

def remove_consecutive_repetitions(text: str, min_repeats: int = 2) -> str:
    """Remove phrases that repeat consecutively"""
    # Split by sentence-ending punctuation followed by space
    sentences = re.split(r'(?<=[.!?])\s+', text)
    cleaned = []
    prev_sentence = None
    
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        
        if sentence == prev_sentence:
            continue # Skip consecutive identical sentences
        else:
            cleaned.append(sentence)
            prev_sentence = sentence
    
    return ' '.join(cleaned)

def remove_phrase_repetitions(text: str, max_occurrences: int = 2) -> str:
    """Remove phrases that appear too many times throughout text"""
    sentences = re.split(r'(?<=[.!?])\s+', text)
    
    # Count occurrences
    phrase_counts = {}
    for sentence in sentences:
        if len(sentence) > 30:  # Only check substantial phrases
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
    
    return ' '.join(cleaned)

def clean_script(lang: str, attraction: str) -> str:
    """Clean script for a language and attraction"""
    # Try new translation first
    new_file = NEW_TRANSLATIONS / lang / attraction / "deep.txt"
    if new_file.exists():
        with open(new_file, 'r', encoding='utf-8') as f:
            text = f.read()
    else:
        # Fall back to existing
        old_file = SOURCE_SCRIPTS / lang / attraction / "deep.txt"
        if not old_file.exists():
            return None
        
        with open(old_file, 'r', encoding='utf-8') as f:
            text = f.read()
    
    original_len = len(text)
    
    # Remove consecutive repetitions
    text = remove_consecutive_repetitions(text)
    
    # Remove excessive phrase repetitions
    text = remove_phrase_repetitions(text, max_occurrences=2)
    
    # Clean up whitespace
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\s+\.', '.', text)
    text = text.strip()
    
    if len(text) < original_len:
        print(f"  ✨ Cleaned {lang}/{attraction}: {original_len} -> {len(text)} chars")
    
    return text

def cleanup_all():
    """Clean up all content"""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    processed = 0
    for lang in LANGUAGES:
        for attraction in ATTRACTIONS:
            cleaned_text = clean_script(lang, attraction)
            if cleaned_text:
                lang_dir = OUTPUT_DIR / lang / attraction
                lang_dir.mkdir(parents=True, exist_ok=True)
                
                output_file = lang_dir / "deep.txt"
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(cleaned_text)
                processed += 1
                
    print(f"\n✅ Cleaned {processed} scripts.")
    print(f"📁 Output: {OUTPUT_DIR}")

if __name__ == "__main__":
    cleanup_all()
