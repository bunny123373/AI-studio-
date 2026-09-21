# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────────────────────
# BALU AI STUDIO — image that CAN run the audio pipeline.
#
# Unlike a serverless host (Vercel/Netlify, no Python), this image contains the
# real local transcription stack: Python + faster-whisper + FFmpeg + yt-dlp.
# That is what makes Audio → SRT — including YouTube links and long uploads —
# work on a public URL with no third-party speech API and no API key.
#
# Local use:
#   docker build -t balu-ai-studio .
#   docker run --rm -p 3000:3000 --env-file .env.local balu-ai-studio
#
# Deploy: use render.yaml (Render builds this file for you).
# ─────────────────────────────────────────────────────────────────────────────

############################  build  ############################
FROM node:22-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

###########################  runtime  ###########################
FROM node:22-bookworm-slim AS runner
WORKDIR /app

# NODE_ENV          — production server
# PORT / HOSTNAME   — Render (and Docker) route traffic to this port
# PYTHON_BIN        — the app shells out to `python`; Debian only ships `python3`
# AUDIO_WORK_DIR    — temp uploads/audio, deliberately outside the app dir
# HF_HOME           — where faster-whisper caches downloaded models
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    PYTHON_BIN=python3 \
    AUDIO_WORK_DIR=/tmp/balu-audio \
    HF_HOME=/var/hf-cache

# FFmpeg: audio conversion (any input → 16 kHz mono WAV).
# Python: the transcription backend.
# libgomp1: required by ctranslate2, the inference engine behind faster-whisper.
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      ffmpeg \
      python3 \
      python3-pip \
      libgomp1 \
      ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Free, open-source local engines — no API keys involved.
#   faster-whisper  speech → text with word-level timestamps
#   yt-dlp          pull the audio track from a YouTube link
#   imageio-ffmpeg  bundled ffmpeg fallback
RUN pip3 install --no-cache-dir --break-system-packages \
      faster-whisper \
      yt-dlp \
      imageio-ffmpeg

RUN mkdir -p /var/hf-cache /tmp/balu-audio

# Standalone server + its runtime assets (see output:"standalone" in
# next.config.ts). `public/` is intentionally absent from this repo.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# The Python backend is spawned from <cwd>/scripts at runtime.
COPY --from=builder /app/scripts ./scripts

EXPOSE 3000
CMD ["node", "server.js"]
