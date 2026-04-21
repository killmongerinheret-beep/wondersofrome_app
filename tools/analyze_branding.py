import os
import re
from pathlib import Path

# Paths to analyze
PATHS = [
    Path("D:/wondersofrome/tts_scripts-20260415T211514Z-3-001/tts_scripts"),
    Path("D:/wondersofrome/completed_translations"),
    Path("D:/wondersofrome/cleaned_content"),
    Path("C:/wondersofrome_app/wondersofrome_app/src/data/sights.json")
]

BRANDING_PATTERNS = [
    r"Rick\s+Steves?",
    r"RickSteve",
    r"Rick\s+Steve",
    r"Steves?\s+Rick",
]

def analyze_branding():
    print("=" * 60)
    print("DEEP ANALYSIS: RICK STEVES BRANDING REMOVAL")
    print("=" * 60)
    
    findings = []
    
    for path in PATHS:
        if not path.exists():
            print(f"⚠️  Path not found: {path}")
            continue
            
        print(f"🔍 Analyzing: {path}")
        
        if path.is_file():
            check_file(path, findings)
        else:
            for root, dirs, files in os.walk(path):
                for file in files:
                    if file.endswith(('.txt', '.json', '.js')):
                        file_path = Path(root) / file
                        check_file(file_path, findings)

    if not findings:
        print("\n✅ No branding found.")
    else:
        print(f"\n🔴 Found {len(findings)} branding instances.")
        for f in findings[:20]: # Show first 20
            print(f"- {f['file']} (Line {f['line']}): {f['text'].strip()}")
        if len(findings) > 20:
            print(f"... and {len(findings) - 20} more.")

def check_file(file_path, findings):
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
            for i, line in enumerate(lines):
                for pattern in BRANDING_PATTERNS:
                    if re.search(pattern, line, re.IGNORECASE):
                        findings.append({
                            'file': str(file_path),
                            'line': i + 1,
                            'text': line
                        })
                        break
    except Exception as e:
        print(f"❌ Error reading {file_path}: {e}")

if __name__ == "__main__":
    analyze_branding()
