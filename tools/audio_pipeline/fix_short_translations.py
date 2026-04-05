import argparse
import json
import os
import subprocess
from dataclasses import dataclass
from typing import Dict, List, Optional, Set, Tuple


@dataclass(frozen=True)
class Finding:
    sight_id: str
    lang: str


def read_json(path: str) -> Dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def run_pipeline(args: List[str]) -> int:
    cmd = [os.path.join(".venv", "Scripts", "python.exe"), "-u", os.path.join("tools", "audio_pipeline", "pipeline.py")] + args
    return subprocess.call(cmd)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--report", default=os.path.join("out", "transcripts", "_translation_length_report.json"))
    ap.add_argument("--audio-root", default="audio")
    ap.add_argument("--out", default=os.path.join("out", "transcripts"))
    ap.add_argument("--ollama-model", default=os.getenv("OLLAMA_MODEL", "llama3.1:8b"))
    ap.add_argument("--ollama-timeout", default=os.getenv("OLLAMA_TIMEOUT_SEC", "7200"))
    ap.add_argument("--ollama-num-predict", default=os.getenv("OLLAMA_NUM_PREDICT", "4096"))
    ap.add_argument("--translate-chunk-chars", default=os.getenv("TRANSLATE_CHUNK_CHARS", "1200"))
    ap.add_argument("--max-llm-retries", default=os.getenv("MAX_LLM_RETRIES", "2"))
    ap.add_argument("--only-sight", default="")
    ap.add_argument("--only-lang", default="")
    ap.add_argument("--only-variant", default="deep")
    args = ap.parse_args()

    report = read_json(args.report)
    raw = report.get("findings") or []

    targets: List[Finding] = []
    for r in raw:
        if not isinstance(r, dict):
            continue
        sight_id = str(r.get("sightId") or "").strip()
        lang = str(r.get("lang") or "").strip()
        if sight_id and lang:
            targets.append(Finding(sight_id=sight_id, lang=lang))

    if not targets:
        print("No findings in report; nothing to fix.")
        return 0

    only_sight = args.only_sight.strip()
    if only_sight:
        targets = [t for t in targets if t.sight_id == only_sight]

    by_sight: Dict[str, Set[str]] = {}
    for t in targets:
        by_sight.setdefault(t.sight_id, set()).add(t.lang)

    only_lang = args.only_lang.strip()
    if only_lang:
        for s in list(by_sight.keys()):
            by_sight[s] = {l for l in by_sight[s] if l == only_lang}
            if not by_sight[s]:
                del by_sight[s]

    if not by_sight:
        print("No findings match the provided filters.")
        return 0

    for sight_id in sorted(by_sight.keys()):
        langs = sorted(by_sight[sight_id])
        rc = run_pipeline(
            [
                "--audio-root",
                args.audio_root,
                "--out",
                args.out,
                "--skip-transcribe",
                "--translate",
                "--force-llm",
                "--llm-provider",
                "ollama",
                "--ollama-model",
                args.ollama_model,
                "--ollama-timeout",
                str(args.ollama_timeout),
                "--ollama-num-predict",
                str(args.ollama_num_predict),
                "--translate-chunk-chars",
                str(args.translate_chunk_chars),
                "--max-llm-retries",
                str(args.max_llm_retries),
                "--target-langs",
                ",".join(["en"] + langs),
                "--only-sight",
                sight_id,
                "--only-lang",
                "en",
                "--only-variant",
                args.only_variant,
            ]
        )
        if rc != 0:
            return rc

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

