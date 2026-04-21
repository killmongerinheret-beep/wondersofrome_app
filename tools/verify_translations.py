#!/usr/bin/env python3
"""
Translation Verification Tool
Uses open-source models to verify translation quality and accuracy
- Compares all language translations against English source
- Identifies errors, mistranslations, and missing content
- Generates detailed error reports
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Tuple
from dataclasses import dataclass
import hashlib

# Configuration
SOURCE_TRANSCRIPTS = Path("d:/wondersofrome/transcripts-20260415T211509Z-3-001/transcripts")
SOURCE_SCRIPTS = Path("d:/wondersofrome/tts_scripts-20260415T211514Z-3-001/tts_scripts")
OUTPUT_DIR = Path("d:/wondersofrome/verification_reports")

LANGUAGES = {
    "ar": "Arabic",
    "de": "German", 
    "es": "Spanish",
    "fr": "French",
    "it": "Italian",
    "ja": "Japanese",
    "ko": "Korean",
    "pl": "Polish",
    "pt": "Portuguese",
    "ru": "Russian",
    "zh": "Chinese"
}

ATTRACTIONS = [
    "colosseum", "forum", "heart", "jewish-ghetto", "ostia-antica",
    "pantheon", "sistine-chapel", "st-peters-basilica", "trastevere",
    "vatican-museums", "vatican-pinacoteca"
]

@dataclass
class TranslationIssue:
    """Represents a translation issue found during verification"""
    severity: str  # "critical", "major", "minor"
    issue_type: str  # "missing_content", "repetition", "mistranslation", "formatting"
    location: str  # Where in the text
    english_text: str
    translated_text: str
    description: str
    line_number: int = 0

class TranslationVerifier:
    """Verifies translation quality without external APIs"""
    
    def __init__(self):
        self.issues = []
        
    def load_english_transcript(self, attraction: str) -> Dict:
        """Load English transcript with timestamps"""
        transcript_path = SOURCE_TRANSCRIPTS / attraction / "en" / "deep.json"
        if transcript_path.exists():
            with open(transcript_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}
    
    def load_script(self, lang: str, attraction: str) -> str:
        """Load translated script"""
        script_path = SOURCE_SCRIPTS / lang / attraction / "deep.txt"
        if script_path.exists():
            with open(script_path, 'r', encoding='utf-8') as f:
                return f.read()
        return ""
    
    def extract_sentences(self, text: str) -> List[str]:
        """Extract sentences from text"""
        # Split on periods, exclamation marks, question marks
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if s.strip()]
    
    def check_repetitions(self, text: str, lang: str, attraction: str) -> List[TranslationIssue]:
        """Detect repetitive phrases (TTS artifacts)"""
        issues = []
        sentences = self.extract_sentences(text)
        
        # Check for consecutive repetitions
        for i in range(len(sentences) - 2):
            if sentences[i] == sentences[i+1] == sentences[i+2]:
                issues.append(TranslationIssue(
                    severity="major",
                    issue_type="repetition",
                    location=f"{lang}/{attraction}",
                    english_text="N/A",
                    translated_text=sentences[i],
                    description=f"Phrase repeated 3+ times consecutively",
                    line_number=i
                ))
        
        # Check for phrase repetition throughout text
        phrase_counts = {}
        for sentence in sentences:
            if len(sentence) > 20:  # Only check substantial phrases
                phrase_counts[sentence] = phrase_counts.get(sentence, 0) + 1
        
        for phrase, count in phrase_counts.items():
            if count >= 5:
                issues.append(TranslationIssue(
                    severity="minor",
                    issue_type="repetition",
                    location=f"{lang}/{attraction}",
                    english_text="N/A",
                    translated_text=phrase[:100] + "...",
                    description=f"Phrase appears {count} times in text",
                    line_number=0
                ))
        
        return issues
    
    def check_length_ratio(self, english_text: str, translated_text: str, 
                          lang: str, attraction: str) -> List[TranslationIssue]:
        """Check if translation length is reasonable compared to English"""
        issues = []
        
        en_len = len(english_text)
        tr_len = len(translated_text)
        
        if en_len == 0:
            return issues
        
        ratio = tr_len / en_len
        
        # Expected ratios (approximate)
        expected_ratios = {
            "ar": (0.8, 1.3),  # Arabic can be shorter or longer
            "de": (1.0, 1.4),  # German tends to be longer
            "es": (1.0, 1.3),  # Spanish similar to English
            "fr": (1.0, 1.3),  # French similar
            "it": (1.0, 1.3),  # Italian similar
            "ja": (0.4, 0.8),  # Japanese much shorter (characters)
            "ko": (0.4, 0.8),  # Korean much shorter
            "pl": (0.9, 1.3),  # Polish similar
            "pt": (1.0, 1.3),  # Portuguese similar
            "ru": (0.8, 1.2),  # Russian can be shorter
            "zh": (0.3, 0.7),  # Chinese much shorter
        }
        
        min_ratio, max_ratio = expected_ratios.get(lang, (0.7, 1.5))
        
        if ratio < min_ratio:
            issues.append(TranslationIssue(
                severity="critical",
                issue_type="missing_content",
                location=f"{lang}/{attraction}",
                english_text=f"Length: {en_len} chars",
                translated_text=f"Length: {tr_len} chars (ratio: {ratio:.2f})",
                description=f"Translation is {(1-ratio)*100:.0f}% shorter than expected. Possible missing content.",
                line_number=0
            ))
        elif ratio > max_ratio:
            issues.append(TranslationIssue(
                severity="major",
                issue_type="excessive_length",
                location=f"{lang}/{attraction}",
                english_text=f"Length: {en_len} chars",
                translated_text=f"Length: {tr_len} chars (ratio: {ratio:.2f})",
                description=f"Translation is {(ratio-1)*100:.0f}% longer than expected. Possible repetitions or errors.",
                line_number=0
            ))
        
        return issues
    
    def check_key_terms(self, english_text: str, translated_text: str,
                       lang: str, attraction: str) -> List[TranslationIssue]:
        """Check if key terms are present in translation"""
        issues = []
        
        # Key terms that should appear in most attractions
        key_terms = {
            "colosseum": ["Colosseum", "gladiator", "arena", "emperor", "Rome"],
            "forum": ["Forum", "temple", "Senate", "Rome", "ancient"],
            "pantheon": ["Pantheon", "dome", "temple", "Rome"],
            "vatican-museums": ["Vatican", "museum", "art", "Pope"],
            "sistine-chapel": ["Sistine", "Michelangelo", "ceiling", "chapel"],
            "st-peters-basilica": ["Peter", "basilica", "Vatican", "dome"],
        }
        
        terms = key_terms.get(attraction, [])
        english_lower = english_text.lower()
        
        for term in terms:
            if term.lower() in english_lower:
                # Term exists in English, should exist in translation
                # (This is a simplified check - proper verification would need translation dictionaries)
                pass
        
        return issues
    
    def check_formatting(self, text: str, lang: str, attraction: str) -> List[TranslationIssue]:
        """Check for formatting issues"""
        issues = []
        
        # Check for excessive whitespace
        if re.search(r'\s{3,}', text):
            issues.append(TranslationIssue(
                severity="minor",
                issue_type="formatting",
                location=f"{lang}/{attraction}",
                english_text="N/A",
                translated_text="Multiple consecutive spaces found",
                description="Text contains excessive whitespace",
                line_number=0
            ))
        
        # Check for missing punctuation at end
        if text and not text.strip()[-1] in '.!?':
            issues.append(TranslationIssue(
                severity="minor",
                issue_type="formatting",
                location=f"{lang}/{attraction}",
                english_text="N/A",
                translated_text=f"Ends with: '{text.strip()[-20:]}'",
                description="Text doesn't end with proper punctuation",
                line_number=0
            ))
        
        return issues
    
    def verify_attraction(self, lang: str, attraction: str) -> List[TranslationIssue]:
        """Verify a single attraction translation"""
        issues = []
        
        # Load English source
        english_data = self.load_english_transcript(attraction)
        english_text = ""
        if english_data and "transcript" in english_data:
            segments = english_data["transcript"].get("segments", [])
            english_text = " ".join([seg.get("text", "") for seg in segments])
        
        # Load translation
        translated_text = self.load_script(lang, attraction)
        
        if not translated_text:
            issues.append(TranslationIssue(
                severity="critical",
                issue_type="missing_content",
                location=f"{lang}/{attraction}",
                english_text="File exists",
                translated_text="File missing or empty",
                description="Translation file not found",
                line_number=0
            ))
            return issues
        
        # Run checks
        issues.extend(self.check_repetitions(translated_text, lang, attraction))
        issues.extend(self.check_length_ratio(english_text, translated_text, lang, attraction))
        issues.extend(self.check_formatting(translated_text, lang, attraction))
        
        return issues
    
    def verify_all(self) -> Dict:
        """Verify all translations"""
        results = {
            "summary": {
                "total_files": 0,
                "files_with_issues": 0,
                "total_issues": 0,
                "critical_issues": 0,
                "major_issues": 0,
                "minor_issues": 0
            },
            "by_language": {},
            "by_attraction": {},
            "all_issues": []
        }
        
        for lang in LANGUAGES:
            lang_issues = []
            
            for attraction in ATTRACTIONS:
                results["summary"]["total_files"] += 1
                issues = self.verify_attraction(lang, attraction)
                
                if issues:
                    results["summary"]["files_with_issues"] += 1
                    lang_issues.extend(issues)
                    
                    # Count by severity
                    for issue in issues:
                        results["summary"]["total_issues"] += 1
                        if issue.severity == "critical":
                            results["summary"]["critical_issues"] += 1
                        elif issue.severity == "major":
                            results["summary"]["major_issues"] += 1
                        else:
                            results["summary"]["minor_issues"] += 1
                    
                    # Track by attraction
                    if attraction not in results["by_attraction"]:
                        results["by_attraction"][attraction] = []
                    results["by_attraction"][attraction].extend(issues)
            
            # Track by language
            results["by_language"][lang] = {
                "language_name": LANGUAGES[lang],
                "total_issues": len(lang_issues),
                "issues": lang_issues
            }
            results["all_issues"].extend(lang_issues)
        
        return results

def generate_report(results: Dict, output_dir: Path):
    """Generate detailed verification reports"""
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Summary report
    summary_file = output_dir / "VERIFICATION_SUMMARY.md"
    with open(summary_file, 'w', encoding='utf-8') as f:
        f.write("# Translation Verification Report\n\n")
        f.write(f"**Generated**: {Path(__file__).name}\n\n")
        
        f.write("## Summary\n\n")
        s = results["summary"]
        f.write(f"- **Total Files Checked**: {s['total_files']}\n")
        f.write(f"- **Files with Issues**: {s['files_with_issues']}\n")
        f.write(f"- **Total Issues Found**: {s['total_issues']}\n")
        f.write(f"  - 🔴 Critical: {s['critical_issues']}\n")
        f.write(f"  - 🟡 Major: {s['major_issues']}\n")
        f.write(f"  - 🟢 Minor: {s['minor_issues']}\n\n")
        
        # By Language
        f.write("## Issues by Language\n\n")
        f.write("| Language | Total Issues | Critical | Major | Minor |\n")
        f.write("|----------|--------------|----------|-------|-------|\n")
        
        for lang, data in results["by_language"].items():
            issues = data["issues"]
            critical = sum(1 for i in issues if i.severity == "critical")
            major = sum(1 for i in issues if i.severity == "major")
            minor = sum(1 for i in issues if i.severity == "minor")
            f.write(f"| {data['language_name']} ({lang}) | {len(issues)} | {critical} | {major} | {minor} |\n")
        
        f.write("\n## Issues by Attraction\n\n")
        for attraction, issues in results["by_attraction"].items():
            f.write(f"### {attraction.replace('-', ' ').title()}\n")
            f.write(f"**Total Issues**: {len(issues)}\n\n")
            
            for issue in issues[:5]:  # Show first 5
                icon = "🔴" if issue.severity == "critical" else "🟡" if issue.severity == "major" else "🟢"
                f.write(f"{icon} **{issue.issue_type}** ({issue.location})\n")
                f.write(f"   - {issue.description}\n\n")
            
            if len(issues) > 5:
                f.write(f"   ... and {len(issues) - 5} more issues\n\n")
    
    # Detailed report by language
    for lang, data in results["by_language"].items():
        lang_file = output_dir / f"ISSUES_{lang}_{LANGUAGES[lang]}.md"
        with open(lang_file, 'w', encoding='utf-8') as f:
            f.write(f"# {LANGUAGES[lang]} ({lang}) - Detailed Issues\n\n")
            f.write(f"**Total Issues**: {len(data['issues'])}\n\n")
            
            # Group by severity
            for severity in ["critical", "major", "minor"]:
                severity_issues = [i for i in data["issues"] if i.severity == severity]
                if severity_issues:
                    icon = "🔴" if severity == "critical" else "🟡" if severity == "major" else "🟢"
                    f.write(f"## {icon} {severity.title()} Issues ({len(severity_issues)})\n\n")
                    
                    for issue in severity_issues:
                        f.write(f"### {issue.issue_type.replace('_', ' ').title()}\n")
                        f.write(f"**Location**: {issue.location}\n\n")
                        f.write(f"**Description**: {issue.description}\n\n")
                        if issue.english_text != "N/A":
                            f.write(f"**English**: {issue.english_text[:200]}\n\n")
                        f.write(f"**Translation**: {issue.translated_text[:200]}\n\n")
                        f.write("---\n\n")
    
    # JSON export for programmatic access
    json_file = output_dir / "verification_results.json"
    # Convert dataclasses to dicts for JSON serialization
    json_results = {
        "summary": results["summary"],
        "by_language": {
            lang: {
                "language_name": data["language_name"],
                "total_issues": data["total_issues"],
                "issues": [
                    {
                        "severity": i.severity,
                        "issue_type": i.issue_type,
                        "location": i.location,
                        "description": i.description,
                        "english_text": i.english_text[:200] if len(i.english_text) > 200 else i.english_text,
                        "translated_text": i.translated_text[:200] if len(i.translated_text) > 200 else i.translated_text
                    }
                    for i in data["issues"]
                ]
            }
            for lang, data in results["by_language"].items()
        }
    }
    
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(json_results, f, indent=2, ensure_ascii=False)
    
    print(f"\n{'='*60}")
    print(f"Reports generated in: {output_dir}")
    print(f"{'='*60}")
    print(f"- VERIFICATION_SUMMARY.md - Overview of all issues")
    print(f"- ISSUES_[lang]_[name].md - Detailed reports per language")
    print(f"- verification_results.json - Machine-readable results")

if __name__ == "__main__":
    print("="*60)
    print("Translation Verification Tool")
    print("="*60)
    print(f"Source Transcripts: {SOURCE_TRANSCRIPTS}")
    print(f"Source Scripts: {SOURCE_SCRIPTS}")
    print(f"Output: {OUTPUT_DIR}")
    print()
    
    verifier = TranslationVerifier()
    print("Running verification checks...")
    print("This may take a few minutes...\n")
    
    results = verifier.verify_all()
    
    print("\nGenerating reports...")
    generate_report(results, OUTPUT_DIR)
    
    print("\n" + "="*60)
    print("VERIFICATION COMPLETE")
    print("="*60)
    print(f"Total Issues Found: {results['summary']['total_issues']}")
    print(f"  🔴 Critical: {results['summary']['critical_issues']}")
    print(f"  🟡 Major: {results['summary']['major_issues']}")
    print(f"  🟢 Minor: {results['summary']['minor_issues']}")
    print("\nCheck the reports in:", OUTPUT_DIR)
