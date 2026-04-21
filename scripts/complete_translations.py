#!/usr/bin/env python3
"""
Complete Translation Pipeline using Open-Source Models
- Uses Argos Translate (offline, free, open-source)
- Translates full English transcripts to all 12 languages
- Generates clean, structured output ready for TTS
- No API costs, runs locally
"""

import json
import re
from pathlib import Path
from typing import Dict, List
import sys

# Configuration
SOURCE_TRANSCRIPTS = Path("d:/wondersofrome/transcripts-20260415T211509Z-3-001/transcripts")
OUTPUT_DIR = Path("d:/wondersofrome/completed_translations")

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

ATTRACTIONS = [
    "colosseum", "forum", "heart", "jewish-ghetto", "ostia-antica",
    "pantheon", "sistine-chapel", "st-peters-basilica", "trastevere",
    "vatican-museums", "vatican-pinacoteca"
]

# Argos Translate language codes
ARGOS_LANG_CODES = {
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
    "zh": "zh"
}

def check_dependencies():
    """Check if required packages are installed"""
    try:
        import argostranslate.package
        import argostranslate.translate
        return True
    except ImportError:
        print("❌ Argos Translate not installed!")
        print("\nTo install:")
        print("  pip install argostranslate")
        print("\nOr use alternative method with transformers:")
        print("  pip install transformers torch sentencepiece")
        return False

def install_language_packages():
    """Install Argos Translate language packages"""
    try:
        import argostranslate.package
        
        print("📦 Installing language packages...")
        argostranslate.package.update_package_index()
        available_packages = argostranslate.package.get_available_packages()
        
        # Install English to target language packages
        for lang_code in ARGOS_LANG_CODES.values():
            # Find package from English to target language
            package = next(
                (p for p in available_packages 
                 if p.from_code == "en" and p.to_code == lang_code),
                None
            )
            if package:
                print(f"  Installing en → {lang_code}...")
                argostranslate.package.install_from_path(package.download())
            else:
                print(f"  ⚠️  Package en → {lang_code} not found")
        
        print("✅ Language packages installed\n")
        return True
    except Exception as e:
        print(f"❌ Error installing packages: {e}")
        return False

