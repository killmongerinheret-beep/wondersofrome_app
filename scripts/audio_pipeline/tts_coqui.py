import argparse
import json
import os
import shutil
import wave
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple


@dataclass(frozen=True)
class ScriptFile:
    lang: str
    sight_id: str
    variant: str
    path: str


def iter_script_files(root: str) -> List[ScriptFile]:
    out: List[ScriptFile] = []
    for dirpath, _dirnames, filenames in os.walk(root):
        for fn in filenames:
            if not fn.lower().endswith(".txt"):
                continue
            full = os.path.join(dirpath, fn)
            rel = os.path.relpath(full, root).replace("\\", "/")
            parts = rel.split("/")
            if len(parts) < 3:
                continue
            lang = parts[0]
            sight_id = parts[1]
            variant = os.path.splitext(parts[2])[0]
            out.append(ScriptFile(lang=lang, sight_id=sight_id, variant=variant, path=full))
    out.sort(key=lambda x: (x.lang, x.sight_id, x.variant))
    return out


def read_text(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read().strip()


def ensure_dir(p: str) -> None:
    os.makedirs(p, exist_ok=True)


def split_into_chunks(text: str, max_chars: int) -> List[str]:
    t = text.replace("\r\n", "\n").replace("\r", "\n").strip()
    if not t:
        return []
    if max_chars <= 0 or len(t) <= max_chars:
        return [t]
    paras = [p.strip() for p in t.split("\n\n") if p.strip()]
    chunks: List[str] = []
    buf = ""
    for p in paras:
        candidate = p if not buf else (buf + "\n\n" + p)
        if len(candidate) <= max_chars:
            buf = candidate
            continue
        if buf:
            chunks.append(buf)
            buf = ""
        if len(p) <= max_chars:
            buf = p
        else:
            start = 0
            while start < len(p):
                chunks.append(p[start : start + max_chars])
                start += max_chars
    if buf:
        chunks.append(buf)
    return chunks


def concat_wavs(inputs: List[str], output_path: str) -> None:
    if not inputs:
        raise ValueError("No wav inputs to concatenate.")
    params: Optional[Tuple[int, int, int, int, str, str]] = None
    ensure_dir(os.path.dirname(output_path))
    with wave.open(output_path, "wb") as out_wav:
        for i, p in enumerate(inputs):
            with wave.open(p, "rb") as w:
                if i == 0:
                    params = w.getparams()
                    out_wav.setparams(params)
                else:
                    if params is None:
                        raise ValueError("Missing wav params.")
                    if w.getnchannels() != params[0] or w.getsampwidth() != params[1] or w.getframerate() != params[2]:
                        raise ValueError("WAV format mismatch across chunks.")
                frames = w.readframes(w.getnframes())
                out_wav.writeframes(frames)


def out_path(out_root: str, item: ScriptFile) -> str:
    return os.path.join(out_root, item.lang, item.sight_id, f"{item.variant}.wav")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="input_root", default=os.path.join("out", "tts_scripts"))
    ap.add_argument("--out", dest="output_root", default=os.path.join("out", "tts_audio_coqui"))
    ap.add_argument("--model", default="tts_models/multilingual/multi-dataset/xtts_v2")
    ap.add_argument("--speaker-wav", default="")
    ap.add_argument("--gpu", action="store_true")
    ap.add_argument("--overwrite", action="store_true")
    ap.add_argument("--max-chars", type=int, default=1800)
    ap.add_argument("--agree-cpml", action="store_true")
    ap.add_argument("--only-lang", default="")
    ap.add_argument("--only-sight", default="")
    ap.add_argument("--only-variant", default="")
    args = ap.parse_args()

    speaker_wav = args.speaker_wav.strip() or None
    if args.agree_cpml:
        os.environ["COQUI_TOS_AGREED"] = "1"
    if os.environ.get("COQUI_TOS_AGREED", "").strip() != "1":
        raise SystemExit(
            "XTTS requires accepting Coqui's CPML terms (or a commercial license). "
            "Re-run with --agree-cpml after you have read and agree to the CPML license."
        )

    if shutil.which("ffmpeg") is None:
        raise SystemExit(
            "FFmpeg was not found on PATH. TorchCodec needs FFmpeg DLLs for audio I/O on Windows. "
            "Install an FFmpeg 'full-shared' build and add its bin/ folder to PATH, then re-run."
        )

    files = iter_script_files(args.input_root)
    if args.only_lang.strip():
        files = [f for f in files if f.lang == args.only_lang.strip()]
    if args.only_sight.strip():
        files = [f for f in files if f.sight_id == args.only_sight.strip()]
    if args.only_variant.strip():
        files = [f for f in files if f.variant == args.only_variant.strip()]
    if not files:
        raise SystemExit("No input .txt scripts found for the given filters.")

    try:
        from TTS.api import TTS
    except Exception as e:
        raise SystemExit(f"Failed to import Coqui TTS. Install torch+torchaudio and coqui-tts. Error: {e}")

    tts = TTS(args.model, gpu=bool(args.gpu))

    ok = 0
    skipped = 0
    failed = 0
    errors: List[Dict] = []

    for item in files:
        dst = out_path(args.output_root, item)
        if (not args.overwrite) and os.path.exists(dst):
            skipped += 1
            continue

        text = read_text(item.path)
        chunks = split_into_chunks(text, args.max_chars)
        if not chunks:
            failed += 1
            errors.append({"in": item.path, "out": dst, "error": "empty_text"})
            continue

        chunk_dir = os.path.join(args.output_root, "_chunks", item.lang, item.sight_id, item.variant)
        ensure_dir(chunk_dir)
        wavs: List[str] = []
        try:
            for idx, chunk in enumerate(chunks):
                chunk_out = os.path.join(chunk_dir, f"{idx+1:03d}.wav")
                tts.tts_to_file(text=chunk, speaker_wav=speaker_wav, language=item.lang, file_path=chunk_out)
                wavs.append(chunk_out)
            concat_wavs(wavs, dst)
            ok += 1
        except Exception as e:
            failed += 1
            errors.append({"in": item.path, "out": dst, "error": str(e)})

    ensure_dir(args.output_root)
    with open(os.path.join(args.output_root, "_tts_manifest.json"), "w", encoding="utf-8") as f:
        json.dump(
            {"inputRoot": args.input_root, "outputRoot": args.output_root, "ok": ok, "skipped": skipped, "failed": failed, "errors": errors},
            f,
            ensure_ascii=False,
            indent=2,
        )

    print(json.dumps({"ok": ok, "skipped": skipped, "failed": failed, "outputRoot": args.output_root}, ensure_ascii=False, indent=2))
    return 0 if failed == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
