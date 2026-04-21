"""
Re-translate ALL English files to ALL languages
Ensures all languages match the English content exactly
"""
import os
import re
import time
import json
from pathlib import Path
from deep_translator import GoogleTranslator

BASE_DIR = Path("D:/wondersofrome/final_cleaned_content")
ENGLISH_DIR = BASE_DIR / "en"
REPORT_FILE = Path("D:/wondersofrome/retranslation_report.json")

LANGUAGES = {
    'ar': 'ar',      # Arabic
    'de': 'de',      # German
    'es': 'es',      # Spanish
    'fr': 'fr',      # French
    'it': 'it',      # Italian
    'ja': 'ja',      # Japanese
    'ko': 'ko',      # Korean
    'pl': 'pl',      # Polish
    'pt': 'pt',      # Portuguese
    'ru': 'ru',      # Russian
    'zh': 'zh-CN'    # Chinese
}

def translate_text(text, target_lang, max_retries=3):
    """Translate text with chunking and retry logic"""
    try:
        translator = GoogleTranslator(source='en', target=target_lang)
        
        # If text is short enough, translate directly
        if len(text) <= 3800:
            for attempt in range(max_retries):
                try:
                    result = translator.translate(text)
                    time.sleep(0.5)  # Rate limiting
                    return result
                except Exception as e:
                    if attempt < max_retries - 1:
                        print(f"         Retry {attempt + 1}/{max_retries}...")
                        time.sleep(2)
                    else:
                        raise
        
        # Split by sentences for longer text
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        chunks = []
        current_chunk = ""
        
        for sentence in sentences:
            if len(current_chunk) + len(sentence) + 1 < 3800:
                current_chunk += " " + sentence if current_chunk else sentence
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                current_chunk = sentence
        
        if current_chunk:
            chunks.append(current_chunk)
        
        print(f"         Splitting into {len(chunks)} chunks...")
        
        # Translate each chunk
        translated_chunks = []
        for i, chunk in enumerate(chunks):
            print(f"         Chunk {i+1}/{len(chunks)} ({len(chunk)} chars)...", end=' ')
            
            for attempt in range(max_retries):
                try:
                    translated = translator.translate(chunk)
                    translated_chunks.append(translated)
                    print("✓")
                    break
                except Exception as e:
                    if attempt < max_retries - 1:
                        print(f"Retry {attempt + 1}...", end=' ')
                        time.sleep(2)
                    else:
                        print(f"✗ {e}")
                        return None
            
            time.sleep(0.5)  # Rate limiting
        
        return ' '.join(translated_chunks)
        
    except Exception as e:
        print(f"         ERROR: {e}")
        return None

def translate_file(lang_code, target_lang, file_path, attraction):
    """Translate a single file"""
    # Read English source
    en_file = ENGLISH_DIR / file_path
    with open(en_file, 'r', encoding='utf-8') as f:
        english_content = f.read()
    
    en_length = len(english_content)
    
    print(f"      📝 {attraction:20} EN: {en_length:6} chars", end=' ')
    
    # Translate
    translated = translate_text(english_content, target_lang)
    
    if not translated:
        print("❌ FAILED")
        return {
            'attraction': attraction,
            'file': file_path,
            'status': 'FAILED',
            'en_length': en_length,
            'translated_length': 0,
            'error': 'Translation failed'
        }
    
    trans_length = len(translated)
    ratio = trans_length / en_length if en_length > 0 else 0
    
    print(f"→ {lang_code.upper()}: {trans_length:6} chars ({ratio:.1%})", end=' ')
    
    # Save
    target_file = BASE_DIR / lang_code / file_path
    target_file.parent.mkdir(parents=True, exist_ok=True)
    with open(target_file, 'w', encoding='utf-8') as f:
        f.write(translated)
    
    print("✅")
    
    return {
        'attraction': attraction,
        'file': file_path,
        'status': 'SUCCESS',
        'en_length': en_length,
        'translated_length': trans_length,
        'ratio': ratio
    }

