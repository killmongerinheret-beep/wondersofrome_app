# Comprehensive Audio Tour Content Cleanup Task

## CONTEXT & PROBLEM STATEMENT

I have a multilingual audio tour app for Rome with **11 attractions** in **12 languages** (English + 11 translations: Arabic, Chinese, French, German, Italian, Japanese, Korean, Polish, Portuguese, Russian, Spanish).

After running a comprehensive audit, I discovered **3 CRITICAL ISSUES** that must be fixed before production:

---

## 🔴 ISSUE #1: MASSIVE REPETITION LOOPS

**Problem**: Many transcript files have sentences that repeat consecutively 3-33 times, creating terrible user experience.

**Examples Found**:
- Russian Colosseum: "Хорошее место для отдыха..." repeated **8 times** consecutively
- Russian Colosseum: "Это было место, где раньше вставляли большие желез..." repeated **7 times**
- Russian Colosseum: "Это место, где вносились большие железные брусья..." repeated **8 times**
- Russian Heart: "Водитель объясняет ее историю, архитектуру и значи..." repeated **3 times**
- Spanish Colosseum: "Un buen lugar para quedarse" repeated **10+ times**

**Root Cause**: TTS (Text-to-Speech) generation artifacts or translation pipeline errors that duplicated sentences.

**Impact**: 
- Audio will sound broken and unprofessional
- Users will be confused and frustrated
- App will get negative reviews

**Required Fix**:
- Detect consecutive duplicate sentences (sentences that appear 3+ times in a row)
- Keep only 1-2 occurrences maximum
- Preserve the natural flow of the narrative
- Apply to ALL 132 files (11 attractions × 12 languages)

---

## 🔴 ISSUE #2: PERSISTENT BRANDING VIOLATIONS

**Problem**: "Rick Steves" branding, URLs, and credits remain in several non-English transcripts despite previous cleanup attempts.

**Examples Found**:
- Portuguese Trastevere: Contains "Steve" reference
- Russian Colosseum: Contains ".com" URL
- Multiple files: May contain "Rick Steves", "ricksteves.com", "Gene Openshaw", "Francesca Caruso", "Cedar House Audio Productions"

**Root Cause**: Previous cleanup scripts only targeted English patterns, missing translated versions of the branding.

