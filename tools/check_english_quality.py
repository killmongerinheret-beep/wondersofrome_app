"""
Check English transcript files for quality issues
"""
import re
from pathlib import Path

ENGLISH_DIR = Path("D:/wondersofrome/final_cleaned_content/en")

def check_repetitions(text, filename):
    """Check for sentence repetitions"""
    sentences = re.split(r'[.!?]+\s+', text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
    
    issues = []
    prev = None
    count = 1
    
    for i, sentence in enumerate(sentences):
        if sentence == prev:
            count += 1
            if count > 2:
                issues.append(f"  ⚠️  REPETITION ({count}x): '{sentence[:60]}...'")
        else:
            if count > 2:
                # Report the issue when the repetition ends
                pass
            prev = sentence
            count = 1
    
    return issues

def check_branding(text, filename):
    """Check for Rick Steves branding"""
    branding_patterns = [
        (r"Rick\s+Steves?", "Rick Steves"),
        (r"ricksteves\.com", "ricksteves.com"),
        (r"www\.ricksteves", "www.ricksteves"),
        (r"Gene\s+Openshaw", "Gene Openshaw"),
        (r"Francesca\s+Caruso", "Francesca Caruso"),
        (r"Cedar\s+House", "Cedar House"),
    ]
    
    issues = []
    for pattern, name in branding_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            # Find context
            for match in matches[:3]:  # Show first 3
                pos = text.lower().find(match.lower())
                context_start = max(0, pos - 50)
                context_end = min(len(text), pos + len(match) + 50)
                context = text[context_start:context_end]
                issues.append(f"  ❌ BRANDING: '{name}' found")
                issues.append(f"     Context: ...{context}...")
    
    return issues

def check_file(file_path):
    """Check a single file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    attraction = file_path.parent.name
    
    print(f"\n{'='*80}")
    print(f"📄 {attraction.upper()}")
    print(f"{'='*80}")
    print(f"Length: {len(content):,} chars")
    print(f"Words: {len(content.split()):,}")
    
    # Check for issues
    repetition_issues = check_repetitions(content, attraction)
    branding_issues = check_branding(content, attraction)
    
    if not repetition_issues and not branding_issues:
        print("✅ CLEAN - No issues found")
    else:
        if repetition_issues:
            print("\n⚠️  REPETITION ISSUES:")
            for issue in repetition_issues[:5]:  # Show first 5
                print(issue)
            if len(repetition_issues) > 5:
                print(f"  ... and {len(repetition_issues) - 5} more")
        
        if branding_issues:
            print("\n❌ BRANDING ISSUES:")
            for issue in branding_issues:
                print(issue)
    
    # Show first few sentences
    sentences = re.split(r'[.!?]+\s+', content)
    print(f"\n📝 First 3 sentences:")
    for i, sent in enumerate(sentences[:3]):
        if sent.strip():
            preview = sent.strip()[:100]
            print(f"  {i+1}. {preview}{'...' if len(sent) > 100 else ''}")
    
    return {
        'file': attraction,
        'length': len(content),
        'repetitions': len(repetition_issues),
        'branding': len(branding_issues),
        'clean': len(repetition_issues) == 0 and len(branding_issues) == 0
    }

def main():
    print("="*80)
    print("🔍 ENGLISH TRANSCRIPT QUALITY CHECK")
    print("="*80)
    
    results = []
    
    for file_path in sorted(ENGLISH_DIR.glob("*/deep.txt")):
        result = check_file(file_path)
        results.append(result)
    
    # Summary
    print(f"\n{'='*80}")
    print("📊 SUMMARY")
    print(f"{'='*80}")
    
    total = len(results)
    clean = sum(1 for r in results if r['clean'])
    with_repetitions = sum(1 for r in results if r['repetitions'] > 0)
    with_branding = sum(1 for r in results if r['branding'] > 0)
    
    print(f"Total files: {total}")
    print(f"✅ Clean files: {clean}")
    print(f"⚠️  Files with repetitions: {with_repetitions}")
    print(f"❌ Files with branding: {with_branding}")
    print()
    
    if clean == total:
        print("🎉 ALL ENGLISH FILES ARE CLEAN!")
    else:
        print("⚠️  Some files need attention:")
        for r in results:
            if not r['clean']:
                issues = []
                if r['repetitions'] > 0:
                    issues.append(f"{r['repetitions']} repetitions")
                if r['branding'] > 0:
                    issues.append(f"{r['branding']} branding")
                print(f"  - {r['file']}: {', '.join(issues)}")
    
    print()
    print("="*80)

if __name__ == "__main__":
    main()