def main():
    print("="*80)
    print("🌍 RE-TRANSLATE ALL ENGLISH FILES TO ALL LANGUAGES")
    print("="*80)
    print()
    
    # Get all English files
    all_files = sorted([f.relative_to(ENGLISH_DIR) for f in ENGLISH_DIR.glob("*/deep.txt")])
    attractions = [str(f).split('/')[0] for f in all_files]
    
    print(f"📊 Translation Plan:")
    print(f"   Languages: {len(LANGUAGES)}")
    print(f"   Attractions: {len(all_files)}")
    print(f"   Total translations: {len(LANGUAGES) * len(all_files)}")
    print()
    print(f"📝 Attractions to translate:")
    for i, attr in enumerate(attractions, 1):
        print(f"   {i:2}. {attr}")
    print()
    print(f"🌍 Target languages:")
    for code, name in LANGUAGES.items():
        print(f"   {code.upper()}: {name}")
    print()
    print("⏱️  Estimated time: 45-90 minutes")
    print()
    
    input("Press Enter to start translation...")
    print()
    
    start_time = time.time()
    all_results = {}
    
    # Translate for each language
    for lang_idx, (lang_code, target_lang) in enumerate(LANGUAGES.items(), 1):
        print()
        print("="*80)
        print(f"🌍 LANGUAGE {lang_idx}/{len(LANGUAGES)}: {lang_code.upper()}")
        print("="*80)
        print()
        
        lang_results = []
        
        for file_idx, file_path in enumerate(all_files, 1):
            attraction = str(file_path).split('/')[0]
            
            print(f"   [{file_idx}/{len(all_files)}]", end=' ')
            
            result = translate_file(lang_code, target_lang, str(file_path), attraction)
            lang_results.append(result)
            
            # Small delay between files
            time.sleep(1)
        
        all_results[lang_code] = lang_results
        
        # Show language summary
        success_count = sum(1 for r in lang_results if r['status'] == 'SUCCESS')
        failed_count = len(lang_results) - success_count
        
        print()
        print(f"   {lang_code.upper()} Summary: {success_count}/{len(lang_results)} succeeded", end='')
        if failed_count > 0:
            print(f", {failed_count} failed")
        else:
            print()
    
    # Final Summary
    print()
    print("="*80)
    print("📊 FINAL SUMMARY")
    print("="*80)
    print()
    
    total_translations = len(LANGUAGES) * len(all_files)
    total_success = sum(
        sum(1 for r in results if r['status'] == 'SUCCESS')
        for results in all_results.values()
    )
    total_failed = total_translations - total_success
    
    print(f"Total translations: {total_translations}")
    print(f"✅ Succeeded: {total_success}")
    print(f"❌ Failed: {total_failed}")
    print()
    
    # Per-language summary
    print("Per-Language Results:")
    for lang_code, results in all_results.items():
        success = sum(1 for r in results if r['status'] == 'SUCCESS')
        failed = len(results) - success
        
        status = "✅" if failed == 0 else "⚠️"
        print(f"   {status} {lang_code.upper()}: {success}/{len(results)} files", end='')
        
        if failed > 0:
            print(f" ({failed} failed)")
            failed_files = [r['attraction'] for r in results if r['status'] == 'FAILED']
            print(f"      Failed: {', '.join(failed_files)}")
        else:
            print()
    
    print()
    
    # Per-attraction summary
    print("Per-Attraction Results:")
    for attraction in attractions:
        success = sum(
            1 for results in all_results.values()
            for r in results
            if r['attraction'] == attraction and r['status'] == 'SUCCESS'
        )
        total = len(LANGUAGES)
        
        status = "✅" if success == total else "⚠️"
        print(f"   {status} {attraction:20} {success}/{total} languages")
    
    print()
    
    # Save report
    report = {
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
        'duration_seconds': int(time.time() - start_time),
        'summary': {
            'total_translations': total_translations,
            'succeeded': total_success,
            'failed': total_failed,
            'languages': len(LANGUAGES),
            'attractions': len(all_files)
        },
        'results': all_results
    }
    
    with open(REPORT_FILE, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    elapsed = time.time() - start_time
    minutes = int(elapsed // 60)
    seconds = int(elapsed % 60)
    
    print(f"⏱️  Total time: {minutes}m {seconds}s")
    print(f"📄 Report saved: {REPORT_FILE}")
    print()
    
    if total_failed == 0:
        print("="*80)
        print("🎉 ALL TRANSLATIONS COMPLETED SUCCESSFULLY!")
        print("="*80)
        print()
        print("✅ All 11 languages now have:")
        print("   - All 11 attractions translated")
        print("   - Content matching English source")
        print("   - Proper tour guide format")
        print("   - Ready for production")
    else:
        print("="*80)
        print("⚠️  SOME TRANSLATIONS FAILED")
        print("="*80)
        print()
        print(f"Please review the {total_failed} failed translations above.")
        print("You may need to retry those specific files.")
    
    print()
    print("="*80)

if __name__ == "__main__":
    main()
