"""
Detailed check of English transcripts with content samples
"""
import re
from pathlib import Path

ENGLISH_DIR = Path("D:/wondersofrome/final_cleaned_content/en")

def analyze_file(file_path):
    """Detailed analysis of a file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    attraction = file_path.parent.name
    
    # Split into sentences
    sentences = re.split(r'[.!?]+\s+', content)
    sentences = [s.strip() for s in sentences if s.strip()]
    
    # Check for consecutive duplicates
    consecutive_dups = []
    for i in range(len(sentences) - 1):
        if sentences[i] == sentences[i+1] and len(sentences[i]) > 20:
            consecutive_dups.append(sentences[i][:60])
    
    # Check for any Rick Steves mentions
    rick_mentions = len(re.findall(r'\brick\b|\bsteves?\b', content, re.IGNORECASE))
    
    print(f"\n{'='*80}")
    print(f"📄 {attraction.upper().replace('-', ' ')}")
    print(f"{'='*80}")
    print(f"📊 Stats:")
    print(f"   Length: {len(content):,} chars")
    print(f"   Words: {len(content.split()):,}")
    print(f"   Sentences: {len(sentences):,}")
    print(f"   Avg sentence length: {len(content) // len(sentences) if sentences else 0} chars")
    
    print(f"\n✅ Quality Checks:")
    print(f"   Consecutive duplicates: {len(consecutive_dups)}")
    print(f"   'Rick/Steves' mentions: {rick_mentions}")
    
    if consecutive_dups:
        print(f"\n⚠️  Found {len(consecutive_dups)} consecutive duplicate(s):")
        for dup in consecutive_dups[:3]:
            print(f"   - '{dup}...'")
    
    # Show beginning, middle, and end
    print(f"\n📖 Content Sample:")
    print(f"\n   BEGINNING (first 300 chars):")
    print(f"   {content[:300]}...")
    
    mid_point = len(content) // 2
    print(f"\n   MIDDLE (around char {mid_point:,}):")
    print(f"   ...{content[mid_point-150:mid_point+150]}...")
    
    print(f"\n   END (last 300 chars):")
    print(f"   ...{content[-300:]}")
    
    return {
        'file': attraction,
        'length': len(content),
        'sentences': len(sentences),
        'duplicates': len(consecutive_dups),
        'rick_mentions': rick_mentions
    }

def main():
    print("="*80)
    print("🔍 DETAILED ENGLISH TRANSCRIPT CHECK")
    print("="*80)
    print("\nThis will show you samples from each file to verify quality.")
    print()
    
    results = []
    
    for file_path in sorted(ENGLISH_DIR.glob("*/deep.txt")):
        result = analyze_file(file_path)
        results.append(result)
    
    # Final summary
    print(f"\n{'='*80}")
    print("📊 FINAL SUMMARY")
    print(f"{'='*80}")
    
    total_chars = sum(r['length'] for r in results)
    total_sentences = sum(r['sentences'] for r in results)
    total_duplicates = sum(r['duplicates'] for r in results)
    total_rick = sum(r['rick_mentions'] for r in results)
    
    print(f"\n📈 Overall Statistics:")
    print(f"   Total files: {len(results)}")
    print(f"   Total characters: {total_chars:,}")
    print(f"   Total sentences: {total_sentences:,}")
    print(f"   Average file length: {total_chars // len(results):,} chars")
    
    print(f"\n✅ Quality Metrics:")
    print(f"   Consecutive duplicates: {total_duplicates}")
    print(f"   Rick/Steves mentions: {total_rick}")
    
    print(f"\n📋 File Sizes:")
    for r in sorted(results, key=lambda x: x['length'], reverse=True):
        print(f"   {r['file']:20} {r['length']:6,} chars  {r['sentences']:4} sentences")
    
    if total_duplicates == 0 and total_rick == 0:
        print(f"\n{'='*80}")
        print("🎉 PERFECT! All English files are clean and ready!")
        print(f"{'='*80}")
        print("\n✅ No repetitions found")
        print("✅ No branding found")
        print("✅ All content looks good")
    else:
        print(f"\n⚠️  Issues found:")
        if total_duplicates > 0:
            print(f"   - {total_duplicates} consecutive duplicates")
        if total_rick > 0:
            print(f"   - {total_rick} Rick/Steves mentions")

if __name__ == "__main__":
    main()
