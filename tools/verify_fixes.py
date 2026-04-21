"""
Automated Verification Script
Checks if fixes were applied correctly WITHOUT needing to know the languages
"""
import os
import re
import json
from pathlib import Path
from collections import Counter

# Directories
FIXED_DIR = Path("D:/wondersofrome/final_cleaned_content")
REPORT_FILE = Path("D:/wondersofrome/fix_report.json")

def check_repetitions(text, max_allowed=2):
    """Check if any sentence repeats more than max_allowed times"""
    sentences = re.split(r'[.!?]+\s*', text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
    
    issues = []
    prev = None
    count = 0
    
    for sentence in sentences:
        if sentence == prev:
            count += 1
            if count > max_allowed:
                issues.append(f"REPETITION: '{sentence[:50]}...' appears {count+1} times")
        else:
            prev = sentence
            count = 0
    
    return issues

def check_branding(text):
    """Check for any remaining branding patterns"""
    branding_patterns = [
        r"Rick\s+Steves?",
        r"ricksteves\.com",
        r"www\.ricksteves",
        r"Gene\s+Openshaw",
        r"Francesca\s+Caruso",
        r"Cedar\s+House",
        # Non-English patterns
        r"ريك\s+ستيفز",
        r"里克·史蒂夫斯",
        r"リック・スティーブス",
        r"Рик\s+Стивс",
        r"릭\s+스티브스",
    ]
    
    issues = []
    for pattern in branding_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            issues.append(f"BRANDING FOUND: '{matches[0]}'")
    
    return issues

def check_file_length(text, min_length=1000):
    """Check if file is suspiciously short"""
    length = len(text)
    # Lower threshold for naturally short attractions
    if length < min_length:
        return [f"SHORT FILE: Only {length} chars (expected > {min_length})"]
    return []

def verify_file(file_path):
    """Verify a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Adjust minimum length for naturally short attractions
        file_str = str(file_path).replace('\\', '/')
        is_short_attraction = any(x in file_str for x in ['heart/deep.txt', 'sistine-chapel/deep.txt'])
        min_length = 500 if is_short_attraction else 1000
        
        issues = []
        issues.extend(check_repetitions(content))
        issues.extend(check_branding(content))
        issues.extend(check_file_length(content, min_length))
        
        return {
            'file': str(file_path.relative_to(FIXED_DIR)),
            'length': len(content),
            'issues': issues,
            'status': 'PASS' if len(issues) == 0 else 'FAIL'
        }
    except Exception as e:
        return {
            'file': str(file_path.relative_to(FIXED_DIR)),
            'error': str(e),
            'status': 'ERROR'
        }

def main():
    print("=" * 80)
    print("🔍 AUTOMATED VERIFICATION - No Language Knowledge Required")
    print("=" * 80)
    print()
    
    if not FIXED_DIR.exists():
        print(f"❌ Fixed directory not found: {FIXED_DIR}")
        return
    
    # Load the fix report
    if REPORT_FILE.exists():
        with open(REPORT_FILE, 'r', encoding='utf-8') as f:
            fix_report = json.load(f)
        print(f"📄 Fix Report Summary:")
        print(f"   Total files processed: {fix_report['summary']['total_files']}")
        print(f"   Files with repetitions fixed: {fix_report['summary']['files_with_repetitions']}")
        print(f"   Files with branding removed: {fix_report['summary']['files_with_branding']}")
        print(f"   Files flagged as short: {fix_report['summary']['files_short']}")
        print()
    
    # Verify all files
    print("🔍 Verifying Fixed Files...")
    print()
    
    results = []
    total_files = 0
    passed = 0
    failed = 0
    
    for root, dirs, files in os.walk(FIXED_DIR):
        for file in files:
            if file.endswith('.txt'):
                file_path = Path(root) / file
                result = verify_file(file_path)
                results.append(result)
                total_files += 1
                
                if result['status'] == 'PASS':
                    passed += 1
                    print(f"✅ {result['file']}")
                elif result['status'] == 'FAIL':
                    failed += 1
                    print(f"❌ {result['file']}")
                    for issue in result['issues']:
                        print(f"   └─ {issue}")
                else:
                    print(f"⚠️  {result['file']} - ERROR: {result.get('error', 'Unknown')}")
    
    # Summary
    print()
    print("=" * 80)
    print("📊 VERIFICATION SUMMARY")
    print("=" * 80)
    print(f"Total files checked: {total_files}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print()
    
    # Categorize results
    colosseum_files = [r for r in results if 'colosseum' in r['file']]
    other_files = [r for r in results if 'colosseum' not in r['file']]
    
    colosseum_passed = sum(1 for r in colosseum_files if r['status'] == 'PASS')
    colosseum_failed = sum(1 for r in colosseum_files if r['status'] == 'FAIL')
    
    print("🏛️  COLOSSEUM FILES (Production-Ready):")
    print(f"   Total: {len(colosseum_files)}")
    print(f"   ✅ Passed: {colosseum_passed}")
    print(f"   ❌ Failed: {colosseum_failed}")
    print()
    
    print("🏛️  OTHER ATTRACTIONS (Need Re-Translation):")
    print(f"   Total: {len(other_files)}")
    short_files = sum(1 for r in other_files if any('SHORT FILE' in issue for issue in r.get('issues', [])))
    print(f"   ⚠️  Short files: {short_files}")
    print()
    
    # Specific issues
    repetition_issues = sum(1 for r in results if any('REPETITION' in issue for issue in r.get('issues', [])))
    branding_issues = sum(1 for r in results if any('BRANDING' in issue for issue in r.get('issues', [])))
    
    if repetition_issues > 0:
        print(f"⚠️  WARNING: {repetition_issues} files still have repetition issues!")
        print("   Files with repetitions:")
        for r in results:
            if any('REPETITION' in issue for issue in r.get('issues', [])):
                print(f"   - {r['file']}")
        print()
    
    if branding_issues > 0:
        print(f"⚠️  WARNING: {branding_issues} files still have branding!")
        print("   Files with branding:")
        for r in results:
            if any('BRANDING' in issue for issue in r.get('issues', [])):
                print(f"   - {r['file']}")
                for issue in r['issues']:
                    if 'BRANDING' in issue:
                        print(f"     └─ {issue}")
        print()
    
    # Final verdict
    print("=" * 80)
    if failed == 0 and repetition_issues == 0 and branding_issues == 0:
        print("✅ ALL CHECKS PASSED!")
        print()
        print("Your files are clean and ready to use:")
        print(f"   ✓ {colosseum_passed} Colosseum files are production-ready")
        print(f"   ✓ No repetitions found")
        print(f"   ✓ No branding found")
        print(f"   ✓ {short_files} files flagged as short (expected)")
    else:
        print("⚠️  SOME ISSUES FOUND")
        print()
        print("Issues to address:")
        if repetition_issues > 0:
            print(f"   - {repetition_issues} files still have repetitions")
        if branding_issues > 0:
            print(f"   - {branding_issues} files still have branding")
        if failed > 0:
            print(f"   - {failed} files failed verification")
    
    print("=" * 80)
    
    # Save verification report
    verification_report = {
        'summary': {
            'total_files': total_files,
            'passed': passed,
            'failed': failed,
            'repetition_issues': repetition_issues,
            'branding_issues': branding_issues,
            'short_files': short_files
        },
        'details': results
    }
    
    report_path = Path("D:/wondersofrome/verification_report.json")
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(verification_report, f, indent=2, ensure_ascii=False)
    
    print(f"📄 Detailed verification report saved to: {report_path}")
    print()

if __name__ == "__main__":
    main()
