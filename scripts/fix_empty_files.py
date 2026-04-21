"""
Fix Empty/Short Files by Translating from English
Uses Google Translate API (free tier)
"""
import os
import json
from pathlib import Path
from deep_translator import GoogleTranslator

# Directories
SOURCE_DIR = Path("D:/wondersofrome/final_cleaned_content")
REPORT_FILE = Path("D:/wondersofrome/empty_files_fix_report.json")

# Files that need fixing (from verification)
EMPTY_FILES = {
    'ja': [
        'forum/deep.txt',
        'jewish-ghetto/deep.txt',
        'ostia-antica/deep.txt',
        'st-peters-basilica/deep.txt',
        'trastevere/deep.txt',
        'vatican-museums/deep.txt',
        'heart/deep.txt',
        'pantheon/deep.txt',
        'sistine-chapel/deep.txt',
        'vatican-pinacoteca/deep.txt'
    ],
    'zh': [
        'forum/deep.txt',
        'heart/deep.txt',
        'jewish-ghetto/deep.txt',
        'ostia-antica/deep.txt',
        'st-peters-basilica/deep.txt',
        'trastevere/deep.txt',
        'vatican-museums/deep.txt',
        'pantheon/deep.txt',
        'sistine-chapel/deep.txt',
        'vatican-pinacoteca/deep.txt'
    ],
    'ko': [
        'forum/deep.txt',
        'ostia-antica/deep.txt',
        'pantheon/deep.txt',
        'st-peters-basilica/deep.txt',
        'vatican-pinacoteca/deep.txt'
    ]
}

LANGUAGE_CODES = {
    'ja': 'ja',  # Japanese
    'zh': 'zh-CN',  # Chinese Simplified
    'ko': 'ko'  # Korean
}

def translate_text(text, target_lang):
    """Translate text to target language using Google Translate"""
    try:
        translator = GoogleTranslator(source='en', target=target_lang)
        
        # Split into chunks (Google Translate has 5000 char limit)
        max_chunk = 4000  # Lower limit for safety
        
        if len(text) <= max_chunk:
            return translator.translate(text)
        
        # Split by sentences first (more reliable than paragraphs)
        import re
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        chunks = []
        current_chunk = ""
        
        for sentence in sentences:
            # If single sentence is too long, split it further
            if len(sentence) > max_chunk:
                # Split by commas or semicolons
                parts = re.split(r'([,;])\s+', sentence)
                for part in parts:
                    if len(current_chunk) + len(part) < max_chunk:
                        current_chunk += part
                    else:
                        if current_chunk.strip():
                            chunks.append(current_chunk.strip())
                        current_chunk = part
            else:
                # Normal sentence processing
                if len(current_chunk) + len(sentence) + 1 < max_chunk:
                    current_chunk += " " + sentence if current_chunk else sentence
                else:
                    if current_chunk.strip():
                        chunks.append(current_chunk.strip())
                    current_chunk = sentence
        
        # Add remaining chunk
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
        
        # Translate each chunk with retry logic
        translated_chunks = []
        for i, chunk in enumerate(chunks):
            print(f"   Translating chunk {i+1}/{len(chunks)} ({len(chunk)} chars)...")
            
            # Retry up to 3 times
            for attempt in range(3):
                try:
                    translated = translator.translate(chunk)
                    translated_chunks.append(translated)
                    break
                except Exception as e:
                    if attempt < 2:
                        print(f"   ⚠️  Retry {attempt+1}/3...")
                        import time
                        time.sleep(2)  # Wait before retry
                    else:
                        print(f"   ❌ Failed after 3 attempts: {e}")
                        return None
        
        return ' '.join(translated_chunks)
        
    except Exception as e:
        print(f"   ❌ Translation error: {e}")
        return None

def get_english_content(attraction):
    """Get English content for the attraction"""
    en_file = SOURCE_DIR / 'en' / attraction
    if en_file.exists():
        with open(en_file, 'r', encoding='utf-8') as f:
            return f.read()
    return None

