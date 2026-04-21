"""
Comprehensive Fix Script for All Translation Issues
Fixes: Repetitions, Branding, Content Gaps
"""
import os
import re
from pathlib import Path
from collections import Counter
import json

# Directories
SOURCE_DIR = Path("D:/wondersofrome/cleaned_production_content_v2")
OUTPUT_DIR = Path("D:/wondersofrome/final_cleaned_content")
REPORT_FILE = Path("D:/wondersofrome/fix_report.json")

# Multilingual branding patterns (comprehensive)
BRANDING_PATTERNS = [
    # English
    (r"Hey,?\s*I'?m\s+Rick\s+Steves\.?", "Welcome to your guided audio tour."),
    (r"I'?m\s+Rick\s+Steves\.?", "I am your guide."),
    (r"Hello,?\s*I'?m\s+Rick\s+Steves\.?", "Hello, welcome to this tour."),
    (r"Rick\s+Steves\s+here\.?", ""),
    (r"Rick\s+Steves", "your guide"),
    (r"Rick", "your guide"),
    
    # URLs and websites
    (r"ricksteves\.com", "wondersofrome.com"),
    (r"www\.ricksteves\.com", "wondersofrome.com"),
    (r"https?://ricksteves\.com\S*", "wondersofrome.com"),
    
    # Credits and production
    (r"This tour was excerpted from the Rick Steves.*?Guidebook.*?\.?", "Thank you for joining this tour."),
    (r"This tour was produced by Cedar House Audio Productions\.?", ""),
    (r"Cedar House Audio Productions", ""),
    (r"Gene\s+Openshaw", ""),
    (r"Francesca\s+Caruso", ""),
    (r"Thanks to Gene Openshaw.*?\.?", ""),
    (r"Thanks to Lisa.*?\.?", ""),
    
    # Outros
    (r"For more free audio tours.*?ricksteves\.com.*?\.?", ""),
    (r"Visit our website at ricksteves\.com\.?", ""),
    (r"Remember,?\s*this tour was.*?Rick Steves.*?\.?", ""),
    
    # Context replacements
    (r"while Rick sets the scene", "as we set the scene"),
    (r"Rick explains", "your guide explains"),
    (r"Rick describes", "your guide describes"),
    
    # Non-English patterns (detected from audit)
    (r"ريك\s+ستيفز", "مرشدك"),  # Arabic
    (r"里克·史蒂夫斯", "你的导游"),  # Chinese
    (r"リック・スティーブス", "あなたのガイド"),  # Japanese
    (r"Рик\s+Стивс", "ваш гид"),  # Russian
    (r"릭\s+스티브스", "가이드"),  # Korean
]

def remove_repetitions(text, max_repeat=2):
    """
    Remove consecutive repeated sentences/phrases
    Keeps only max_repeat occurrences
    """
    # Split into sentences
    sentences = re.split(r'([.!?]+\s*)', text)
    
    # Reconstruct with punctuation
    parts = []
    for i in range(0, len(sentences)-1, 2):
        if i+1 < len(sentences):
            parts.append(sentences[i] + sentences[i+1])
        else:
            parts.append(sentences[i])
    
    # Remove consecutive duplicates
    cleaned = []
    prev = None
    count = 0
    
    for sentence in parts:
        sentence_clean = sentence.strip()
        if len(sentence_clean) < 10:  # Skip very short fragments
            cleaned.append(sentence)
            continue
            
        if sentence_clean == prev:
            count += 1
            if count < max_repeat:
                cleaned.append(sentence)
        else:
            cleaned.append(sentence)
            prev = sentence_clean
            count = 0
    
    return ' '.join(cleaned)

def remove_branding(text):
    """Remove all branding patterns"""
    for pattern, replacement in BRANDING_PATTERNS:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    
    # Clean up artifacts
    text = re.sub(r'your guide\.com', 'wondersofrome.com', text)
    text = re.sub(r'\s+', ' ', text)  # Multiple spaces
    text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)  # Multiple newlines
    text = re.sub(r'^\s+|\s+$', '', text, flags=re.MULTILINE)  # Trim lines
    
    return text.strip()

