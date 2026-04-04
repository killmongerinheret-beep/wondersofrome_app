import argparse
import json
import os
import time
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional, Tuple, Literal

import requests
from requests.exceptions import ConnectionError as RequestsConnectionError
from requests.exceptions import ReadTimeout as RequestsReadTimeout


@dataclass(frozen=True)
class AudioItem:
    sight_id: str
    lang: str
    variant: str
    path: str


def scan_audio(root_dir: str) -> List[AudioItem]:
    items: List[AudioItem] = []
    for dirpath, _dirnames, filenames in os.walk(root_dir):
        for fn in filenames:
            lower = fn.lower()
            if not (lower.endswith(".m4a") or lower.endswith(".mp3") or lower.endswith(".wav") or lower.endswith(".aac")):
                continue
            full = os.path.join(dirpath, fn)
            rel = os.path.relpath(full, root_dir)
            parts = rel.replace("\\", "/").split("/")
            if len(parts) < 3:
                continue
            lang = parts[-3]
            sight_id = parts[-2]
            variant = os.path.splitext(parts[-1])[0]
            items.append(AudioItem(sight_id=sight_id, lang=lang, variant=variant, path=full))
    items.sort(key=lambda x: (x.lang, x.sight_id, x.variant))
    return items


def transcribe_item(model: Any, item: AudioItem, language: Optional[str]) -> Dict:
    segments, info = model.transcribe(
        item.path,
        language=language,
        vad_filter=True,
        beam_size=5,
        temperature=0.0,
    )
    segs = []
    text_parts: List[str] = []
    for s in segments:
        segs.append(
            {
                "start": float(s.start),
                "end": float(s.end),
                "text": (s.text or "").strip(),
            }
        )
        if s.text:
            text_parts.append(s.text.strip())
    full_text = " ".join(text_parts).strip()
    return {
        "detected_language": getattr(info, "language", None),
        "duration": getattr(info, "duration", None),
        "segments": segs,
        "text": full_text,
    }


def openai_chat(api_key: str, model: str, system: str, user: str) -> str:
    resp = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={
            "model": model,
            "temperature": 0.4,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        },
        timeout=120,
    )
    resp.raise_for_status()
    data = resp.json()
    return data["choices"][0]["message"]["content"]


def ollama_chat(base_url: str, model: str, system: str, user: str, timeout_sec: int, num_predict: int) -> str:
    url = base_url.rstrip("/") + "/api/chat"
    try:
        resp = requests.post(
            url,
            headers={"Content-Type": "application/json"},
            json={
                "model": model,
                "stream": False,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                "options": {"temperature": 0.4, "num_predict": int(num_predict)},
            },
            timeout=(15, timeout_sec),
        )
    except RequestsConnectionError as e:
        raise SystemExit(
            "Cannot connect to Ollama. Start Ollama and make sure the server is running at "
            f"{base_url.rstrip('/')}. If needed, run: `ollama serve`.\n"
            f"Original error: {e}"
        )
    except RequestsReadTimeout as e:
        raise SystemExit(
            "Ollama request timed out. Increase --ollama-timeout and/or lower --translate-chunk-chars, "
            "or use a faster model.\n"
            f"Original error: {e}"
        )
    resp.raise_for_status()
    data = resp.json()
    msg = data.get("message") or {}
    return (msg.get("content") or "").strip()


LLMProvider = Literal["openai", "ollama"]


def llm_chat(
    provider: LLMProvider,
    *,
    openai_key: str,
    openai_model: str,
    ollama_url: str,
    ollama_model: str,
    ollama_timeout_sec: int,
    ollama_num_predict: int,
    system: str,
    user: str,
) -> str:
    if provider == "openai":
        return openai_chat(openai_key, openai_model, system, user).strip()
    return ollama_chat(ollama_url, ollama_model, system, user, ollama_timeout_sec, ollama_num_predict).strip()


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