def fix_file(lang, attraction_file):
    """Fix a single empty/short file"""
    target_file = SOURCE_DIR / lang / attraction_file
    attraction = attraction_file.split('/')[0]
    
    print(f"\n📝 Fixing: {lang}/{attraction_file}")
    
    # Get English content
    english_content = get_english_content(attraction_file)
    if not english_content:
        print(f"   ❌ No English source found")
        return {
            'file': f"{lang}/{attraction_file}",
            'status': 'FAILED',
            'reason': 'No English source'
        }
    
    print(f"   English content: {len(english_content)} chars")
    
    # Check if file already has content
    current_length = 0
    if target_file.exists():
        with open(target_file, 'r', encoding='utf-8') as f:
            current_length = len(f.read())
    
    print(f"   Current content: {current_length} chars")
    
    # Translate
    print(f"   Translating to {lang}...")
    translated = translate_text(english_content, LANGUAGE_CODES[lang])
    
    if not translated:
        return {
            'file': f"{lang}/{attraction_file}",
            'status': 'FAILED',
            'reason': 'Translation failed'
        }
    
    print(f"   Translated content: {len(translated)} chars")
    
    # Save
    target_file.parent.mkdir(parents=True, exist_ok=True)
    with open(target_file, 'w', encoding='utf-8') as f:
        f.write(translated)
    
    print(f"   ✅ Saved!")
    
    return {
        'file': f"{lang}/{attraction_file}",
        'status': 'SUCCESS',
        'original_length': current_length,
        'english_length': len(english_content),
        'translated_length': len(translated),
        'language': lang
    }

def main():
    print("=" * 80)
    print("🔧 FIXING EMPTY/SHORT FILES - Auto-Translation")
    print("=" * 80)
    print()
    print("This will translate English content to:")
    print("  - Japanese (10 files)")
    print("  - Chinese (10 files)")
    print("  - Korean (5 files)")
    print()
    print("Total: 25 files")
    print()
    print("Using: Google Translate (free)")
    print("Time: ~30-60 minutes")
    print()
    
    # Check if deep-translator is installed
    try:
        from deep_translator import GoogleTranslator
    except ImportError:
        print("❌ ERROR: deep-translator not installed")
        print()
        print("Please install it:")
        print("  pip install deep-translator")
        print()
        return
    
    input("Press Enter to start...")
    print()
    
    results = []
    total = sum(len(files) for files in EMPTY_FILES.values())
    current = 0
    
    for lang, files in EMPTY_FILES.items():
        print(f"\n{'=' * 80}")
        print(f"🌍 Processing {lang.upper()} files ({len(files)} files)")
        print('=' * 80)
        
        for file in files:
            current += 1
            print(f"\n[{current}/{total}] ", end='')
            result = fix_file(lang, file)
            results.append(result)
    
    # Summary
    print()
    print("=" * 80)
    print("📊 SUMMARY")
    print("=" * 80)
    
    success = sum(1 for r in results if r['status'] == 'SUCCESS')
    failed = sum(1 for r in results if r['status'] == 'FAILED')
    
    print(f"Total files processed: {len(results)}")
    print(f"✅ Success: {success}")
    print(f"❌ Failed: {failed}")
    print()
    
    # By language
    for lang in ['ja', 'zh', 'ko']:
        lang_results = [r for r in results if r.get('language') == lang]
        lang_success = sum(1 for r in lang_results if r['status'] == 'SUCCESS')
        print(f"{lang.upper()}: {lang_success}/{len(lang_results)} files fixed")
    
    print()
    
    # Show failures
    if failed > 0:
        print("❌ Failed files:")
        for r in results:
            if r['status'] == 'FAILED':
                print(f"  - {r['file']}: {r.get('reason', 'Unknown')}")
        print()
    
    # Save report
    report = {
        'summary': {
            'total': len(results),
            'success': success,
            'failed': failed
        },
        'details': results
    }
    
    with open(REPORT_FILE, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    print(f"📄 Report saved to: {REPORT_FILE}")
    print()
    print("=" * 80)
    print("✅ COMPLETE!")
    print("=" * 80)
    print()
    print("Next steps:")
    print("  1. Run VERIFY_FIXES.bat again to confirm all files pass")
    print("  2. Check a few translated files manually")
    print("  3. Use the files in your app")
    print()

if __name__ == "__main__":
    main()
