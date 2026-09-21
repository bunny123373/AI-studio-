#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
BALU AI STUDIO — real speech/song → SRT transcription backend (upgraded).

Uses faster-whisper (free, open-source, runs locally — no API key).
Input must already be an audio file Whisper can read (16 kHz mono WAV is
prepared by the Node.js side with FFmpeg; the .wav path is passed here).

Word-level timestamps are ALWAYS requested so the UI can:
  * build sentence-aware, silence-trimmed subtitle cues (speech mode)
    or short natural lyric lines (song mode),
  * highlight each word as it is spoken (karaoke preview).

Optional speaker diarization labels "Speaker 1 / Speaker 2 / ..." via
pyannote.audio — only when --diarize is passed AND pyannote is installed
AND a Hugging Face token is set (PYANNOTE_AUTH_TOKEN / HUGGINGFACE_API_KEY /
HF_TOKEN; the pyannote/speaker-diarization-3.1 model is gated, accept its
terms first). If diarization cannot run, transcription still completes and
returns diarizeError + an honest notice instead of fake labels.

Output (single JSON document on stdout):
    {"ok": true, "language": "te", "detectedLanguage": "te",
     "languageConfidence": 0.97, "duration": 12.3,
     "segments": [{"start": 0.0, "end": 4.2, "text": "...",
                   "speaker": "Speaker 1"?,
                   "words": [{"text": "...", "start": 0.0, "end": 0.4}]}],
     "diarizeApplied": bool, "diarizeError": str?}
or, on failure: {"ok": false, "error": "..."}

`language` is what was used (the requested code, or the detected one for
auto). `detectedLanguage` + `languageConfidence` (0..1) are what whisper
heard, so the UI can show an honest "Detected: Telugu · 97%" chip and flag
when a requested language disagrees with detection.

Model download happens automatically on first use (needs internet once).

Usage:
  python scripts/transcribe.py --input audio.wav --lang te --mode song \
      --max-chars 40 --model small [--diarize]
