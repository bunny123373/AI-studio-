#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
BALU AI STUDIO — real speech/song → SRT transcription backend.

Uses faster-whisper (free, open-source, runs locally — no API key).
Input must already be an audio file Whisper can read (16 kHz mono WAV is
prepared by the Node.js side with FFmpeg; the .wav path is passed here).

Output: a single JSON document on stdout:
    {"ok": true, "language": "te", "duration": 12.3,
     "segments": [{"start": 0.0, "end": 4.2, "text": "..."}]}
or, on failure: {"ok": false, "error": "..."}

Model download happens automatically on first use (needs internet once).
Set HF_HOME / faster_whisper cache location via environment variables.

Usage:
  python scripts/transcribe.py --input audio.wav --lang te --mode song \
      --max-chars 40 --model small
"""
import argparse
import json
import os
import sys

# Emit strict UTF-8 on stdout no matter what codepage the OS uses for pipes.
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="strict")
except Exception:
    pass


def err(msg: str) -> None:
    print(json.dumps({"ok": False, "error": msg}, ensure_ascii=False), flush=True)
    sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(description="Whisper transcription backend")
    parser.add_argument("--input", required=True, help="audio file to transcribe")
    parser.add_argument("--lang", default="auto",
                        help="language code (te/en/hi/ta/kn/ml) or auto")
    parser.add_argument("--mode", choices=["speech", "song"], default="speech")
    parser.add_argument("--max-chars", type=int, default=60,
                        help="target max characters per subtitle line (song mode)")
    parser.add_argument("--model", default="small",
                        help="tiny/base/small/medium/large-v3")
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
            word_timestamps=(args.mode == "song"),
            beam_size=5,
        )
        segments = list(segments_iter)
    except Exception as exc:
        err(f"Transcription failed: {exc}")

    duration = float(getattr(info, "duration", 0) or 0)
    detected_lang = str(getattr(info, "language", args.lang) or "auto")

    if args.mode == "speech":
        out = [
            {
                "start": float(s.start),
                "end": float(s.end),
                "text": (s.text or "").strip(),
            }
            for s in segments
            if (s.text or "").strip()
        ]
    else:
        # Song/lyrics mode: rebuild lines from word timestamps so lines are
        # short, natural phrases that respect the character limit.
        out = []
        words = []
        for s in segments:
            for w in (getattr(s, "words", None) or []):
                text = (getattr(w, "word", "") or "").strip()
                if text:
                    words.append(
                        {
                            "text": text,
                            "start": float(w.start),
                            "end": float(w.end),
                        }
                    )
        if not words:
            # no word-level data; fall back to segment boundaries
            out = [
                {
                    "start": float(s.start),
                    "end": float(s.end),
                    "text": (s.text or "").strip(),
                }
                for s in segments
                if (s.text or "").strip()
            ]
        else:
            line: list[str] = []
            line_start = None
            prev_end = None
            for w in words:
                if line_start is None:
                    line_start = w["start"]
                gap = (w["start"] - prev_end) if prev_end is not None else 0
                candidate_len = sum(len(t) for t in line) + len(line) - 1
                if (candidate_len + len(w["text"]) > args.max_chars or gap > 1.2) and line:
                    out.append(
                        {
                            "start": round(line_start, 3),
                            "end": round(prev_end or w["start"], 3),
                            "text": " ".join(line),
                        }
                    )
                    line = []
                    line_start = w["start"]
                line.append(w["text"])
                prev_end = w["end"]
            if line and line_start is not None and prev_end is not None:
                out.append(
                    {
                        "start": round(line_start, 3),
                        "end": round(prev_end, 3),
                        "text": " ".join(line),
                    }
                )

    print(
        json.dumps(
            {
                "ok": True,
                "language": detected_lang,
                "duration": round(duration, 3),
                "segments": out,
            },
            ensure_ascii=False,
        ),
        flush=True,
    )


if __name__ == "__main__":
    main()