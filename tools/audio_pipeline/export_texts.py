import argparse
import json
import os
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple


@dataclass(frozen=True)
class TrackText:
    sight_id: str
    src_lang: str
    variant: str
    lang: str
    text: str


def read_json(path: str) -> Dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def ensure_dir(p: str) -> None:
    os.makedirs(p, exist_ok=True)


def write_text(path: str, text: str) -> None:
    ensure_dir(os.path.dirname(path))
    with open(path, "w", encoding="utf-8") as f:
        f.write(text.strip() + "\n")


def iter_json_files(root: str) -> List[str]:
    out: List[str] = []
    for dirpath, _dirnames, filenames in os.walk(root):
        for fn in filenames:
            if fn.lower().endswith(".json"):
                out.append(os.path.join(dirpath, fn))
    out.sort()
    return out


def pick_base_text(doc: Dict) -> Tuple[Optional[str], str]:
    if isinstance(doc.get("script_human"), str) and doc["script_human"].strip():
        return "script_human", doc["script_human"].strip()
    if isinstance(doc.get("rewritten"), str) and doc["rewritten"].strip():
        return "rewritten", doc["rewritten"].strip()
    transcript = doc.get("transcript")
    if isinstance(transcript, dict):
        t = transcript.get("text")
        if isinstance(t, str) and t.strip():
            return "transcript.text", t.strip()
    return None, ""


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="input_root", default="out/transcripts")
    ap.add_argument("--out", dest="output_root", default="out/tts_scripts")
    ap.add_argument("--mode", choices=["human"], default="human")
    ap.add_argument("--layout", choices=["by_lang", "by_sight"], default="by_lang")
    ap.add_argument("--variants", default="")
    ap.add_argument("--langs", default="")
    ap.add_argument("--sights", default="")
    args = ap.parse_args()

    variants = {x.strip() for x in args.variants.split(",") if x.strip()}
    langs = {x.strip() for x in args.langs.split(",") if x.strip()}
    sights = {x.strip() for x in args.sights.split(",") if x.strip()}

    files = [p for p in iter_json_files(args.input_root) if os.path.basename(p) != "_index.json"]
    if not files:
        raise SystemExit(f"No JSON files found under: {args.input_root}")

    exported: List[TrackText] = []

    for p in files:
        doc = read_json(p)
        sight_id = str(doc.get("sightId") or "").strip()
        src_lang = str(doc.get("lang") or "").strip()
        variant = str(doc.get("variant") or "").strip()
        if not sight_id or not src_lang or not variant:
            continue
        if variants and variant not in variants:
            continue
        if sights and sight_id not in sights:
            continue

        key, base_text = pick_base_text(doc)
        if not base_text:
            continue

        if langs and src_lang not in langs:
            pass
        else:
            exported.append(TrackText(sight_id=sight_id, src_lang=src_lang, variant=variant, lang=src_lang, text=base_text))

        translations = doc.get("translations_human") if args.mode == "human" else None
        if isinstance(translations, dict):
            for lang, txt in translations.items():
                if not isinstance(lang, str):
                    continue
                if langs and lang not in langs:
                    continue
                if not isinstance(txt, str) or not txt.strip():
                    continue
                exported.append(TrackText(sight_id=sight_id, src_lang=src_lang, variant=variant, lang=lang, text=txt.strip()))

        if key is None:
            continue

    if not exported:
        raise SystemExit("No scripts found to export. Ensure your JSON files contain script_human + translations_human.")

    for t in exported:
        if args.layout == "by_lang":
            out_path = os.path.join(args.output_root, t.lang, t.sight_id, f"{t.variant}.txt")
        else:
            out_path = os.path.join(args.output_root, t.sight_id, t.lang, f"{t.variant}.txt")
        write_text(out_path, t.text)

    meta = {
        "inputRoot": args.input_root,
        "outputRoot": args.output_root,
        "count": len(exported),
        "layout": args.layout,
    }
    write_text(os.path.join(args.output_root, "_export_meta.json"), json.dumps(meta, ensure_ascii=False, indent=2))
    print(f"Exported {len(exported)} scripts to: {args.output_root}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

