"""
Re-translate Heart & Sistine Chapel to all languages
Verify all other files match English content
"""
import os
import re
import time
from pathlib import Path
from deep_translator import GoogleTranslator

BASE_DIR = Path("D:/wondersofrome/final_cleaned_content")
ENGLISH_DIR = BASE_DIR / "en"

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

FILES_TO_RETRANSLATE = ['heart/deep.txt', 'sistine-chapel/deep.txt']

def translate_text(text, target_lang, max_retries=3):
    """Translate text with chunking and retry logic"""
    try:
        translator = GoogleTranslator(source='en', target=target_lang)
        
        # If text is short enough, translate directly
        if len(text) <= 4000:
            for attempt in range(max_retries):
                try:
                    return translator.translate(text)
                except Exception as e:
                    if attempt < max_retries - 1:
                        print(f"      Retry {attempt + 1}/{max_retries}...")
                        time.sleep(2)
                    else:
                        raise
        
        # Split by sentences for longer text
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        chunks = []
        current_chunk = ""
        
        for sentence in sentences:
            if len(current_chunk) + len(sentence) + 1 < 4000:
                current_chunk += " " + sentence if current_chunk else sentence
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                current_chunk = sentence
        
        if current_chunk:
            chunks.append(current_chunk)
        
        # Translate each chunk
        translated_chunks = []
        for i, chunk in enumerate(chunks):
            print(f"      Chunk {i+1}/{len(chunks)} ({len(chunk)} chars)...")
            
            for attempt in range(max_retries):
                try:
                    translated = translator.translate(chunk)
                    translated_chunks.append(translated)
                    break
                except Exception as e:
                    if attempt < max_retries - 1:
                        print(f"      Retry {attempt + 1}/{max_retries}...")
                        time.sleep(2)
                    else:
                        print(f"      ERROR: {e}")
                        return None
            
            time.sleep(0.5)  # Rate limiting
        
        return ' '.join(translated_chunks)
        
    except Exception as e:
        print(f"      ERROR: {e}")
        return None

def retranslate_file(lang_code, target_lang, file_path):
    """Re-translate a single file"""
    # Read English source
    en_file = ENGLISH_DIR / file_path
    with open(en_file, 'r', encoding='utf-8') as f:
        english_content = f.read()
    
    print(f"   📝 {lang_code}/{file_path}")
    print(f"      English: {len(english_content)} chars")
    
    # Translate
    translated = translate_text(english_content, target_lang)
    
    if not translated:
        print(f"      ❌ FAILED")
        return False
    
    print(f"      Translated: {len(translated)} chars")
    
    # Save
    target_file = BASE_DIR / lang_code / file_path
    target_file.parent.mkdir(parents=True, exist_ok=True)
    with open(target_file, 'w', encoding='utf-8') as f:
        f.write(translated)
    
    print(f"      ✅ Saved")
    return True

def verify_content_match(lang_code, file_path):
    """Verify if translated file roughly matches English length"""
    en_file = ENGLISH_DIR / file_path
    lang_file = BASE_DIR / lang_code / file_path
    
    if not en_file.exists() or not lang_file.exists():
        return {'status': 'MISSING', 'en_length': 0, 'lang_length': 0}
    
    with open(en_file, 'r', encoding='utf-8') as f:
        en_content = f.read()
    
    with open(lang_file, 'r', encoding='utf-8') as f:
        lang_content = f.read()
    
    en_len = len(en_content)
    lang_len = len(lang_content)
    
    # Calculate ratio (some languages are naturally shorter/longer)
    ratio = lang_len / en_len if en_len > 0 else 0
    
    # For CJK languages (Chinese, Japanese, Korean), expect 30-60% of English length
    # For other languages, expect 70-120% of English length
    if lang_code in ['zh', 'ja', 'ko']:
        min_ratio, max_ratio = 0.25, 0.70
    else:
        min_ratio, max_ratio = 0.60, 1.30
    
    if ratio < min_ratio:
        status = 'TOO_SHORT'
    elif ratio > max_ratio:
        status = 'TOO_LONG'
    else:
        status = 'OK'
    
    return {
        'status': status,
        'en_length': en_len,
        'lang_length': lang_len,
        'ratio': ratio
    }

