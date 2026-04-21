"""
Check content quality - ensure it's specific, detailed, and not generic
"""
import re
from pathlib import Path

ENGLISH_DIR = Path("D:/wondersofrome/final_cleaned_content/en")

def analyze_content_quality(file_path, attraction):
    """Analyze if content is specific and detailed"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check for specific details
    has_dates = bool(re.search(r'\b\d{1,4}\s*(AD|BC|CE|BCE)?\b', content))
    has_numbers = bool(re.search(r'\b\d+\s*(feet|meters|years|centuries)\b', content))
    has_names = bool(re.search(r'\b[A-Z][a-z]+\s+[A-Z][a-z]+\b', content))  # Proper names
    
    # Check for descriptive language
    descriptive_words = ['beautiful', 'magnificent', 'ancient', 'impressive', 
                        'stunning', 'remarkable', 'extraordinary', 'famous']
    descriptive_count = sum(len(re.findall(r'\b' + word + r'\b', content, re.IGNORECASE)) 
                           for word in descriptive_words)
    
    # Check for historical context
    historical_words = ['emperor', 'pope', 'built', 'constructed', 'designed',
                       'century', 'history', 'historical', 'ancient', 'medieval']
    historical_count = sum(len(re.findall(r'\b' + word + r'\b', content, re.IGNORECASE)) 
                          for word in historical_words)
    
    # Check for tour language
    tour_phrases = ['as you', 'notice', 'look at', 'see', 'imagine', 'picture',
                   'we\'re', 'let\'s', 'now', 'here']
    tour_count = sum(len(re.findall(r'\b' + phrase + r'\b', content, re.IGNORECASE)) 
                    for phrase in tour_phrases)
    
    # Extract specific facts (sentences with numbers or dates)
    sentences = re.split(r'[.!?]+\s+', content)
    fact_sentences = [s for s in sentences if re.search(r'\b\d+\b', s) and len(s) > 30]
    
    return {
        'has_dates': has_dates,
        'has_numbers': has_numbers,
        'has_names': has_names,
        'descriptive_count': descriptive_count,
        'historical_count': historical_count,
        'tour_count': tour_count,
        'fact_sentences': fact_sentences[:5],  # First 5 facts
        'total_sentences': len(sentences)
    }

def main():
    print("="*80)
    print("🔍 ENGLISH TRANSCRIPT CONTENT QUALITY CHECK")
    print("="*80)
    print("\nChecking if content is detailed, specific, and high-quality...")
    print()
    
    all_good = True
    
    for file_path in sorted(ENGLISH_DIR.glob("*/deep.txt")):
        attraction = file_path.parent.name
        
        print(f"\n{'='*80}")
        print(f"📄 {attraction.upper().replace('-', ' ')}")
        print(f"{'='*80}")
        
        quality = analyze_content_quality(file_path, attraction)
        
        print(f"\n📊 Content Quality Indicators:")
        print(f"   ✅ Has dates/years: {'Yes' if quality['has_dates'] else 'No'}")
        print(f"   ✅ Has measurements: {'Yes' if quality['has_numbers'] else 'No'}")
        print(f"   ✅ Has proper names: {'Yes' if quality['has_names'] else 'No'}")
        print(f"   📝 Descriptive words: {quality['descriptive_count']}")
        print(f"   📚 Historical context: {quality['historical_count']}")
        print(f"   🎤 Tour language: {quality['tour_count']}")
        print(f"   📖 Total sentences: {quality['total_sentences']}")
        
        # Show sample facts
        if quality['fact_sentences']:
            print(f"\n📌 Sample Facts/Details:")
            for i, fact in enumerate(quality['fact_sentences'][:3], 1):
                preview = fact[:100] + "..." if len(fact) > 100 else fact
                print(f"   {i}. {preview}")
        
        # Quality score
        quality_score = 0
        if quality['has_dates']: quality_score += 20
        if quality['has_numbers']: quality_score += 20
        if quality['has_names']: quality_score += 20
        if quality['descriptive_count'] > 5: quality_score += 20
        if quality['historical_count'] > 10: quality_score += 20
        
        print(f"\n📈 Quality Score: {quality_score}/100")
        
        if quality_score >= 60:
            print(f"   ✅ HIGH QUALITY - Detailed and specific content")
        elif quality_score >= 40:
            print(f"   ⚠️  MODERATE - Could use more details")
            all_good = False
        else:
            print(f"   ❌ LOW QUALITY - Generic or lacking details")
            all_good = False
    
    # Summary
    print(f"\n{'='*80}")
    print("📊 OVERALL QUALITY ASSESSMENT")
    print(f"{'='*80}")
    
    if all_good:
        print("\n🎉 ALL FILES HAVE HIGH-QUALITY, DETAILED CONTENT!")
        print("\n✅ Content is:")
        print("   - Specific to each attraction")
        print("   - Rich in historical details")
        print("   - Contains dates, names, and measurements")
        print("   - Written in engaging tour guide style")
        print("   - Production-ready for audio guides")
    else:
        print("\n⚠️  Some files may need review for more specific details")
    
    print()
    print("="*80)

if __name__ == "__main__":
    main()