def is_text_in_expected_script(lang: str, text: str, max_unexpected_ratio: float = 0.02) -> bool:
    expected = EXPECTED_SCRIPTS.get(lang)
    if not expected:
        return True
    total = 0
    unexpected = 0
    for ch in text:
        s = _script_of(ch)
        if not s:
            continue
        total += 1
        if s not in expected:
            unexpected += 1
    if total == 0:
        return True
    return (unexpected / total) <= max_unexpected_ratio


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


def looks_like_generic_meta_intro(lang: str, text: str) -> bool:
    if lang != "en":
        return False
    lower = text.strip().lower()
    if lower.startswith("this is a comprehensive audio guide"):
        return True
    if lower.startswith("this is a comprehensive audio tour"):
        return True
    if "some key takeaways" in lower:
        return True
    return False


def rewrite_script(api_key: str, model: str, lang: str, raw_transcript: str) -> str:
    system = (
        "You are an expert audio tour editor. Rewrite transcripts into engaging, natural audio-guide narration. "
        "Keep facts consistent; do not invent details; keep names/places accurate. "
        "Output only the rewritten script, no headings."
    )
    user = f"Language: {lang}\n\nTranscript:\n{raw_transcript}"
    return openai_chat(api_key, model, system, user).strip()


def humanize_script(api_key: str, model: str, lang: str, variant: str, script: str) -> str:
    system = (
        "You are a senior audio guide scriptwriter. Make the narration sound human and natural, not robotic. "
        "Keep facts identical; do not invent anything; keep names/places accurate. "
        "Write as spoken tour narration (not a summary, not a report). "
        "Do not use headings or bullet lists. "
        "Output only the improved script text."
    )
    user = f"Language: {lang}\nVariant: {variant}\n\nText:\n{script}"
    return openai_chat(api_key, model, system, user).strip()


    system = (
        "You are a professional translator for travel audio guides. "
        "Translate accurately with natural phrasing for native speakers and a human spoken tone. "
        "Keep proper nouns unchanged unless commonly localized. "
        "Output only the translation text, no headings."
    )
    user = f"Target language: {target_lang}\n\nText:\n{script}"
    return openai_chat(api_key, model, system, user).strip()


def rewrite_script_any(
    provider: LLMProvider,
    openai_key: str,
    openai_model: str,
    ollama_url: str,
    ollama_model: str,
    ollama_timeout_sec: int,
    ollama_num_predict: int,
    lang: str,
    raw_transcript: str,
) -> str:
    system = (
        "You are an expert audio tour editor. Rewrite transcripts into engaging, natural audio-guide narration. "
        "Keep facts consistent; do not invent details; keep names/places accurate. "
        "Output only the rewritten script, no headings."
    )
    user = f"Language: {lang}\n\nTranscript:\n{raw_transcript}"
    return llm_chat(
        provider,
        openai_key=openai_key,
        openai_model=openai_model,
        ollama_url=ollama_url,
        ollama_model=ollama_model,
        ollama_timeout_sec=ollama_timeout_sec,
        ollama_num_predict=ollama_num_predict,
        system=system,
        user=user,
    )


def humanize_script_any(
    provider: LLMProvider,
    openai_key: str,
    openai_model: str,
    ollama_url: str,
    ollama_model: str,
    ollama_timeout_sec: int,
    ollama_num_predict: int,
    lang: str,
    variant: str,
    script: str,
) -> str:
    system = (
        "You are a senior audio guide scriptwriter. Make the narration sound human, warm, and natural (not robotic). "
        "Keep facts identical; do not invent anything; keep names/places accurate. "
        "Write as spoken tour narration for a visitor on-site (not a summary, not a report). "
        "Do not add headings, bullet lists, or \"this is a comprehensive audio guide\" style meta-intros. "
        "If the text contains directions or steps, keep them. "
        "Output only the improved script text."
    )
    user = f"Language: {lang}\nVariant: {variant}\n\nText:\n{script}"
    return llm_chat(
        provider,
        openai_key=openai_key,
        openai_model=openai_model,
        ollama_url=ollama_url,
        ollama_model=ollama_model,
        ollama_timeout_sec=ollama_timeout_sec,
        ollama_num_predict=ollama_num_predict,
        system=system,
        user=user,
    )


