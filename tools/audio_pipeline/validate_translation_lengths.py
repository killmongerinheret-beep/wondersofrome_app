import argparse
import json
import os
from typing import Dict, List, Tuple


TARGET_LANGS = ["it", "es", "fr", "de", "pt", "pl", "ru", "ar", "zh", "ja", "ko"]


def read_json(path: str) -> Dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path: str, obj: Dict) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)


def iter_en_deep(root: str) -> List[str]:
    out: List[str] = []
    for dirpath, _dirnames, filenames in os.walk(root):
        for fn in filenames:
            if fn == "deep.json" and dirpath.replace("\\", "/").endswith("/en"):
                out.append(os.path.join(dirpath, fn))
    out.sort()
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=os.path.join("out", "transcripts"))
    ap.add_argument("--min-ratio", type=float, default=0.35)
    ap.add_argument("--out", default=os.path.join("out", "transcripts", "_translation_length_report.json"))
    args = ap.parse_args()

    files = iter_en_deep(args.root)
    if not files:
        raise SystemExit(f"No EN deep.json files found under: {args.root}")

    findings: List[Dict] = []
    for fp in files:
        doc = read_json(fp)
        sight = str(doc.get("sightId") or "").strip() or os.path.basename(os.path.dirname(os.path.dirname(fp)))
        base = str(doc.get("script_human") or "").strip()
        base_len = len(base)
        th = doc.get("translations_human")
        th = th if isinstance(th, dict) else {}
        for lang in TARGET_LANGS:
            t = str(th.get(lang) or "").strip()
            ratio = (len(t) / max(1, base_len)) if base_len else 0.0
            if ratio < float(args.min_ratio):
                findings.append(
                    {
                        "sightId": sight,
                        "lang": lang,
                        "ratio": round(ratio, 4),
                        "baseChars": base_len,
                        "translatedChars": len(t),
                        "json": fp,
                    }
                )

    summary = {
        "filesChecked": len(files),
        "minRatio": args.min_ratio,
        "findings": len(findings),
    }
    report = {"summary": summary, "findings": findings}
    write_json(args.out, report)
    print(json.dumps(summary, ensure_ascii=False, indent=2))

    by_lang: Dict[str, int] = {}
    by_sight: Dict[str, int] = {}
    for f in findings:
        by_lang[f["lang"]] = by_lang.get(f["lang"], 0) + 1
        by_sight[f["sightId"]] = by_sight.get(f["sightId"], 0) + 1

    if findings:
        print("Worst languages (count):")
        for k, v in sorted(by_lang.items(), key=lambda kv: (-kv[1], kv[0]))[:12]:
            print(f"  {k}: {v}")
        print("Worst sights (count):")
        for k, v in sorted(by_sight.items(), key=lambda kv: (-kv[1], kv[0]))[:20]:
            print(f"  {k}: {v}")
        print(f"Saved report: {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

