"""
Check if all English files have consistent tour guide format
"""
import re
from pathlib import Path

ENGLISH_DIR = Path("D:/wondersofrome/final_cleaned_content/en")

def analyze_format(file_path, attraction):
    """Check if file is in proper tour guide format"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Get first 1000 chars for analysis
    intro = content[:1000]
    
    # Check for meta-description indicators (BAD)
    meta_indicators = [
        r'This is a comprehensive',
        r'This is an audiobook-style',
        r'Here\'s a breakdown',
        r'Here are some key points',
        r'\*\*Stop \d+:',  # **Stop 1:**
        r'The tour begins',
        r'The tour covers',
        r'The guide explains',
        r'The guide shares',
        r'led by (your guide|Rick Steves)',
    ]
    
    meta_score = sum(1 for pattern in meta_indicators if re.search(pattern, intro, re.IGNORECASE))
    
    # Check for proper tour guide format (GOOD)
    tour_indicators = [
        r'\bI am your guide\b',
        r'\bI\'m your guide\b',
        r'\bWelcome to\b',
        r'\bHi,? I am\b',
        r'\bThanks for joining me\b',
        r'\bLet\'s\b',
        r'\bAs you (see|look|walk|enter)\b',
        r'\bNotice\b',
        r'\bImagine\b',
        r'\bPicture\b',
    ]
    
    tour_score = sum(1 for pattern in tour_indicators if re.search(pattern, intro, re.IGNORECASE))
    
    # Determine format type
    if meta_score >= 3:
        format_type = "META-DESCRIPTION (Summary)"
        is_proper = False
    elif tour_score >= 2:
        format_type = "TOUR GUIDE (First-person)"
        is_proper = True
    else:
        format_type = "UNCLEAR"
        is_proper = False
    
    return {
        'format_type': format_type,
        'is_proper': is_proper,
        'meta_score': meta_score,
        'tour_score': tour_score,
        'intro': intro
    }

def main():
    print("="*80)
    print("🔍 FORMAT CONSISTENCY CHECK")
    print("="*80)
    print("\nChecking if all files use proper first-person tour guide format...")
    print()
    
    results = []
    
    for file_path in sorted(ENGLISH_DIR.glob("*/deep.txt")):
        attraction = file_path.parent.name
        
        analysis = analyze_format(file_path, attraction)
        
        status = "✅" if analysis['is_proper'] else "❌"
        print(f"{status} {attraction:20} {analysis['format_type']}")
        
        if not analysis['is_proper']:
            print(f"   Meta indicators: {analysis['meta_score']}, Tour indicators: {analysis['tour_score']}")
            print(f"   First 200 chars: {analysis['intro'][:200]}...")
            print()
        
        results.append({
            'attraction': attraction,
            'format': analysis['format_type'],
            'is_proper': analysis['is_proper']
        })
    
    # Summary
    print()
    print("="*80)
    print("📊 FORMAT SUMMARY")
    print("="*80)
    
    proper_count = sum(1 for r in results if r['is_proper'])
    improper_count = len(results) - proper_count
    
    print(f"\nTotal files: {len(results)}")
    print(f"✅ Proper tour guide format: {proper_count}")
    print(f"❌ Meta-description format: {improper_count}")
    print()
    
    if improper_count > 0:
        print("❌ Files with WRONG format (meta-descriptions):")
        for r in results:
            if not r['is_proper']:
                print(f"   - {r['attraction']}: {r['format']}")
        print()
        print("These files are summaries ABOUT the tours, not actual tour transcripts!")
    else:
        print("🎉 ALL FILES USE PROPER TOUR GUIDE FORMAT!")
    
    print()
    print("="*80)

if __name__ == "__main__":
    main()