**Impact**:
- Legal/copyright issues (using someone else's brand)
- Unprofessional appearance
- Potential takedown requests

**Required Fix**:
- Remove ALL mentions of "Rick Steves" in ANY language/script:
  - English: "Rick Steves", "Rick", "I'm Rick Steves"
  - Arabic: "ريك ستيفز"
  - Chinese: "里克·史蒂夫斯"
  - Japanese: "リック・スティーブス"
  - Russian: "Рик Стивс"
  - Korean: "릭 스티브스"
- Remove ALL URLs: "ricksteves.com", "www.ricksteves.com", any http/https links
- Remove credits: "Gene Openshaw", "Francesca Caruso", "Cedar House Audio Productions"
- Replace with generic phrases:
  - "Rick Steves" → "your guide" (or equivalent in each language)
  - "ricksteves.com" → "wondersofrome.com"
  - Remove outros/credits entirely

---

## 🔴 ISSUE #3: MASSIVE CONTENT GAPS (90-97% MISSING)

**Problem**: Only the Colosseum has full translations. The other 10 attractions have only 2-10% of the English content translated.

**Affected Attractions**:
1. Forum - 93% missing (only ~2,300 chars vs ~33,000 expected)
2. Heart of Rome - 96% missing (only ~2,200 chars vs ~56,000 expected)
3. Jewish Ghetto - 90% missing (only ~2,400 chars vs ~23,000 expected)
4. Ostia Antica - 93% missing (only ~1,900 chars vs ~26,000 expected)
5. Pantheon - 91% missing (only ~1,900 chars vs ~20,000 expected)
6. Sistine Chapel - 91% missing (only ~2,100 chars vs ~23,000 expected)
7. St. Peter's Basilica - 95% missing (only ~2,400 chars vs ~44,000 expected)
8. Trastevere - 90% missing (only ~2,300 chars vs ~24,000 expected)
9. Vatican Museums - 94% missing (only ~2,500 chars vs ~43,000 expected)
10. Vatican Pinacoteca - 95% missing (only ~2,000 chars vs ~42,000 expected)

**Root Cause**: Translation pipeline only received/processed short intro snippets instead of full English transcripts.

**Impact**:
- Users get 2-minute intros instead of 30-40 minute full tours
- Massive value proposition failure
- Cannot market as "complete audio guide"
- Wasted TTS generation costs on incomplete content

**Required Fix** (2 options):

**Option A - Immediate (Recommended for now)**:
- Flag these files as "incomplete" in the report
- Focus on fixing Issues #1 and #2 for the Colosseum (which IS complete)
- Document which files need re-translation

**Option B - Complete (Future work)**:
- Source full English transcripts for all 10 attractions
- Re-translate using proper translation service
- Regenerate TTS audio
- (This is a separate, larger project)

---

## YOUR TASK

Create a Python script that:

### 1. **Removes Repetitions** (Priority: CRITICAL)
```python
def remove_repetitions(text, max_repeat=2):
    """
    - Split text into sentences (by . ! ?)
    - Detect consecutive duplicate sentences
    - Keep only max_repeat occurrences (default: 2)
    - Preserve sentence order and flow
    """
```

### 2. **Removes Branding** (Priority: CRITICAL)
```python
def remove_branding(text):
    """
    - Remove "Rick Steves" in ALL languages/scripts
    - Remove URLs (ricksteves.com, www.ricksteves.com)
    - Remove credits (Gene Openshaw, Francesca Caruso, Cedar House)
    - Replace with generic equivalents
    - Clean up formatting artifacts
    """
```

### 3. **Analyzes Content Gaps** (Priority: HIGH)
```python
def analyze_content_gap(text, expected_min_length=5000):
    """
    - Check if file is suspiciously short (< 5000 chars)
    - Flag for potential re-translation
    - Report in summary
    """
```

### 4. **Generates Comprehensive Report**
```json
{
  "summary": {
    "total_files": 132,
    "files_with_repetitions": 45,
    "files_with_branding": 12,
    "files_short": 110,
    "files_with_errors": 0
  },
  "details": [
    {
      "file": "colosseum/ru/deep.txt",
      "original_length": 51234,
      "final_length": 48567,
      "repetitions_removed": 2667,
      "branding_removed": 0,
      "is_short": false,
      "issues": ["Removed 2667 chars of repetitions"]
    }
  ]
}
```

---

## FILE STRUCTURE

**Source Directory**: `D:/wondersofrome/cleaned_production_content_v2/`
```
cleaned_production_content_v2/
├── colosseum/
│   ├── en/
│   │   └── deep.txt
│   ├── ar/
│   │   └── deep.txt
│   ├── es/
│   │   └── deep.txt
│   └── ... (12 languages total)
├── forum/
│   └── ... (same structure)
└── ... (11 attractions total)
```

**Output Directory**: `D:/wondersofrome/final_cleaned_content/`
- Same structure as source
- Cleaned files ready for production

**Report File**: `D:/wondersofrome/fix_report.json`
- Detailed JSON report of all changes

---

## EXPECTED RESULTS

After running your script:

✅ **Repetitions Fixed**:
- No sentence appears more than 2 times consecutively
- Natural narrative flow preserved
- ~45 files cleaned

✅ **Branding Removed**:
- Zero mentions of "Rick Steves" in any language
- Zero ricksteves.com URLs
- Zero production credits
- ~12 files cleaned

✅ **Content Gaps Documented**:
- 110 files flagged as "short" (need re-translation)
- 22 files confirmed as "complete" (Colosseum in all languages)
- Clear report for next steps

✅ **Production-Ready Files**:
- Colosseum: 12 complete, clean files ready for app
- Other 10 attractions: Flagged for future work

---

## VALIDATION CRITERIA

Your script should:
1. ✅ Process all 132 files without errors
2. ✅ Reduce repetitions by detecting consecutive duplicates
3. ✅ Remove ALL branding patterns (multilingual)
4. ✅ Generate detailed JSON report
5. ✅ Preserve file structure and encoding (UTF-8)
6. ✅ Show progress during execution
7. ✅ Complete in < 5 minutes

---

## EXAMPLE OUTPUT

```
================================================================================
🔧 COMPREHENSIVE FIX: Repetitions + Branding + Content Analysis
================================================================================

Processing: colosseum/en/deep.txt
Processing: colosseum/ar/deep.txt
Processing: colosseum/es/deep.txt
...
Processing: vatican-pinacoteca/zh/deep.txt

================================================================================
📊 SUMMARY REPORT
================================================================================
Total files processed: 132

✅ Files with repetitions fixed: 45
✅ Files with branding removed: 12
⚠️  Files with content gaps: 110
❌ Files with errors: 0

📉 SHORT CONTENT FILES (may need re-translation):
  - forum/ar/deep.txt (2,345 chars)
  - forum/es/deep.txt (2,289 chars)
  - forum/fr/deep.txt (2,412 chars)
  ... (107 more)

📄 Detailed report saved to: D:/wondersofrome/fix_report.json
✨ Cleaned files saved to: D:/wondersofrome/final_cleaned_content/

================================================================================
✅ COMPLETE!
================================================================================
```

---

## ADDITIONAL NOTES

1. **Encoding**: All files are UTF-8 with various scripts (Latin, Cyrillic, Arabic, CJK)
2. **File Size**: Files range from 2KB (incomplete) to 50KB (complete)
3. **Performance**: Should process ~2-3 files per second
4. **Error Handling**: Skip files with errors, log them, continue processing
5. **Backup**: Source files remain untouched, all output goes to new directory

---

## DELIVERABLES

Please provide:
1. ✅ Complete Python script (`fix_all_issues.py`)
2. ✅ Execution instructions
3. ✅ Sample output showing the script working
4. ✅ Explanation of any edge cases handled

---

## QUESTIONS TO CLARIFY (if needed)

1. Should I preserve paragraph breaks and formatting?
   - **Answer**: Yes, preserve all formatting
   
2. What if a sentence appears 2 times - is that acceptable?
   - **Answer**: Yes, 2 times is acceptable, 3+ is a problem
   
3. Should I create a backup before processing?
   - **Answer**: No, source files remain untouched, output goes to new directory

4. What about partial matches (e.g., "Rick" vs "Rick Steves")?
   - **Answer**: Remove both, but be careful not to remove legitimate uses of common words

---

## SUCCESS CRITERIA

This task is complete when:
- ✅ Script runs without errors on all 132 files
- ✅ Colosseum files (22 total) are clean and production-ready
- ✅ All repetitions reduced to max 2 consecutive occurrences
- ✅ All branding removed (verified by manual spot-check)
- ✅ Comprehensive JSON report generated
- ✅ Clear documentation of which files need re-translation

---

**Ready to proceed? Please create the script and run it on the specified directory structure.**