def analyze_content_gap(text, expected_min_length=5000):
    """Check if content is suspiciously short"""
    return len(text) < expected_min_length

def process_file(file_path, rel_path):
    """Process a single file"""
    issues = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            original = f.read()
        
        original_length = len(original)
        
        # Step 1: Remove repetitions
        after_dedup = remove_repetitions(original, max_repeat=2)
        repetitions_removed = original_length - len(after_dedup)
        
        # Step 2: Remove branding
        after_branding = remove_branding(after_dedup)
        branding_removed = len(after_dedup) - len(after_branding)
        
        # Step 3: Check for content gaps
        is_short = analyze_content_gap(after_branding)
        
        # Record issues
        if repetitions_removed > 100:
            issues.append(f"Removed {repetitions_removed} chars of repetitions")
        if branding_removed > 10:
            issues.append(f"Removed {branding_removed} chars of branding")
        if is_short:
            issues.append(f"WARNING: Content is short ({len(after_branding)} chars)")
        
        # Save cleaned version
        out_path = OUTPUT_DIR / rel_path
        out_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(after_branding)
        
        return {
            'file': str(rel_path),
            'original_length': original_length,
            'final_length': len(after_branding),
            'repetitions_removed': repetitions_removed,
            'branding_removed': branding_removed,
            'is_short': is_short,
            'issues': issues
        }
        
    except Exception as e:
        return {
            'file': str(rel_path),
            'error': str(e)
        }

def main():
    print("=" * 80)
    print("🔧 COMPREHENSIVE FIX: Repetitions + Branding + Content Analysis")
    print("=" * 80)
    print()
    
    if not SOURCE_DIR.exists():
        print(f"❌ Source directory not found: {SOURCE_DIR}")
        return
    
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    results = []
    processed = 0
    
    # Process all files
    for root, dirs, files in os.walk(SOURCE_DIR):
        for file in files:
            if file.endswith('.txt'):
                file_path = Path(root) / file
                rel_path = file_path.relative_to(SOURCE_DIR)
                
                print(f"Processing: {rel_path}")
                result = process_file(file_path, rel_path)
                results.append(result)
                processed += 1
    
    # Generate report
    print()
    print("=" * 80)
    print("📊 SUMMARY REPORT")
    print("=" * 80)
    print(f"Total files processed: {processed}")
    print()
    
    # Count issues
    files_with_repetitions = sum(1 for r in results if r.get('repetitions_removed', 0) > 100)
    files_with_branding = sum(1 for r in results if r.get('branding_removed', 0) > 10)
    files_short = sum(1 for r in results if r.get('is_short', False))
    files_with_errors = sum(1 for r in results if 'error' in r)
    
    print(f"✅ Files with repetitions fixed: {files_with_repetitions}")
    print(f"✅ Files with branding removed: {files_with_branding}")
    print(f"⚠️  Files with content gaps: {files_short}")
    print(f"❌ Files with errors: {files_with_errors}")
    print()
    
    # Show problematic files
    if files_short > 0:
        print("📉 SHORT CONTENT FILES (may need re-translation):")
        for r in results:
            if r.get('is_short', False):
                print(f"  - {r['file']} ({r['final_length']} chars)")
        print()
    
    # Save detailed report
    with open(REPORT_FILE, 'w', encoding='utf-8') as f:
        json.dump({
            'summary': {
                'total_files': processed,
                'files_with_repetitions': files_with_repetitions,
                'files_with_branding': files_with_branding,
                'files_short': files_short,
                'files_with_errors': files_with_errors
            },
            'details': results
        }, f, indent=2, ensure_ascii=False)
    
    print(f"📄 Detailed report saved to: {REPORT_FILE}")
    print(f"✨ Cleaned files saved to: {OUTPUT_DIR}")
    print()
    print("=" * 80)
    print("✅ COMPLETE!")
    print("=" * 80)

if __name__ == "__main__":
    main()