def main():
    print("="*80)
    print("🔄 RE-TRANSLATE & VERIFY ALL LANGUAGES")
    print("="*80)
    print()
    print("This will:")
    print("  1. Re-translate Heart & Sistine Chapel to all 11 languages")
    print("  2. Verify all other files match English content")
    print()
    print(f"Languages: {len(LANGUAGES)}")
    print(f"Files to re-translate: {len(FILES_TO_RETRANSLATE)} per language")
    print(f"Total translations: {len(LANGUAGES) * len(FILES_TO_RETRANSLATE)}")
    print()
    
    input("Press Enter to start...")
    print()
    
    # Step 1: Re-translate Heart & Sistine Chapel
    print("="*80)
    print("STEP 1: RE-TRANSLATING HEART & SISTINE CHAPEL")
    print("="*80)
    print()
    
    retranslate_results = {}
    
    for lang_code, target_lang in LANGUAGES.items():
        print(f"\n🌍 {lang_code.upper()}")
        print("-" * 40)
        
        lang_results = []
        for file_path in FILES_TO_RETRANSLATE:
            success = retranslate_file(lang_code, target_lang, file_path)
            lang_results.append({
                'file': file_path,
                'success': success
            })
            time.sleep(1)  # Rate limiting
        
        retranslate_results[lang_code] = lang_results
    
    # Step 2: Verify all files
    print()
    print("="*80)
    print("STEP 2: VERIFYING ALL FILES")
    print("="*80)
    print()
    
    # Get all attraction files
    all_files = [f.relative_to(ENGLISH_DIR) for f in ENGLISH_DIR.glob("*/deep.txt")]
    
    verification_results = {}
    
    for lang_code in LANGUAGES.keys():
        print(f"\n🔍 Verifying {lang_code.upper()}...")
        
        lang_verification = []
        for file_path in all_files:
            result = verify_content_match(lang_code, str(file_path))
            
            attraction = str(file_path).split('/')[0]
            status_icon = "✅" if result['status'] == 'OK' else "⚠️" if result['status'] in ['TOO_SHORT', 'TOO_LONG'] else "❌"
            
            print(f"   {status_icon} {attraction:20} EN:{result['en_length']:6} {lang_code.upper()}:{result['lang_length']:6} ({result.get('ratio', 0):.1%})")
            
            lang_verification.append({
                'file': str(file_path),
                'attraction': attraction,
                **result
            })
        
        verification_results[lang_code] = lang_verification
    
    # Summary
    print()
    print("="*80)
    print("📊 SUMMARY")
    print("="*80)
    print()
    
    # Re-translation summary
    print("RE-TRANSLATION RESULTS:")
    for lang_code, results in retranslate_results.items():
        success_count = sum(1 for r in results if r['success'])
        total = len(results)
        print(f"   {lang_code.upper()}: {success_count}/{total} files translated")
    print()
    
    # Verification summary
    print("VERIFICATION RESULTS:")
    for lang_code, results in verification_results.items():
        ok_count = sum(1 for r in results if r['status'] == 'OK')
        total = len(results)
        issues = [r for r in results if r['status'] != 'OK']
        
        print(f"   {lang_code.upper()}: {ok_count}/{total} files OK", end='')
        if issues:
            print(f" ({len(issues)} issues)")
            for issue in issues[:3]:  # Show first 3 issues
                print(f"      - {issue['attraction']}: {issue['status']} ({issue.get('ratio', 0):.1%})")
        else:
            print()
    
    print()
    print("="*80)
    print("✅ COMPLETE!")
    print("="*80)
    print()
    print("All languages have been re-translated and verified.")
    print("Check the output above for any issues.")
    print()

if __name__ == "__main__":
    main()
