## Audio transcript + rewrite + translation pipeline

### Input folder layout

Put your audio files like this:

`audio/{lang}/{sightId}/{variant}.mp3`

Example:

- `audio/en/colosseum/quick.mp3`
- `audio/it/colosseum/deep.mp3`
- `audio/es/pantheon/kids.mp3`

Supported extensions: `.m4a`, `.mp3`, `.wav`, `.aac`

### Install

```bash
python -m venv .venv
.\.venv\Scripts\pip install -r tools/audio_pipeline/requirements.txt
```

If you want best transcription quality/speed, install FFmpeg and run on a machine with CUDA (optional).

### Run (transcribe only)

```bash
.\.venv\Scripts\python tools/audio_pipeline/pipeline.py --audio-root audio --out out/transcripts
```

### Run (transcribe + rewrite + translate)

Set your API key:

```bash
set OPENAI_API_KEY=YOUR_KEY
set OPENAI_MODEL=gpt-4o-mini
```

Then:

```bash
.\.venv\Scripts\python tools/audio_pipeline/pipeline.py --audio-root audio --out out/transcripts --rewrite --translate
```

### Make scripts more human + re-translate (LLM-only, no Whisper)

If you already have JSON transcripts and want a more natural, human narration plus translations in all supported languages:

```bash
.\.venv\Scripts\python tools/audio_pipeline/pipeline.py --audio-root audio --out out/transcripts --skip-transcribe --humanize --translate --force-llm
```

### Use a local model (no API key) via Ollama

1) Install Ollama and run it (Windows/macOS/Linux).

2) Pull a model:

```bash
ollama pull llama3.1:8b
```

3) Run the pipeline using Ollama:

```bash
.\.venv\Scripts\python tools/audio_pipeline/pipeline.py --audio-root audio --out out/transcripts --skip-transcribe --humanize --translate --force-llm --llm-provider ollama --ollama-model llama3.1:8b
```

If you hit timeouts on long tours, increase the timeout and translate in smaller chunks:

```bash
.\.venv\Scripts\python tools/audio_pipeline/pipeline.py --audio-root audio --out out/transcripts --skip-transcribe --humanize --translate --force-llm --humanize-from transcript --strict-language --llm-provider ollama --ollama-model llama3.1:8b --ollama-timeout 7200 --translate-chunk-chars 2000
```

If translations come out too short, increase the max generation length for Ollama:

```bash
.\.venv\Scripts\python tools/audio_pipeline/pipeline.py --audio-root audio --out out/transcripts --skip-transcribe --translate --force-llm --llm-provider ollama --ollama-model llama3.1:8b --ollama-timeout 7200 --ollama-num-predict 4096 --translate-chunk-chars 1200
```

### Generate audio from exported scripts (TTS)

If you don't want to install Coqui TTS (Python version constraints), you can generate audio from the exported `.txt` scripts using `edge-tts`.

Install:

```bash
.\.venv\Scripts\python -m pip install edge-tts
```

Generate audio (writes mp3 files):

```bash
.\.venv\Scripts\python tools/audio_pipeline/tts_edge.py --in out/tts_scripts --out out/tts_audio --ext mp3 --concurrency 2
```

### Coqui XTTS (offline-ish, requires Python 3.11 + PyTorch)

Coqui TTS does not currently support Python 3.14. Use a dedicated Python 3.11 virtual environment for XTTS.

Create an env with pip:

```bash
uv python install 3.11
uv venv --python 3.11 --seed .venv_tts
```

Install PyTorch + Torchaudio (CPU wheels):

```bash
.\.venv_tts\Scripts\python -m pip install --upgrade pip
.\.venv_tts\Scripts\python -m pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
```

Install Coqui (pinned):

```bash
.\.venv_tts\Scripts\python -m pip install -r tools/audio_pipeline/requirements_tts_coqui.txt
```

Generate WAVs:

```bash
.\.venv_tts\Scripts\python tools/audio_pipeline/tts_coqui.py --in out/tts_scripts --out out/tts_audio_coqui --speaker-wav reference_voice.wav --agree-cpml
```

### Output

For each track:

`out/transcripts/{sightId}/{lang}/{variant}.json`

This file includes:

- `transcript.text` (raw transcript)
- `rewritten` (optional)
- `translations` (optional)

### Export scripts to a separate folder (for TTS)

This extracts `script_human` + `translations_human` into plain `.txt` files, ready to feed into any text-to-speech system.

Export layout (default):

`out/tts_scripts/{lang}/{sightId}/{variant}.txt`

Run:

```bash
.\.venv\Scripts\python tools/audio_pipeline/export_texts.py --in out/transcripts --out out/tts_scripts
```

Example output:

- `out/tts_scripts/en/colosseum/deep.txt`
- `out/tts_scripts/it/colosseum/deep.txt`
- `out/tts_scripts/ja/vatican-pinacoteca/deep.txt`

### QA + cleanup

Run an automatic sanity-check for script issues (mixed alphabets/scripts, generic meta-intros):

```bash
.\.venv\Scripts\python tools/audio_pipeline/validate_tts_scripts.py --root out/tts_scripts --out out/tts_scripts/_qa_report.json
```

Clean existing JSON scripts in-place (removes mixed alphabets for each target language and replaces generic English meta-intros with the raw transcript):

```bash
.\.venv\Scripts\python tools/audio_pipeline/clean_json_scripts.py --root out/transcripts
```

If you are using Ollama and want to automatically re-run fixes for flagged files:

```bash
.\.venv\Scripts\python tools/audio_pipeline/fix_from_qa.py --qa out/tts_scripts/_qa_report.json
```
