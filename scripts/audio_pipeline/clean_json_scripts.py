import argparse
import json
import os
import re
from typing import Dict, List, Optional, Tuple


SCRIPT_RANGES = {
    "latin": [(0x0041, 0x007A), (0x00C0, 0x00FF), (0x0100, 0x017F), (0x0180, 0x024F)],
    "cyrillic": [(0x0400, 0x04FF), (0x0500, 0x052F)],
    "arabic": [(0x0600, 0x06FF), (0x0750, 0x077F), (0x08A0, 0x08FF), (0xFB50, 0xFDFF), (0xFE70, 0xFEFF)],
    "han": [(0x4E00, 0x9FFF), (0x3400, 0x4DBF)],
    "hiragana": [(0x3040, 0x309F)],
    "katakana": [(0x30A0, 0x30FF)],
    "hangul": [(0xAC00, 0xD7AF)],
}


EXPECTED_SCRIPTS = {
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


def _in_ranges(cp: int, ranges: List[Tuple[int, int]]) -> bool:
    for lo, hi in ranges:
        if lo <= cp <= hi:
            return True
    return False


def _script_of(ch: str) -> Optional[str]:
    cp = ord(ch)
    if _in_ranges(cp, SCRIPT_RANGES["arabic"]):
        return "arabic"
    if _in_ranges(cp, SCRIPT_RANGES["cyrillic"]):
        return "cyrillic"
    if _in_ranges(cp, SCRIPT_RANGES["hangul"]):
        return "hangul"
    if _in_ranges(cp, SCRIPT_RANGES["hiragana"]):
        return "hiragana"
    if _in_ranges(cp, SCRIPT_RANGES["katakana"]):
        return "katakana"
    if _in_ranges(cp, SCRIPT_RANGES["han"]):
        return "han"
    if _in_ranges(cp, SCRIPT_RANGES["latin"]):
        return "latin"
    return None


def sanitize_to_expected_script(lang: str, text: str) -> str:
    expected = EXPECTED_SCRIPTS.get(lang)
    if not expected:
        return text
    kept: List[str] = []
    for ch in text:
        s = _script_of(ch)
        if s is None:
            kept.append(ch)
            continue
        if s in expected:
            kept.append(ch)
    return "".join(kept)


def looks_like_generic_meta_intro_en(text: str) -> bool:
    t = text.strip().lower()
    if t.startswith("this is a comprehensive audio guide"):
        return True
    if t.startswith("this is a comprehensive audio tour"):
        return True
    if t.startswith("this is an audio tour"):
        return True
    if "some key takeaways" in t:
        return True
    return False


def normalize_whitespace(text: str) -> str:
    t = text.replace("\r\n", "\n").replace("\r", "\n")
    t = re.sub(r"\n{3,}", "\n\n", t)
    t = re.sub(r"[ \t]{2,}", " ", t)
    return t.strip()


def iter_json_files(root: str) -> List[str]:
    out: List[str] = []
    for dirpath, _dirnames, filenames in os.walk(root):
        for fn in filenames:
            if fn.lower().endswith(".json") and fn != "_index.json":
                out.append(os.path.join(dirpath, fn))
    out.sort()
    return out


def read_json(path: str) -> Dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path: str, obj: Dict) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=os.path.join("out", "transcripts"))
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    files = iter_json_files(args.root)
    if not files:
        raise SystemExit(f"No JSON files found under: {args.root}")

    changed = 0
    fixed_meta = 0
    sanitized = 0

    for fp in files:
        doc = read_json(fp)
        src_lang = str(doc.get("lang") or "").strip()
        transcript = doc.get("transcript")
        transcript_text = ""
        if isinstance(transcript, dict):
            tt = transcript.get("text")
            if isinstance(tt, str):
                transcript_text = tt

        if isinstance(doc.get("script_human"), str):
            sh = normalize_whitespace(str(doc.get("script_human") or ""))
            if src_lang == "en" and looks_like_generic_meta_intro_en(sh) and transcript_text.strip():
                sh = normalize_whitespace(transcript_text)
                doc["script_human"] = sh
                fixed_meta += 1
            else:
                doc["script_human"] = sh

        th = doc.get("translations_human")
        if isinstance(th, dict):
            new_th: Dict[str, str] = {}
            for lang, txt in th.items():
                if not isinstance(lang, str) or not isinstance(txt, str):
                    continue
                cleaned = normalize_whitespace(txt)
                if lang in EXPECTED_SCRIPTS:
                    s = sanitize_to_expected_script(lang, cleaned)
                    if s != cleaned:
                        sanitized += 1
                    cleaned = normalize_whitespace(s)
                new_th[lang] = cleaned
            doc["translations_human"] = new_th

        if not args.dry_run:
            write_json(fp, doc)
        changed += 1

    print(json.dumps({"files": len(files), "updated": changed, "fixed_meta": fixed_meta, "sanitized": sanitized}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
