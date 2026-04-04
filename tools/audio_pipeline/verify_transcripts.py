import argparse
import json
import os
import re
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple


def read_json(path: str) -> Dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path: str, obj: Dict) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)


def iter_json_files(root: str) -> List[str]:
    out: List[str] = []
    for dirpath, _dirnames, filenames in os.walk(root):
        for fn in filenames:
            if fn.lower().endswith(".json") and fn != "_index.json":
                out.append(os.path.join(dirpath, fn))
    out.sort()
    return out


def normalize_text(text: str) -> str:
    t = text.replace("\r\n", "\n").replace("\r", "\n")
    t = re.sub(r"\s+", " ", t)
    return t.strip()


def tokenize_words(text: str) -> List[str]:
    t = normalize_text(text).lower()
    return [w for w in re.split(r"[^0-9a-zA-ZÀ-ÖØ-öø-ÿ’']+", t) if w]


def wer(ref: List[str], hyp: List[str]) -> float:
    if not ref:
        return 0.0 if not hyp else 1.0
    n = len(ref)
    m = len(hyp)
    dp = list(range(m + 1))
    for i in range(1, n + 1):
        prev = dp[0]
        dp[0] = i
        for j in range(1, m + 1):
            tmp = dp[j]
            cost = 0 if ref[i - 1] == hyp[j - 1] else 1
            dp[j] = min(dp[j] + 1, dp[j - 1] + 1, prev + cost)
            prev = tmp
    return dp[m] / max(1, n)


@dataclass(frozen=True)
class Target:
    sight_id: str
    lang: str
    variant: str
    json_path: str


def parse_target(doc: Dict, json_path: str) -> Optional[Target]:
    sight_id = str(doc.get("sightId") or "").strip()
    lang = str(doc.get("lang") or "").strip()
    variant = str(doc.get("variant") or "").strip()
    if not sight_id or not lang or not variant:
        return None
    return Target(sight_id=sight_id, lang=lang, variant=variant, json_path=json_path)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--audio-root", default="audio")
    ap.add_argument("--json-root", default=os.path.join("out", "transcripts"))
    ap.add_argument("--out", default=os.path.join("out", "transcripts", "_verify_report.json"))
    ap.add_argument("--model", default="small")
    ap.add_argument("--language", default="en")
    ap.add_argument("--clip-seconds", type=int, default=0)
    ap.add_argument("--only-sight", default="")
    ap.add_argument("--only-variant", default="")
    ap.add_argument("--max-files", type=int, default=0)
    args = ap.parse_args()

    try:
        import whisper  # type: ignore
    except Exception as e:
        raise SystemExit(
            "Missing openai-whisper. Install in your Python 3.11 env:\n"
            ".\\.venv_tts\\Scripts\\python -m pip install openai-whisper\n"
            f"Error: {e}"
        )

    model = whisper.load_model(args.model)

    only_sight = args.only_sight.strip()
    only_variant = args.only_variant.strip()

    files = iter_json_files(args.json_root)
    results: List[Dict] = []

    checked = 0
    for jp in files:
        doc = read_json(jp)
        t = parse_target(doc, jp)
        if not t:
            continue
        if only_sight and t.sight_id != only_sight:
            continue
        if only_variant and t.variant != only_variant:
            continue
        if t.lang != args.language:
            continue

        audio_path = os.path.join(args.audio_root, t.lang, t.sight_id, f"{t.variant}.mp3")
        if not os.path.exists(audio_path):
            audio_path = os.path.join(args.audio_root, t.lang, t.sight_id, f"{t.variant}.m4a")
        if not os.path.exists(audio_path):
            results.append({"sightId": t.sight_id, "lang": t.lang, "variant": t.variant, "json": jp, "error": "audio_not_found"})
            continue

        transcript_obj = doc.get("transcript")
        ref_text = ""
        if isinstance(transcript_obj, dict) and isinstance(transcript_obj.get("text"), str):
            ref_text = transcript_obj["text"]
        if args.clip_seconds and args.clip_seconds > 0 and isinstance(transcript_obj, dict):
            segs = transcript_obj.get("segments")
            if isinstance(segs, list) and segs:
                parts: List[str] = []
                for s in segs:
                    if not isinstance(s, dict):
                        continue
                    end = s.get("end")
                    txt = s.get("text")
                    if isinstance(end, (int, float)) and end <= float(args.clip_seconds) and isinstance(txt, str) and txt.strip():
                        parts.append(txt.strip())
                if parts:
                    ref_text = " ".join(parts)
        ref_words = tokenize_words(ref_text)

        clip_timestamps = None
        if args.clip_seconds and args.clip_seconds > 0:
            clip_timestamps = f"0,{int(args.clip_seconds)}"

        hyp = whisper.transcribe(
            model,
            audio_path,
            language=args.language,
            task="transcribe",
            fp16=False,
            clip_timestamps=clip_timestamps,
        )
        hyp_text = str(hyp.get("text") or "")
        hyp_words = tokenize_words(hyp_text)

        score = wer(ref_words, hyp_words)
        ratio = (len(hyp_text.strip()) / max(1, len(ref_text.strip()))) if ref_text.strip() else 0.0

        results.append(
            {
                "sightId": t.sight_id,
                "lang": t.lang,
                "variant": t.variant,
                "audio": audio_path,
                "json": jp,
                "refChars": len(ref_text),
                "hypChars": len(hyp_text),
                "charRatio": round(ratio, 4),
                "refWords": len(ref_words),
                "hypWords": len(hyp_words),
                "wer": round(score, 4),
            }
        )

        checked += 1
        if args.max_files and checked >= args.max_files:
            break

    summary = {
        "checked": checked,
        "model": args.model,
        "language": args.language,
        "avgWer": round(sum([r["wer"] for r in results if isinstance(r.get("wer"), (int, float))]) / max(1, len([r for r in results if "wer" in r])), 4),
        "highWer": len([r for r in results if isinstance(r.get("wer"), (int, float)) and r["wer"] >= 0.25]),
        "missingAudio": len([r for r in results if r.get("error") == "audio_not_found"]),
    }

    report = {"summary": summary, "results": results}
    write_json(args.out, report)
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    print(f"Saved report: {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
