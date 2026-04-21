import os
import re
from pathlib import Path
from collections import Counter

SOURCE_DIR = Path("D:/wondersofrome/cleaned_production_content_v2")

def recheck_transcripts():
    print("=" * 70)
    print("🕵️  FINAL QUALITY AUDIT: TRANSCRIPT INTEGRITY")
    print("=" * 70)
    
    stats = {}
    
    # 1. Gather all character counts to find outliers
    for root, dirs, files in os.walk(SOURCE_DIR):
        for file in files:
            if file.endswith(".txt"):
                path = Path(root) / file
                lang = path.parent.parent.name
                attraction = path.parent.name
                
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                if attraction not in stats:
                    stats[attraction] = {}
                stats[attraction][lang] = len(content)

    # 2. Analyze for missing content (Compare against English size)
    print("\n📉 Checking for Truncated Content (Content Gap Analysis):")
    for attraction, langs in stats.items():
        if 'en' in langs:
            en_size = langs['en']
            for lang, size in langs.items():
                if lang == 'en': continue
                ratio = size / en_size
                if ratio < 0.3: # Less than 30% of English content
                    print(f"  ⚠️  CRITICAL GAP: {attraction} ({lang}) is only {ratio:.1%} of English size.")
                elif ratio < 0.6:
                    print(f"  🟡 MAJOR GAP: {attraction} ({lang}) is only {ratio:.1%} of English size.")

    # 3. Deep check for repetitions and branding leftovers
    print("\n🔍 Checking for Patterns & Leftovers:")
    branding_keywords = ["Rick", "Steve", "Openshaw", "Openshaw", "Francesca", "www.", "http", ".com", "Cedar House"]
    
    for root, dirs, files in os.walk(SOURCE_DIR):
        for file in files:
            path = Path(root) / file
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check for branding
            for kw in branding_keywords:
                if kw.lower() in content.lower():
                    # Check context to see if it's "your guide" replacement or a miss
                    if "your guide" not in content.lower():
                         print(f"  🔴 branding hit: '{kw}' in {path.parent.parent.name}/{path.parent.name}")
            
            # Check for excessive sentence repetition
            sentences = re.split(r'[.!?]+', content)
            sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
            counts = Counter(sentences)
            for s, count in counts.items():
                if count > 2:
                    print(f"  🔄 REPETITION ({count}x): '{s[:50]}...' in {path.parent.parent.name}/{path.parent.name}")

    print("\n" + "=" * 70)
    print("✅ Audit Complete.")

if __name__ == "__main__":
    recheck_transcripts()