def _split_into_chunks(text: str, chunk_chars: int) -> List[str]:
    if chunk_chars <= 0 or len(text) <= chunk_chars:
        return [text]
    paras = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks: List[str] = []
    buf = ""
    for p in paras:
        candidate = p if not buf else (buf + "\n\n" + p)
        if len(candidate) <= chunk_chars:
            buf = candidate
            continue
        if buf:
            chunks.append(buf)
            buf = ""
        if len(p) <= chunk_chars:
            buf = p
        else:
            start = 0
            while start < len(p):
                chunks.append(p[start : start + chunk_chars])
                start += chunk_chars
    if buf:
        chunks.append(buf)
    return chunks


def translate_script_any(
    provider: LLMProvider,
    openai_key: str,
    openai_model: str,
    ollama_url: str,
    ollama_model: str,
    ollama_timeout_sec: int,
    ollama_num_predict: int,
    target_lang: str,
    script: str,
    chunk_chars: int,
) -> str:
    system = (
        "You are a professional translator for travel audio guides. "
        "Translate accurately with natural phrasing for native speakers and a human spoken tone. "
        "Do not summarize. Do not omit anything. Translate every sentence. "
        "Keep paragraph breaks and pacing similar to the original. "
        "Keep proper nouns unchanged unless commonly localized. "
        "Output must be entirely in the target language (do not mix alphabets/scripts). "
        "If a name/term would normally stay in Latin letters, transliterate it instead (do not output Latin letters for non-Latin scripts). "
        "Output only the translation text, no headings."
    )
    chunks = _split_into_chunks(script, chunk_chars)
    out_parts: List[str] = []
    for idx, chunk in enumerate(chunks):
        min_ratio = 0.5
        if target_lang in ("zh",):
            min_ratio = 0.15
        elif target_lang in ("ja",):
            min_ratio = 0.2
        elif target_lang in ("ko",):
            min_ratio = 0.2
        elif target_lang in ("ar",):
            min_ratio = 0.3
        elif target_lang in ("ru",):
            min_ratio = 0.3

        user = f"Target language: {target_lang}\n\nText:\n{chunk}"
        translated = ""
        for attempt in range(3):
            translated = llm_chat(
                provider,
                openai_key=openai_key,
                openai_model=openai_model,
                ollama_url=ollama_url,
                ollama_model=ollama_model,
                ollama_timeout_sec=ollama_timeout_sec,
                ollama_num_predict=ollama_num_predict,
                system=system,
                user=user if attempt == 0 else (f"Target language: {target_lang}\n\nIMPORTANT: Do not summarize. Translate ALL content fully.\n\nText:\n{chunk}"),
            )
            if len(translated.strip()) >= int(len(chunk) * min_ratio) or len(chunk) < 600:
                break
        if len(chunks) > 1:
            translated = translated.strip()
        out_parts.append(translated)
    return "\n\n".join([p.strip() for p in out_parts if str(p).strip()]).strip()


def ensure_dir(p: str) -> None:
    os.makedirs(p, exist_ok=True)


def write_json(path: str, obj: Dict) -> None:
    ensure_dir(os.path.dirname(path))
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)


