import argparse
import asyncio
import json
import os
import shutil
import subprocess
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

import edge_tts


@dataclass(frozen=True)
class ScriptFile:
    lang: str
    sight_id: str
    variant: str
    path: str


VOICE_BY_LANG: Dict[str, str] = {
    "en": "en-US-JennyNeural",
    "it": "it-IT-ElsaNeural",
    "es": "es-ES-ElviraNeural",
    "fr": "fr-FR-DeniseNeural",
    "de": "de-DE-KatjaNeural",
    "pt": "pt-PT-RaquelNeural",
    "pl": "pl-PL-ZofiaNeural",
    "ru": "ru-RU-SvetlanaNeural",
    "ar": "ar-EG-SalmaNeural",
    "zh": "zh-CN-XiaoxiaoNeural",
    "ja": "ja-JP-NanamiNeural",
    "ko": "ko-KR-SunHiNeural",
}


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

def ffmpeg_concat_mp3(inputs: List[str], output_path: str) -> None:
    if not inputs:
        raise ValueError("No inputs to concatenate.")
    ffmpeg = shutil.which("ffmpeg")
    if ffmpeg is None:
        raise RuntimeError("ffmpeg not found on PATH. Required to concatenate chunked mp3 output.")
    ensure_dir(os.path.dirname(output_path))
    list_path = output_path + ".concat.txt"
    with open(list_path, "w", encoding="utf-8") as f:
        for p in inputs:
            f.write("file '" + p.replace("'", "'\\''") + "'\n")
    subprocess.check_call([ffmpeg, "-hide_banner", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list_path, "-c:a", "libmp3lame", "-q:a", "2", output_path])


def out_path(out_root: str, item: ScriptFile, ext: str) -> str:
    return os.path.join(out_root, item.lang, item.sight_id, f"{item.variant}.{ext}")


async def synth_one(
    item: ScriptFile,
    out_root: str,
    voice: str,
    ext: str,
    overwrite: bool,
    rate: str,
    volume: str,
    max_chars: int,
    sem: asyncio.Semaphore,
) -> Tuple[str, bool, Optional[str]]:
    async with sem:
        dst = out_path(out_root, item, ext)
        if (not overwrite) and os.path.exists(dst):
            return dst, False, None
        txt = read_text(item.path)
        if not txt:
            return dst, False, "empty_text"
        ensure_dir(os.path.dirname(dst))
        try:
            if ext != "mp3":
                return dst, False, "edge_tts_only_supports_mp3"
            chunks = split_into_chunks(txt, max_chars)
            if not chunks:
                return dst, False, "empty_text"
            if len(chunks) == 1:
                comm = edge_tts.Communicate(chunks[0], voice=voice, rate=rate, volume=volume)
                await comm.save(dst)
                return dst, True, None

            chunk_dir = os.path.join(out_root, "_chunks", item.lang, item.sight_id, item.variant)
            ensure_dir(chunk_dir)
            mp3s: List[str] = []
            for i, chunk in enumerate(chunks):
                part = os.path.join(chunk_dir, f"{i+1:03d}.mp3")
                comm = edge_tts.Communicate(chunk, voice=voice, rate=rate, volume=volume)
                await comm.save(part)
                mp3s.append(part)
            ffmpeg_concat_mp3(mp3s, dst)
            return dst, True, None
        except Exception as e:
            return dst, False, str(e)


async def main_async() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="input_root", default=os.path.join("out", "tts_scripts"))
    ap.add_argument("--out", dest="output_root", default=os.path.join("out", "tts_audio"))
    ap.add_argument("--ext", choices=["mp3", "wav"], default="mp3")
    ap.add_argument("--overwrite", action="store_true")
    ap.add_argument("--concurrency", type=int, default=2)
    ap.add_argument("--rate", default="+0%")
    ap.add_argument("--volume", default="+0%")
    ap.add_argument("--max-chars", type=int, default=1800)
    ap.add_argument("--only-lang", default="")
    ap.add_argument("--only-sight", default="")
    ap.add_argument("--only-variant", default="")
    args = ap.parse_args()

    only_lang = args.only_lang.strip()
    only_sight = args.only_sight.strip()
    only_variant = args.only_variant.strip()

    files = iter_script_files(args.input_root)
    if only_lang:
        files = [f for f in files if f.lang == only_lang]
    if only_sight:
        files = [f for f in files if f.sight_id == only_sight]
    if only_variant:
        files = [f for f in files if f.variant == only_variant]

    if not files:
        raise SystemExit("No input .txt scripts found for the given filters.")

    sem = asyncio.Semaphore(max(1, args.concurrency))
    ok = 0
    skipped = 0
    failed = 0
    errors: List[Dict] = []
    manifest: List[Dict] = []

    tasks = []
    for item in files:
        voice = VOICE_BY_LANG.get(item.lang)
        if not voice:
            failed += 1
            errors.append({"path": item.path, "lang": item.lang, "reason": "no_voice_mapping"})
            continue
        tasks.append(synth_one(item, args.output_root, voice, args.ext, args.overwrite, args.rate, args.volume, args.max_chars, sem))

    for coro in asyncio.as_completed(tasks):
        dst, wrote, err = await coro
        if err:
            failed += 1
            errors.append({"out": dst, "error": err})
            continue
        if wrote:
            ok += 1
        else:
            skipped += 1
        manifest.append({"out": dst})

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


def main() -> int:
    return asyncio.run(main_async())


if __name__ == "__main__":
    raise SystemExit(main())
