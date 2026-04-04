import argparse
import json
import os
import subprocess
from dataclasses import dataclass
from typing import Dict, List, Optional, Set, Tuple


@dataclass(frozen=True)
class QaFinding:
    path: str
    lang: str
    reason: str


def read_json(path: str) -> Dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def infer_from_tts_path(p: str) -> Optional[Tuple[str, str, str]]:
    rel = p.replace("\\", "/")
    parts = rel.split("/")
    if len(parts) < 4:
        return None
    lang = parts[-3]
    sight_id = parts[-2]
    variant = os.path.splitext(parts[-1])[0]
    return sight_id, lang, variant


def run_pipeline(args: List[str]) -> int:
    cmd = [os.path.join(".venv", "Scripts", "python.exe"), "-u", os.path.join("tools", "audio_pipeline", "pipeline.py")] + args
    return subprocess.call(cmd)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--qa", default=os.path.join("out", "tts_scripts", "_qa_report.json"))
    ap.add_argument("--audio-root", default="audio")
    ap.add_argument("--out", default=os.path.join("out", "transcripts"))
    ap.add_argument("--ollama-model", default=os.getenv("OLLAMA_MODEL", "llama3.1:8b"))
    ap.add_argument("--ollama-timeout", default=os.getenv("OLLAMA_TIMEOUT_SEC", "7200"))
    ap.add_argument("--translate-chunk-chars", default="1200")
    ap.add_argument("--max-llm-retries", default="4")
    args = ap.parse_args()

    qa = read_json(args.qa)
    findings_raw = qa.get("findings") or []
    findings: List[QaFinding] = []
    for r in findings_raw:
        if not isinstance(r, dict):
            continue
        p = r.get("path")
        lang = r.get("lang")
        reason = r.get("reason")
        if isinstance(p, str) and isinstance(lang, str) and isinstance(reason, str):
            findings.append(QaFinding(path=p, lang=lang, reason=reason))

    meta_sights: Set[Tuple[str, str, str]] = set()
    mixed: Set[Tuple[str, str, str]] = set()

    for f in findings:
        inferred = infer_from_tts_path(f.path)
        if not inferred:
            continue
        sight_id, lang, variant = inferred
        if f.reason == "generic_meta_intro":
            meta_sights.add((sight_id, "en", variant))
        elif f.reason == "mixed_scripts":
            mixed.add((sight_id, lang, variant))

    for sight_id, src_lang, variant in sorted(meta_sights):
        rc = run_pipeline(
            [
                "--audio-root",
                args.audio_root,
                "--out",
                args.out,
                "--skip-transcribe",
                "--humanize",
                "--force-llm",
                "--humanize-from",
                "transcript",
                "--llm-provider",
                "ollama",
                "--ollama-model",
                args.ollama_model,
                "--ollama-timeout",
                str(args.ollama_timeout),
                "--max-llm-retries",
                str(args.max_llm_retries),
                "--only-sight",
                sight_id,
                "--only-lang",
                src_lang,
                "--only-variant",
                variant,
            ]
        )
        if rc != 0:
            return rc

    for sight_id, lang, variant in sorted(mixed):
        if lang == "en":
            continue
        rc = run_pipeline(
            [
                "--audio-root",
                args.audio_root,
                "--out",
                args.out,
                "--skip-transcribe",
                "--translate",
                "--force-llm",
                "--humanize-from",
                "transcript",
                "--strict-language",
                "--llm-provider",
                "ollama",
                "--ollama-model",
                args.ollama_model,
                "--ollama-timeout",
                str(args.ollama_timeout),
                "--translate-chunk-chars",
                str(args.translate_chunk_chars),
                "--max-llm-retries",
                str(args.max_llm_retries),
                "--target-langs",
                lang,
                "--only-sight",
                sight_id,
                "--only-lang",
                "en",
                "--only-variant",
                variant,
            ]
        )
        if rc != 0:
            return rc

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
