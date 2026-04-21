"""
Check if English transcript content is relevant to the attraction name
"""
import re
from pathlib import Path

ENGLISH_DIR = Path("D:/wondersofrome/final_cleaned_content/en")

# Expected keywords for each attraction
RELEVANCE_KEYWORDS = {
    'colosseum': [
        'colosseum', 'coliseum', 'gladiator', 'arena', 'amphitheater', 
        'flavian', 'vespasian', 'titus', 'combat', 'spectacle'
    ],
    'forum': [
        'forum', 'senate', 'capitol', 'temple', 'arch', 'basilica',
        'roman', 'republic', 'empire', 'political'
    ],
    'heart': [
        'piazza', 'navona', 'trevi', 'fountain', 'spanish steps',
        'walking', 'tour', 'rome', 'center', 'historic'
    ],
    'jewish-ghetto': [
        'jewish', 'ghetto', 'synagogue', 'hebrew', 'persecution',
        'community', 'tiberina', 'portico', 'octavia'
    ],
    'ostia-antica': [
        'ostia', 'antica', 'port', 'harbor', 'tiber', 'ancient',
        'ruins', 'pompeii', 'excavation', 'commercial'
    ],
    'pantheon': [
        'pantheon', 'dome', 'oculus', 'hadrian', 'agrippa',
        'rotunda', 'concrete', 'temple', 'gods'
    ],
    'sistine-chapel': [
        'sistine', 'chapel', 'michelangelo', 'ceiling', 'creation',
        'adam', 'judgment', 'fresco', 'vatican', 'sixtus'
    ],
    'st-peters-basilica': [
        'peter', 'basilica', 'vatican', 'dome', 'michelangelo',
        'bernini', 'pieta', 'baldacchino', 'pope', 'church'
    ],
    'trastevere': [
        'trastevere', 'tiber', 'river', 'neighborhood', 'santa maria',
        'cecilia', 'gianicolo', 'across', 'district'
    ],
    'vatican-museums': [
        'vatican', 'museum', 'raphael', 'gallery', 'sculpture',
        'laocoon', 'apollo', 'belvedere', 'tapestries', 'maps'
    ],
    'vatican-pinacoteca': [
        'pinacoteca', 'painting', 'gallery', 'caravaggio', 'raphael',
        'giotto', 'leonardo', 'art', 'canvas', 'masterpiece'
    ]
}

def check_relevance(file_path, attraction):
    """Check if file content is relevant to the attraction"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read().lower()
    
    keywords = RELEVANCE_KEYWORDS.get(attraction, [])
    
    # Count keyword matches
    matches = {}
    for keyword in keywords:
        count = len(re.findall(r'\b' + re.escape(keyword) + r'\b', content, re.IGNORECASE))
        if count > 0:
            matches[keyword] = count
    
    # Calculate relevance score
    relevance_score = len(matches) / len(keywords) * 100 if keywords else 0
    
    return {
        'matches': matches,
        'total_keywords': len(keywords),
        'matched_keywords': len(matches),
        'relevance_score': relevance_score,
        'content_length': len(content)
    }

def extract_key_topics(content):
    """Extract main topics from content"""
    # Get first 500 chars
    intro = content[:500]
    
    # Get some middle content
    mid = len(content) // 2
    middle = content[mid:mid+300]
    
    # Get last 300 chars
    ending = content[-300:]
    
    return {
        'intro': intro,
        'middle': middle,
        'ending': ending
    }

def main():
    print("="*80)
    print("🔍 ENGLISH TRANSCRIPT RELEVANCE CHECK")
    print("="*80)
    print("\nChecking if each file's content matches its attraction name...")
    print()
    
    results = []
    
    for file_path in sorted(ENGLISH_DIR.glob("*/deep.txt")):
        attraction = file_path.parent.name
        
        print(f"\n{'='*80}")
        print(f"📄 {attraction.upper().replace('-', ' ')}")
        print(f"{'='*80}")
        
        # Check relevance
        relevance = check_relevance(file_path, attraction)
        
        print(f"\n📊 Relevance Analysis:")
        print(f"   Content length: {relevance['content_length']:,} chars")
        print(f"   Keywords matched: {relevance['matched_keywords']}/{relevance['total_keywords']}")
        print(f"   Relevance score: {relevance['relevance_score']:.1f}%")
        
        if relevance['matches']:
            print(f"\n✅ Found relevant keywords:")
            for keyword, count in sorted(relevance['matches'].items(), key=lambda x: x[1], reverse=True)[:10]:
                print(f"   - '{keyword}': {count} times")
        else:
            print(f"\n❌ WARNING: No relevant keywords found!")
        
        # Read content for topic extraction
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        topics = extract_key_topics(content)
        
        print(f"\n📖 Content Preview:")
        print(f"\n   INTRO (first 200 chars):")
        print(f"   {topics['intro'][:200]}...")
        
        # Determine if relevant
        is_relevant = relevance['relevance_score'] >= 30  # At least 30% keywords matched
        
        if is_relevant:
            print(f"\n✅ RELEVANT - Content matches attraction")
        else:
            print(f"\n⚠️  QUESTIONABLE - Low relevance score")
            print(f"   Expected keywords: {', '.join(RELEVANCE_KEYWORDS.get(attraction, [])[:5])}...")
        
        results.append({
            'attraction': attraction,
            'relevant': is_relevant,
            'score': relevance['relevance_score'],
            'matches': relevance['matched_keywords']
        })
    
    # Summary
    print(f"\n{'='*80}")
    print("📊 RELEVANCE SUMMARY")
    print(f"{'='*80}")
    
    relevant_count = sum(1 for r in results if r['relevant'])
    questionable_count = len(results) - relevant_count
    
    print(f"\nTotal files: {len(results)}")
    print(f"✅ Relevant: {relevant_count}")
    print(f"⚠️  Questionable: {questionable_count}")
    print()
    
    # Show scores
    print("Relevance Scores:")
    for r in sorted(results, key=lambda x: x['score'], reverse=True):
        status = "✅" if r['relevant'] else "⚠️ "
        print(f"   {status} {r['attraction']:20} {r['score']:5.1f}% ({r['matches']} keywords)")
    
    print()
    
    if questionable_count > 0:
        print("⚠️  Files with low relevance:")
        for r in results:
            if not r['relevant']:
                print(f"   - {r['attraction']}: {r['score']:.1f}%")
        print()
        print("These files may need manual review to ensure content is correct.")
    else:
        print("🎉 ALL FILES ARE RELEVANT TO THEIR ATTRACTIONS!")
    
    print()
    print("="*80)

if __name__ == "__main__":
    main()
