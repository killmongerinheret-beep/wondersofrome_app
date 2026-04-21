import argparse
import json
import os
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple


def read_text(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def ensure_dir(p: str) -> None:
    os.makedirs(p, exist_ok=True)


def write_json(path: str, obj: Dict) -> None:
    ensure_dir(os.path.dirname(path))
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)


def iter_txt_files(root: str) -> List[str]:
    out: List[str] = []
    for dirpath, _dirnames, filenames in os.walk(root):
        for fn in filenames:
            if fn.lower().endswith(".txt"):
                out.append(os.path.join(dirpath, fn))
    out.sort()
    return out


def in_ranges(cp: int, ranges: List[Tuple[int, int]]) -> bool:
    for lo, hi in ranges:
        if lo <= cp <= hi:
            return True
    return False


RANGES = {
    "latin": [(0x0041, 0x007A), (0x00C0, 0x00FF), (0x0100, 0x017F), (0x0180, 0x024F)],
    "cyrillic": [(0x0400, 0x04FF), (0x0500, 0x052F)],
    "arabic": [(0x0600, 0x06FF), (0x0750, 0x077F), (0x08A0, 0x08FF), (0xFB50, 0xFDFF), (0xFE70, 0xFEFF)],
    "han": [(0x4E00, 0x9FFF), (0x3400, 0x4DBF)],
    "hiragana": [(0x3040, 0x309F)],
    "katakana": [(0x30A0, 0x30FF)],
    "hangul": [(0xAC00, 0xD7AF)],
}


def script_of_char(ch: str) -> Optional[str]:
    cp = ord(ch)
    if in_ranges(cp, RANGES["arabic"]):
        return "arabic"
    if in_ranges(cp, RANGES["cyrillic"]):
        return "cyrillic"
    if in_ranges(cp, RANGES["hangul"]):
        return "hangul"
    if in_ranges(cp, RANGES["hiragana"]):
        return "hiragana"
    if in_ranges(cp, RANGES["katakana"]):
        return "katakana"
    if in_ranges(cp, RANGES["han"]):
        return "han"
    if in_ranges(cp, RANGES["latin"]):
        return "latin"
    return None


EXPECTED = {
    "en": {"latin"},
    "it": {"latin"},
    "es": {"latin"},
    "fr": {"latin"},
    "de": {"latin"},
    "pt": {"latin"},
    "pl": {"latin"},
    "ru": {"cyrillic"},
    "ar": {"arabic"},
    "zh": {"han"},
    "ja": {"han", "hiragana", "katakana"},
    "ko": {"hangul", "han"},
}


@dataclass(frozen=True)
class Finding:
    path: str
    lang: str
    reason: str
    details: Dict


def analyze_text(lang: str, text: str) -> List[Finding]:
    findings: List[Finding] = []
    expected = EXPECTED.get(lang)
    if not expected:
        return findings

    counts: Dict[str, int] = {}
    total_letterish = 0

    for ch in text:
        s = script_of_char(ch)
        if not s:
            continue
        counts[s] = counts.get(s, 0) + 1
        total_letterish += 1

    if total_letterish == 0:
        findings.append(Finding(path="", lang=lang, reason="empty_or_no_letters", details={}))
        return findings

    unexpected = {k: v for k, v in counts.items() if k not in expected}
    unexpected_ratio = sum(unexpected.values()) / max(1, total_letterish)

    if unexpected_ratio >= 0.02:
        findings.append(
            Finding(
                path="",
                lang=lang,
                reason="mixed_scripts",
                details={"expected": sorted(expected), "counts": counts, "unexpected_ratio": round(unexpected_ratio, 4)},
            )
        )

    lower = text.lower()
    if lang == "en" and ("this is a comprehensive audio" in lower or "this audio tour provides" in lower):
        findings.append(Finding(path="", lang=lang, reason="generic_meta_intro", details={}))

    if "\uFFFD" in text:
        findings.append(Finding(path="", lang=lang, reason="replacement_char_found", details={}))

    return findings


def infer_lang_from_path(p: str, root: str) -> Optional[str]:
    rel = os.path.relpath(p, root).replace("\\", "/")
    parts = rel.split("/")
    if len(parts) < 3:
        return None
    return parts[0]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default="out/tts_scripts")
    ap.add_argument("--out", default="out/tts_scripts/_qa_report.json")
    args = ap.parse_args()

    files = iter_txt_files(args.root)
    if not files:
        raise SystemExit(f"No .txt files found under: {args.root}")

    all_findings: List[Dict] = []
    summary: Dict[str, int] = {}

    for p in files:
        lang = infer_lang_from_path(p, args.root) or "?"
        txt = read_text(p)
        fnds = analyze_text(lang, txt)
        for f in fnds:
            rec = {"path": p, "lang": lang, "reason": f.reason, "details": f.details}
            all_findings.append(rec)
            summary[f.reason] = summary.get(f.reason, 0) + 1

    report = {"root": args.root, "fileCount": len(files), "findingCount": len(all_findings), "summary": summary, "findings": all_findings}
    write_json(args.out, report)

    print(json.dumps({"fileCount": len(files), "findingCount": len(all_findings), "summary": summary}, ensure_ascii=False, indent=2))
    print(f"Saved report: {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

