"""
Fix the 4 remaining short files
"""
import os
import re
import time
from pathlib import Path
from deep_translator import GoogleTranslator

SOURCE_DIR = Path("D:/wondersofrome/final_cleaned_content")

FILES_TO_FIX = [
    ('ja', 'heart/deep.txt'),
    ('ja', 'sistine-chapel/deep.txt'),
    ('zh', 'heart/deep.txt'),
    ('zh', 'sistine-chapel/deep.txt')
]

LANGUAGE_CODES = {
    'ja': 'ja',
    'zh': 'zh-CN'
}

def translate_text(text, target_lang):
    """Translate text to target language"""
    try:
        translator = GoogleTranslator(source='en', target=target_lang)
        return translator.translate(text)
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return None

def fix_file(lang, file_path):
    """Fix a single file"""
    print(f"\n📝 Fixing: {lang}/{file_path}")
    
    # Get English source
    en_file = SOURCE_DIR / 'en' / file_path
    with open(en_file, 'r', encoding='utf-8') as f:
        english = f.read()
    
    print(f"   English: {len(english)} chars")
    
    # Translate
    print(f"   Translating to {lang}...")
    translated = translate_text(english, LANGUAGE_CODES[lang])
    
    if not translated:
        print(f"   ❌ FAILED")
        return False
    
    print(f"   Translated: {len(translated)} chars")
    
    # Save
    target_file = SOURCE_DIR / lang / file_path
    with open(target_file, 'w', encoding='utf-8') as f:
        f.write(translated)
    
    print(f"   ✅ Saved!")
    return True

print("=" * 80)
print("🔧 FIXING 4 REMAINING SHORT FILES")
print("=" * 80)
print()

success = 0
for lang, file_path in FILES_TO_FIX:
    if fix_file(lang, file_path):
        success += 1
    time.sleep(1)  # Rate limiting

print()
print("=" * 80)
print(f"✅ Fixed {success}/{len(FILES_TO_FIX)} files")
print("=" * 80)