def read_json(path: str) -> Dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def group_by_sight(items: Iterable[AudioItem]) -> Dict[str, List[AudioItem]]:
    out: Dict[str, List[AudioItem]] = {}
    for it in items:
        out.setdefault(it.sight_id, []).append(it)
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--audio-root", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--whisper-model", default="large-v3")
    ap.add_argument("--device", default="cpu")
    ap.add_argument("--compute-type", default="int8")
    ap.add_argument("--force-language", default="")
    ap.add_argument("--llm-provider", choices=["openai", "ollama"], default="openai")
    ap.add_argument("--openai-key", default=os.getenv("OPENAI_API_KEY", ""))
    ap.add_argument("--openai-model", default=os.getenv("OPENAI_MODEL", "gpt-4o-mini"))
    ap.add_argument("--ollama-url", default=os.getenv("OLLAMA_URL", "http://localhost:11434"))
    ap.add_argument("--ollama-model", default=os.getenv("OLLAMA_MODEL", "llama3.1:8b"))
    ap.add_argument("--ollama-timeout", type=int, default=int(os.getenv("OLLAMA_TIMEOUT_SEC", "3600")))
    ap.add_argument("--ollama-num-predict", type=int, default=int(os.getenv("OLLAMA_NUM_PREDICT", "2048")))
    ap.add_argument("--rewrite", action="store_true")
    ap.add_argument("--humanize", action="store_true")
    ap.add_argument("--humanize-from", choices=["transcript", "rewritten_or_transcript"], default="rewritten_or_transcript")
    ap.add_argument("--translate", action="store_true")
    ap.add_argument("--target-langs", default="en,it,es,fr,de,pt,pl,ru,ar,zh,ja,ko")
    ap.add_argument("--translate-chunk-chars", type=int, default=2800)
    ap.add_argument("--skip-transcribe", action="store_true")
    ap.add_argument("--force-llm", action="store_true")
    ap.add_argument("--strict-language", action="store_true")
    ap.add_argument("--max-llm-retries", type=int, default=2)
    ap.add_argument("--only-sight", default="")
    ap.add_argument("--only-lang", default="")
    ap.add_argument("--only-variant", default="")
    args = ap.parse_args()

    items = scan_audio(args.audio_root)
    if not items:
        raise SystemExit("No audio files found under --audio-root with expected /{lang}/{sightId}/{variant}.m4a layout.")

    only_sight = args.only_sight.strip()
    only_lang = args.only_lang.strip()
    only_variant = args.only_variant.strip()
    if only_sight or only_lang or only_variant:
        items = [
            it
            for it in items
            if (not only_sight or it.sight_id == only_sight)
            and (not only_lang or it.lang == only_lang)
            and (not only_variant or it.variant == only_variant)
        ]

    print(f"Found {len(items)} audio files to process.")

    whisper_model: Optional[Any] = None
    if not args.skip_transcribe:
        try:
            from faster_whisper import WhisperModel
        except Exception as e:
            raise SystemExit(
                "Failed to import faster-whisper (used only for transcription). "
                "If you are using --skip-transcribe, this should not happen. "
                "Otherwise, your environment may be blocking the PyAV DLLs. "
                f"Original error: {e}"
            )
        print(f"Loading Whisper model '{args.whisper_model}' on {args.device}...")
        whisper_model = WhisperModel(args.whisper_model, device=args.device, compute_type=args.compute_type)
        print("Model loaded. Starting processing...\n")
    forced_lang = args.force_language.strip() or None

    targets = [x.strip() for x in args.target_langs.split(",") if x.strip()]
    do_llm = bool(args.rewrite or args.humanize or args.translate)
    provider: LLMProvider = args.llm_provider
    if do_llm and provider == "openai" and not args.openai_key.strip():
        raise SystemExit("Missing OpenAI key. Set OPENAI_API_KEY or pass --openai-key to use --rewrite/--humanize/--translate.")

    for it in items:
        base = os.path.join(args.out, it.sight_id, it.lang)
        out_path = os.path.join(base, f"{it.variant}.json")
        result: Dict
        t0 = time.time()

        if os.path.exists(out_path):
            result = read_json(out_path)
        else:
            if args.skip_transcribe:
                print(f"[{it.sight_id} | {it.lang} | {it.variant}] Missing JSON and --skip-transcribe was set. Skipping.")
                continue
            if not whisper_model:
                raise SystemExit("Whisper model not loaded.")
            print(f"[{it.sight_id} | {it.lang} | {it.variant}] Processing: {it.path}")
            raw = transcribe_item(whisper_model, it, forced_lang or it.lang)
            print(f"[{it.sight_id} | {it.lang} | {it.variant}] Transcription complete. Words: {len(raw.get('text', '').split())}")
            result = {
                "sightId": it.sight_id,
                "lang": it.lang,
                "variant": it.variant,
                "sourcePath": it.path,
                "transcript": raw,
            }

        transcript_obj = result.get("transcript")
        if isinstance(transcript_obj, dict):
            raw_text = str(transcript_obj.get("text") or "").strip()
        else:
            raw_text = ""

        if do_llm and raw_text:
            if args.rewrite and (args.force_llm or not str(result.get("rewritten") or "").strip()):
                print(f"[{it.sight_id}] Rewriting script...")
                result["rewritten"] = rewrite_script_any(
                    provider,
                    args.openai_key,
                    args.openai_model,
                    args.ollama_url,
                    args.ollama_model,
                    args.ollama_timeout,
                    args.ollama_num_predict,
                    it.lang,
                    raw_text,
                )

            if args.humanize_from == "transcript":
                base_script = raw_text
            else:
                base_script = str(result.get("rewritten") or raw_text).strip()
            if args.humanize and (args.force_llm or not str(result.get("script_human") or "").strip()):
                print(f"[{it.sight_id}] Humanizing script...")
                for attempt in range(max(1, args.max_llm_retries + 1)):
                    candidate = humanize_script_any(
                        provider,
                        args.openai_key,
                        args.openai_model,
                        args.ollama_url,
                        args.ollama_model,
                        args.ollama_timeout,
                        args.ollama_num_predict,
                        it.lang,
                        it.variant,
                        base_script if attempt == 1 else ("Do not summarize. Write tour narration.\n\n" + base_script),
                    )
                    if not looks_like_generic_meta_intro(it.lang, candidate):
                        result["script_human"] = candidate
                        break
                    if attempt == args.max_llm_retries:
                        result["script_human"] = candidate

            translate_src = str(result.get("script_human") or base_script).strip()
            if args.translate and translate_src:
                existing = result.get("translations_human") if result.get("script_human") else result.get("translations")
                existing = existing if isinstance(existing, dict) else {}
                translations: Dict[str, str] = dict(existing)
                missing_targets = [tl for tl in targets if tl != it.lang and (args.force_llm or not str(translations.get(tl) or "").strip())]
                if missing_targets:
                    print(f"[{it.sight_id}] Translating into {len(missing_targets)} languages...")
                    for tl in missing_targets:
                        print(f"[{it.sight_id}] -> {tl}")
                        out = ""
                        for attempt in range(max(1, args.max_llm_retries + 1)):
                            out = translate_script_any(
                                provider,
                                args.openai_key,
                                args.openai_model,
                                args.ollama_url,
                                args.ollama_model,
                                args.ollama_timeout,
                                args.ollama_num_predict,
                                tl,
                                translate_src,
                                args.translate_chunk_chars,
                            )
                            if not args.strict_language:
                                break
                            if is_text_in_expected_script(tl, out):
                                break
                            if attempt < args.max_llm_retries:
                                out = translate_script_any(
                                    provider,
                                    args.openai_key,
                                    args.openai_model,
                                    args.ollama_url,
                                    args.ollama_model,
                                    args.ollama_timeout,
                                    args.ollama_num_predict,
                                    tl,
                                    "IMPORTANT: Output must use only the target language script.\n\n" + translate_src,
                                    args.translate_chunk_chars,
                                )
                                if is_text_in_expected_script(tl, out):
                                    break
                        translations[tl] = out
                        if args.strict_language and not is_text_in_expected_script(tl, out):
                            translations[tl] = sanitize_to_expected_script(tl, out)
                        if result.get("script_human"):
                            result["translations_human"] = translations
                        else:
                            result["translations"] = translations
                        write_json(out_path, result)
                if result.get("script_human"):
                    result["translations_human"] = translations
                else:
                    result["translations"] = translations

        result["elapsedSec"] = round(time.time() - t0, 2)
        write_json(out_path, result)
        print(f"[{it.sight_id}] Saved to {out_path}\n")

    by_sight = group_by_sight(items)
    index = {
        "audioRoot": args.audio_root,
        "outputRoot": args.out,
        "sights": {sid: sorted({f"{x.lang}/{x.variant}" for x in its}) for sid, its in by_sight.items()},
    }
    write_json(os.path.join(args.out, "_index.json"), index)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