"""
import argparse
import json
import os
import re
import sys

# Emit strict UTF-8 on stdout no matter what codepage the OS uses for pipes.
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="strict")
except Exception:
    pass

_SENTENCE_END = set(".!?।…")

# pyannote pipeline is expensive to load → cache it per process.
_DIARIZER = None


def err(msg: str) -> None:
    print(json.dumps({"ok": False, "error": msg}, ensure_ascii=False), flush=True)
    sys.exit(1)


def _diarizer_token() -> str:
    return (
        os.environ.get("PYANNOTE_AUTH_TOKEN")
        or os.environ.get("HUGGINGFACE_API_KEY")
        or os.environ.get("HF_TOKEN")
        or ""
    )


def load_diarizer():
    """Load (and cache) the pyannote diarization pipeline. Raises on failure."""
    global _DIARIZER
    if _DIARIZER is not None:
        return _DIARIZER
    try:
        from pyannote.audio import Pipeline  # type: ignore
    except Exception:
        raise RuntimeError(
            "pyannote.audio is not installed. For speaker labels run:\n"
            "  pip install pyannote.audio\n"
            "It is a heavier dependency (PyTorch) and is optional."
        )
    token = _diarizer_token()
    if not token:
        raise RuntimeError(
            "No Hugging Face token found. Set PYANNOTE_AUTH_TOKEN=... "
            "(or HUGGINGFACE_API_KEY) after accepting the terms of "
            "pyannote/speaker-diarization-3.1 on huggingface.co."
        )
    try:
        _DIARIZER = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-3.1", token=token
        )
    except Exception as exc:
        raise RuntimeError(f"Could not load the diarization model: {exc}")
    return _DIARIZER


def diarize(input_path: str):
    """Run diarization → sorted [(start, end, "Speaker N")] turns."""
    pipeline = load_diarizer()
    result = pipeline(input_path)
    raw: list[tuple[float, float, str]] = []
    for seg, _, label in result.itertracks(yield_label=True):
        raw.append((float(seg.start), float(seg.end), str(label)))
    raw.sort(key=lambda t: t[0])
    order: dict[str, str] = {}
    for _, _, label in raw:
        if label not in order:
            order[label] = f"Speaker {len(order) + 1}"
    return [(s, e, order[l]) for s, e, l in raw]


def speaker_at(turns, t: float):
    """Speaker label covering time t, else the nearest turn within 0.5 s."""
    for s, e, label in turns:
        if s <= t <= e:
            return label
    best_label = None
    best_d = 1e9
    for s, e, label in turns:
        d = min(abs(t - s), abs(t - e))
        if d < best_d:
            best_d = d
            best_label = label
    return best_label if best_d <= 0.5 else None


def clean_text(text: str, capitalize: bool) -> str:
    """Normalise subtitle text: spacing, punctuation, hallucination tokens."""
    s = text or ""
    s = re.sub(r"\[[^\]]{0,60}\]", "", s)            # [MUSIC] [BLANK_AUDIO] …
    s = re.sub(r"\s+", " ", s).strip()
    s = re.sub(r"\s+([,.;:!?।…])", r"\1", s)         # fix pre-punctuation gaps
    s = re.sub(r"([!?।])\1+", r"\1", s)              # collapse "!!!" → "!"
    s = re.sub(r"^[,;:.…\s]+", "", s)                # drop leading punctuation
    s = re.sub(r"\s+", " ", s).strip()
    s = re.sub(r"\s+([,.;:!?।…])", r"\1", s)
    if capitalize and s and s[0].isascii() and s[0].islower():
        # Sentence-style capitalisation only for real-case (Latin) scripts.
        # Indic scripts (Telugu, Hindi, Tamil, ...) and most other scripts
        # have no upper/lower case — leave native-script output untouched.
        s = s[0].upper() + s[1:]
    return s


def build_cues(mode: str, words, max_chars: int):
    """Group word tokens into subtitle cues.

    speech mode → sentence-aware: break at sentence-ending punctuation or a
    1 s pause, once a cue reaches ~12 chars; hard cap at max_chars.
    song mode → short lyric lines capped at max_chars; break on 1.2 s gaps.

    Cue boundaries are the first/last word timestamps, so lead-in and
    tail silence around each phrase is trimmed automatically.
    """
    cues: list[list[dict]] = []
    cur: list[dict] = []
    cur_len = 0
    prev_end: float | None = None

    def flush():
        nonlocal cur, cur_len
        if cur:
            cues.append(cur)
        cur, cur_len = [], 0

    for w in words:
        gap = (w["start"] - prev_end) if prev_end is not None else 0.0
        added = cur_len + (1 if cur else 0) + len(w["text"])
        boundary = bool(w["text"] and w["text"][-1] in _SENTENCE_END)
        if cur:
            if added > max_chars:
                flush()
            elif mode == "speech":
                if cur_len >= 12 and (boundary or gap > 1.0):
                    flush()
            else:  # song
                if cur_len >= 8 and gap > 1.2:
                    flush()
        cur.append(w)
        cur_len += (1 if len(cur) > 1 else 0) + len(w["text"])
        prev_end = w["end"]
    flush()

    out = []
    for ws in cues:
        text = clean_text(" ".join(w["text"] for w in ws), capitalize=(mode == "speech"))
        if not text:
            continue
        out.append(
            {
                "start": round(ws[0]["start"], 3),
                "end": round(ws[-1]["end"], 3),
                "text": text,
                "words": [
                    {"text": w["text"], "start": round(w["start"], 3), "end": round(w["end"], 3)}
                    for w in ws
                ],
            }
        )
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description="Whisper transcription backend")
    parser.add_argument("--input", required=True, help="audio file to transcribe")
    parser.add_argument("--lang", default="auto",
                        help="language code (ISO 639-1: te/en/hi/ta/kn/ml/... "
                        "any code faster-whisper supports) or auto")
    parser.add_argument("--mode", choices=["speech", "song"], default="speech")
    parser.add_argument("--max-chars", type=int, default=60,
                        help="target max characters per subtitle line")
    parser.add_argument("--model", default="small",
                        help="tiny/base/small/medium/large-v3")
    parser.add_argument("--diarize", action="store_true",
                        help="label speakers via pyannote (optional install)")
    args = parser.parse_args()

    if not os.path.isfile(args.input):
        err(f"Input file not found: {args.input}")

    try:
        from faster_whisper import WhisperModel  # type: ignore
    except Exception:
        err(
            "faster-whisper is not installed. Install it with:\n"
            "  pip install faster-whisper\n"
            "Or on Windows:  py -m pip install faster-whisper\n"
            "A Python with 64-bit support is required."
        )

    model_lang = None if args.lang == "auto" else args.lang
    try:
        model = WhisperModel(args.model, device="cpu", compute_type="int8")
    except Exception as exc:  # download failure / OOM / bad model name
        err(
            f"Could not load Whisper model '{args.model}': {exc}\n\n"
            "Fix: check the model name (tiny/base/small/medium/large-v3), "
            "make sure you have internet for the first download, and enough "
            "RAM. Inside Docker set TRANSFORMERS_CACHE to a writable volume."
        )

    try:
        segments_iter, info = model.transcribe(
            args.input,
            language=model_lang,
            vad_filter=(args.mode == "speech"),
            word_timestamps=True,
            condition_on_previous_text=True,
            beam_size=5,
        )
        total_dur = float(getattr(info, "duration", 0) or 0)
        # Stream REAL progress while segments decode (the iterator yields as
        # Whisper advances through the audio). Each event is one JSON line on
        # stderr — stdout stays reserved for the final JSON document.
        segments = []
        for segment in segments_iter:
            segments.append(segment)
            seg_end = float(getattr(segment, "end", 0) or 0)
            if total_dur > 0:
                pct = min(100.0, round(seg_end / total_dur * 100, 1))
                sys.stderr.write(
                    json.dumps({"evt": "progress", "pct": pct}) + "\n"
                )
                sys.stderr.flush()
    except Exception as exc:
        err(f"Transcription failed: {exc}")

    duration = float(getattr(info, "duration", 0) or 0)
    detected_lang = str(getattr(info, "language", args.lang) or "auto")
    language_confidence = float(getattr(info, "language_probability", 0.0) or 0.0)
    # language = what we told the model to use (requested, or detected for auto).
    used_lang = args.lang if args.lang != "auto" else detected_lang

    # Collect word-level tokens (probability filter removes heavy hallucinations).
    words: list[dict] = []
    for s in segments:
        for w in (getattr(s, "words", None) or []):
            text = (getattr(w, "word", "") or "").strip()
            if not text:
                continue
            prob = getattr(w, "probability", 1.0) or 0.0
            if prob < 0.1:
                continue
            try:
                words.append(
                    {
                        "text": text,
                        "start": float(w.start),
                        "end": float(w.end),
                    }
                )
            except Exception:
                continue

    if words:
        out = build_cues(args.mode, words, args.max_chars)
    else:
        # No word-level data (old model/cache) → fall back to segment cues.
        out = [
            {
                "start": float(s.start),
                "end": float(s.end),
                "text": clean_text(
                    (s.text or "").strip(),
                    capitalize=(args.mode == "speech"),
                ),
                "words": [],
            }
            for s in segments
            if (s.text or "").strip()
        ]

    diarize_applied = False
    diarize_error = None
    if args.diarize and out:
        try:
            turns = diarize(args.input)
            for cue in out:
                label = speaker_at(turns, (cue["start"] + cue["end"]) / 2)
                if label:
                    cue["speaker"] = label
            diarize_applied = True
        except Exception as exc:
            diarize_error = str(exc)

    print(
        json.dumps(
            {
                "ok": True,
                "language": used_lang,
                "detectedLanguage": detected_lang,
                "languageConfidence": round(language_confidence, 4),
                "duration": round(duration, 3),
                "segments": out,
                "diarizeApplied": diarize_applied,
                "diarizeError": diarize_error,
            },
            ensure_ascii=False,
        ),
        flush=True,
    )


if __name__ == "__main__":
    main()