def load_english_transcript(attraction: str) -> Dict:
    """Load full English transcript"""
    transcript_path = SOURCE_TRANSCRIPTS / attraction / "en" / "deep.json"
    if transcript_path.exists():
        with open(transcript_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def extract_full_text(transcript_data: Dict) -> str:
    """Extract full text from transcript segments"""
    if "transcript" not in transcript_data:
        return ""
    
    segments = transcript_data["transcript"].get("segments", [])
    full_text = " ".join([seg.get("text", "").strip() for seg in segments])
    return full_text

def translate_with_argos(text: str, target_lang: str) -> str:
    """Translate text using Argos Translate"""
    try:
        import argostranslate.translate
        
        # Split into chunks (Argos works better with smaller chunks)
        sentences = re.split(r'(?<=[.!?])\s+', text)
        translated_sentences = []
        
        for i, sentence in enumerate(sentences):
            if not sentence.strip():
                continue
            
            try:
                translated = argostranslate.translate.translate(
                    sentence, 
                    "en", 
                    ARGOS_LANG_CODES[target_lang]
                )
                translated_sentences.append(translated)
                
                # Progress indicator
                if (i + 1) % 50 == 0:
                    print(f"    Translated {i + 1}/{len(sentences)} sentences...")
                    
            except Exception as e:
                print(f"    ⚠️  Error translating sentence {i}: {e}")
                translated_sentences.append(sentence)  # Keep original on error
        
        return " ".join(translated_sentences)
        
    except Exception as e:
        print(f"❌ Translation error: {e}")
        return text

def translate_with_transformers(text: str, target_lang: str) -> str:
    """Alternative: Translate using Hugging Face transformers (NLLB-200)"""
    try:
        from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
        
        print(f"    Loading NLLB-200 model (first time may take a while)...")
        
        # NLLB-200 language codes
        nllb_codes = {
            "ar": "arb_Arab",
            "de": "deu_Latn",
            "es": "spa_Latn",
            "fr": "fra_Latn",
            "it": "ita_Latn",
            "ja": "jpn_Jpan",
            "ko": "kor_Hang",
            "pl": "pol_Latn",
            "pt": "por_Latn",
            "ru": "rus_Cyrl",
            "zh": "zho_Hans"
        }
        
        model_name = "facebook/nllb-200-distilled-600M"
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
        
        # Split into chunks (max 512 tokens)
        sentences = re.split(r'(?<=[.!?])\s+', text)
        translated_sentences = []
        
        for i, sentence in enumerate(sentences):
            if not sentence.strip():
                continue
            
            try:
                tokenizer.src_lang = "eng_Latn"
                inputs = tokenizer(sentence, return_tensors="pt", max_length=512, truncation=True)
                
                translated_tokens = model.generate(
                    **inputs,
                    forced_bos_token_id=tokenizer.lang_code_to_id[nllb_codes[target_lang]],
                    max_length=512
                )
                
                translated = tokenizer.batch_decode(translated_tokens, skip_special_tokens=True)[0]
                translated_sentences.append(translated)
                
                if (i + 1) % 10 == 0:
                    print(f"    Translated {i + 1}/{len(sentences)} sentences...")
                    
            except Exception as e:
                print(f"    ⚠️  Error translating sentence {i}: {e}")
                translated_sentences.append(sentence)
        
        return " ".join(translated_sentences)
        
    except Exception as e:
        print(f"❌ Transformers translation error: {e}")
        return text

def clean_translation(text: str) -> str:
    """Clean up translated text"""
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Fix spacing around punctuation
    text = re.sub(r'\s+([.,!?;:])', r'\1', text)
    text = re.sub(r'([.,!?;:])\s*', r'\1 ', text)
    
    # Remove duplicate sentences
    sentences = text.split('. ')
    seen = set()
    unique_sentences = []
    for sentence in sentences:
        sentence = sentence.strip()
        if sentence and sentence not in seen:
            seen.add(sentence)
            unique_sentences.append(sentence)
    
    return '. '.join(unique_sentences)

def translate_attraction(attraction: str, lang: str, use_transformers: bool = False) -> Dict:
    """Translate a single attraction to target language"""
    print(f"\n{'='*60}")
    print(f"Translating: {attraction} → {LANGUAGES[lang]} ({lang})")
    print(f"{'='*60}")
    
    # Load English source
    english_data = load_english_transcript(attraction)
    if not english_data:
        print(f"❌ No English transcript found for {attraction}")
        return None
    
    english_text = extract_full_text(english_data)
    if not english_text:
        print(f"❌ No text extracted from {attraction}")
        return None
    
    print(f"📝 Source text: {len(english_text)} characters")
    print(f"🔄 Translating...")
    
    # Translate
    if use_transformers:
        translated_text = translate_with_transformers(english_text, lang)
    else:
        translated_text = translate_with_argos(english_text, lang)
    
    print(f"✅ Translated: {len(translated_text)} characters")
    
    # Clean up
    print(f"🧹 Cleaning translation...")
    cleaned_text = clean_translation(translated_text)
    
    # Create structured output
    result = {
        "sightId": attraction,
        "lang": lang,
        "variant": "deep",
        "script": cleaned_text,
        "metadata": {
            "source": "English transcript",
            "translation_method": "transformers-nllb" if use_transformers else "argos-translate",
            "original_length": len(english_text),
            "translated_length": len(cleaned_text),
            "agency": "Wonders of Rome",
            "website": "https://wondersofrome.com"
        }
    }
    
    return result

def translate_all(use_transformers: bool = False):
    """Translate all attractions to all languages"""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    stats = {
        "completed": 0,
        "failed": 0,
        "total": len(ATTRACTIONS) * len(LANGUAGES),
        "by_language": {},
        "by_attraction": {}
    }
    
    for lang in LANGUAGES:
        lang_dir = OUTPUT_DIR / lang
        lang_dir.mkdir(exist_ok=True)
        stats["by_language"][lang] = {"completed": 0, "failed": 0}
        
        for attraction in ATTRACTIONS:
            try:
                result = translate_attraction(attraction, lang, use_transformers)
                
                if result:
                    # Save translation
                    attraction_dir = lang_dir / attraction
                    attraction_dir.mkdir(exist_ok=True)
                    
                    output_file = attraction_dir / "deep.json"
                    with open(output_file, 'w', encoding='utf-8') as f:
                        json.dump(result, f, ensure_ascii=False, indent=2)
                    
                    # Also save as plain text for TTS
                    text_file = attraction_dir / "deep.txt"
                    with open(text_file, 'w', encoding='utf-8') as f:
                        f.write(result["script"])
                    
                    stats["completed"] += 1
                    stats["by_language"][lang]["completed"] += 1
                    
                    if attraction not in stats["by_attraction"]:
                        stats["by_attraction"][attraction] = {"completed": 0, "failed": 0}
                    stats["by_attraction"][attraction]["completed"] += 1
                    
                    print(f"✅ Saved: {output_file}")
                else:
                    stats["failed"] += 1
                    stats["by_language"][lang]["failed"] += 1
                    
            except Exception as e:
                print(f"❌ Error: {e}")
                stats["failed"] += 1
                stats["by_language"][lang]["failed"] += 1
    
    # Save stats
    stats_file = OUTPUT_DIR / "translation_stats.json"
    with open(stats_file, 'w') as f:
        json.dump(stats, f, indent=2)
    
    print(f"\n{'='*60}")
    print(f"TRANSLATION COMPLETE")
    print(f"{'='*60}")
    print(f"✅ Completed: {stats['completed']}/{stats['total']}")
    print(f"❌ Failed: {stats['failed']}")
    print(f"\nOutput directory: {OUTPUT_DIR}")
    
    return stats

if __name__ == "__main__":
    print("="*60)
    print("Complete Translation Pipeline")
    print("="*60)
    print(f"Source: {SOURCE_TRANSCRIPTS}")
    print(f"Output: {OUTPUT_DIR}")
    print(f"Languages: {len(LANGUAGES)}")
    print(f"Attractions: {len(ATTRACTIONS)}")
    print(f"Total files to generate: {len(LANGUAGES) * len(ATTRACTIONS)}")
    print()
    
    # Check method
    use_transformers = "--transformers" in sys.argv or "-t" in sys.argv
    
    if use_transformers:
        print("🤖 Using Hugging Face Transformers (NLLB-200)")
        print("   Better quality, slower, requires ~2GB download first time")
        print()
        try:
            import transformers
            import torch
        except ImportError:
            print("❌ Transformers not installed!")
            print("Install with: pip install transformers torch sentencepiece")
            sys.exit(1)
    else:
        print("🚀 Using Argos Translate (default)")
        print("   Faster, offline, good quality")
        print("   (Use --transformers flag for higher quality)")
        print()
        
        if not check_dependencies():
            print("\n💡 Install Argos Translate:")
            print("   pip install argostranslate")
            sys.exit(1)
        
        if not install_language_packages():
            print("❌ Failed to install language packages")
            sys.exit(1)
    
    # Confirm before starting
    print("⚠️  This will translate ~300,000 words across 11 languages")
    print("   Estimated time: 2-6 hours depending on method and hardware")
    print()
    
    response = input("Continue? (yes/no): ").strip().lower()
    if response != "yes":
        print("Cancelled.")
        sys.exit(0)
    
    print("\n🚀 Starting translation pipeline...\n")
    stats = translate_all(use_transformers)
    
    print("\n✅ All translations complete!")
    print(f"📁 Check output in: {OUTPUT_DIR}")
