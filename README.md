<div align="center">

# 🎬 BALU AI STUDIO

### Create More. For Free.

**The free-first AI creator studio** — images, thumbnails, lyrics, captions, scripts, SEO,
Bible content, translation, and **real local audio → SRT subtitles**. Zero API keys required.

<br/>

![Next.js](https://img.shields.io/badge/Next.js%2016%20App%20Router-000000?style=for-the-badge&logo=nextdotjs&logoColor=white&color=%23000)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![faster-whisper](https://img.shields.io/badge/faster--whisper-100%25%20Local-2F855A?style=for-the-badge&logo=openai&logoColor=white)
![No API keys](https://img.shields.io/badge/No%20API%20Keys%20Required-EF4444?style=for-the-badge)
![13 Tools](https://img.shields.io/badge/13%20AI%20Tools-111827?style=for-the-badge)

</div>

---

## ✨ What is BALU AI STUDIO?

A production-ready, open-source AI creator studio built for **creators who need
results without subscriptions**. Every tool works out of the box — no sign-up,
no API key, no cost. Templates and free providers power everything by default,
and optional AI backends (OpenAI, Gemini, local Stable Diffusion) can be added
in seconds when you want them.

> **No fake generation.** If a tool needs a provider it doesn't have, it tells
> you how to set one up — it never invents output. Template tools are honest
> too: generated content is labelled **"Free template"** or **"AI provider"**.

---

## 🚀 Highlights

| | |
| --- | --- |
| 🧠 **13 tools, one studio** | Images, thumbnails, lyrics, captions, YouTube packs, scripts, SEO, video prompts, Bible, translator, library, history, settings. |
| 🎤 **Real Audio → SRT** | faster-whisper transcription runs **100% locally** — your audio never leaves your machine. Upload or paste a **YouTube URL**; get sentence-aware, karaoke-synced, editable subtitles (SRT/VTT/TXT). |
| 🔓 **Free-first** | Dashboard, templates, library, history and settings work with **zero keys**. No locked features, no upsell walls. |
| 🔌 **Swappable AI providers** | Text (`lib/ai/text/*`) and image (`lib/ai/image/*`) providers are plug-in by design — OpenAI, Gemini, Pollinations.ai, local SD. |
| 🛡 **Honest by default** | SEO tools state clearly that suggestions don't guarantee rankings. The Bible tool never invents quotes. No placeholder buttons. |
| 🌐 **6 Indian languages** | Telugu, English, Hindi, Tamil, Kannada, Malayalam for lyrics and translation — natural, conversational Telugu output. |
| 🔒 **Private** | Keys live only server-side. Audio temp files are auto-deleted (`AUDIO_RETENTION_HOURS`). |

---

## 🧰 The 15 Pages

| Tool | Route | What it does |
| --- | --- | --- |
| Dashboard | `/` | Overview, stats and **Quick Create** (URL prefill) |
| AI Image | `/image` | Keyless image generation — Pollinations.ai by default, SD WebUI optional |
| Thumbnail | `/thumbnail` | Concept sheet + 16:9 image with **real text drawn in your language** (6 scripts, real fonts) + live generation timer |
| Lyrics | `/lyrics` | Offline template engine · 6 languages · 10 song types · **natural Telugu** |
| Captions | `/captions` | Captions + hashtags + CTA per platform |
| YouTube | `/youtube` | 10 titles, description, tags, hook + pinned comment |
| Scripts | `/scripts` | Hook → intro → main content → voice-over → CTA |
| SEO | `/seo` | Title, meta, keywords, tags (suggestions — rankings not guaranteed) |
| Video Prompts | `/prompts` | Scene-by-scene AI video prompts |
| Bible | `/bible` | Stories, verse explanations, songs, prayers, sermons — **no invented quotes** |
| Translator | `/translate` | 6 Indian languages · needs an AI provider (honest empty state without one) |
| Audio → SRT | `/audio-to-srt` | **Real local transcription** (upload or YouTube URL) + editable synced subtitles |
| Prompt Library | `/library` | 60+ ready-made prompts, one-click copy or open pre-loaded |
| History | `/history` | Every generation saved in your browser |
| Settings | `/settings` | Provider status + setup guides |

---

## 🎤 Audio → SRT (the flagship)

Upload an MP3, WAV, M4A or MP4 — or paste a **YouTube URL** — and get a
**real, timestamped transcript** powered by
[faster-whisper](https://github.com/SYSTRAN/faster-whisper), running
entirely on your machine.

- **Speech** and **Song** modes — song mode uses word-level timestamps
- **Sentence-aware cues** — whisper's fragmented segments are merged into
  natural sentences, punctuation is cleaned up, and lead-in/out silence is
  trimmed from every cue
- **Karaoke word sync** — each word carries its own timestamp and is
  highlighted live as the audio plays (great for lyrics editing)
- **~99 real languages, native script** — every language faster-whisper
  supports (Telugu, Hindi, Tamil, Kannada, Malayalam, Bengali, Urdu, Arabic,
  Chinese, …); output stays in the language's own script, untouched by
  Latin-only capitalisation
- **Honest auto-detect** — with Auto-detect the UI shows which language was
  actually heard and the confidence, and flags when your manual pick disagrees
  with whisper
- **Caption style presets** — Clean, Bold pop, Neon, Studio, YouTube (+
  Custom): text color, background, size and position with a **live
  word-by-word animated preview** synced to the playhead
- **Styled exports** — text color embedded into SRT (`<font>`) and VTT
  (`::cue`); background / size / position into VTT; preview-only animation
  stays out of the files so exports remain standards-compliant
- **YouTube URL → SRT** — paste any YouTube link, yt-dlp fetches the audio,
  and the same local pipeline transcribes it
- **Speaker labels (optional)** — pyannote.audio diarization marks each line
  `Speaker 1 / Speaker 2 / …` (needs a Hugging Face token; never faked)
- **Bilingual subtitles** — with a text AI provider configured, every line is
  auto-translated and you can export original, translation, or dual-line
- **Auto or manual language** (auto-detect + ~99 real languages, native script)
- **Whisper models** `tiny` → `base` → `small` (default) → `medium` → `large-v3`
- **Editable subtitle table** — add, delete, split (at word boundaries
  or the playhead), merge lines; edit timestamps, text, translations, speakers
- **Synced media preview** — click a line to jump the player
- **Export SRT / WebVTT / TXT** — layout + speaker-name options, UTF-8 BOM
  toggle for Windows players, copy the full file or plain transcript
- **SRT validator** — `HH:MM:SS,mmm`, sequential, UTF-8, **no overlaps**
- **Background jobs** — the UI never blocks; progress is polled
- **Privacy** — 100% local, temp uploads auto-cleaned

### First use

```bash
pip install faster-whisper          # core transcriber (required)
winget install ffmpeg               # optional: MP3/M4A/MP4; WAV works without it
pip install yt-dlp                  # optional: YouTube URL transcription
pip install pyannote.audio          # optional: speaker labels (heavy; PyTorch)
```

The first transcription downloads the Whisper model once (internet needed; ~75 MB
for `small`).

Bilingual subtitles need an AI text provider (`AI_TEXT_PROVIDER` + key — see
Configuration). Speaker labels additionally need a Hugging Face token
(`PYANNOTE_AUTH_TOKEN`) after accepting the terms of the gated model
`pyannote/speaker-diarization-3.1`. When a requirement is missing the UI says
so honestly — nothing is ever faked.

---

## ⚡ Quickstart

### Prerequisites

- **Node.js 20.9+** (built & tested on Node 24; Next.js 16 dropped Node 18)
- **Python 3.9+** — only for Audio → SRT. Everything else is pure Node.js.
- **FFmpeg** *(optional)* — non-WAV conversions; auto-detects Python's
  bundled `imageio_ffmpeg` binary.

### Install & run

```bash
# 1. JS dependencies
npm install

# 2. Local transcription backend (Audio → SRT only)
pip install faster-whisper

# 3. Run in dev mode (Turbopack by default on Next.js 16)
npm run dev            # → http://localhost:3000
```

Production:

```bash
npm run build && npm run start
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Production build (lint + type-check included) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript `tsc --noEmit` |

---

## 🔑 Configuration — all optional

Copy `.env.example` → `.env.local` and set what you need. **No key = the app
still works.** Keys never reach the browser.

### 🆓 Free AI model recipes (zero cost)

| Want | Recipe |
| --- | --- |
| **Local LLM (fully private, no keys)** | Install [Ollama](https://ollama.com) → `ollama pull llama3.2:3b` → set `AI_TEXT_PROVIDER=openai`, `OPENAI_BASE_URL=http://localhost:11434/v1`, `OPENAI_MODEL=llama3.2:3b`. No API key needed. |
| **Free cloud LLM (fast)** | [Groq](https://console.groq.com/keys) free tier → `OPENAI_BASE_URL=https://api.groq.com/openai/v1` + free key + a free model |
| **Gemini free tier** | [AI Studio key](https://aistudio.google.com/apikey) → `AI_TEXT_PROVIDER=gemini` + `GEMINI_API_KEY` |
| **OpenRouter `:free` models** | Key at [openrouter.ai](https://openrouter.ai/keys) → base `https://openrouter.ai/api/v1` + a `…:free` model |
| **Local Stable Diffusion** | `IMAGE_PROVIDER=local` + `LOCAL_SD_URL=http://127.0.0.1:7860` (AUTOMATIC1111) |
| **Images (free by default)** | Nothing to do — Pollinations.ai already powers `/image` & `/thumbnail` keyless. If the free tier is busy, add a **free** Quest-Pollen key at [enter.pollinations.ai](https://enter.pollinations.ai/keys) → `POLLINATIONS_API_KEY=sk_…` for the reliable endpoint |
| **Audio → SRT** | Nothing to do — faster-whisper runs locally and free |

Anything OpenAI-compatible works (Ollama, Groq, OpenRouter, LM Studio, vLLM,
DeepSeek…) — the provider is a plain `fetch` to `OPENAI_BASE_URL/chat/completions`.
If a provider fails at runtime the app **falls back to the template engine**, so
output always arrives.

| Variable | Default | Options / purpose |
| --- | --- | --- |
| `AI_TEXT_PROVIDER` | `template` | `template` (offline) · `openai` · `gemini` · `none` |
| `OPENAI_API_KEY` | — | Any OpenAI-compatible API (OpenAI, Groq, DeepSeek, Ollama…) |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | Point at local models (LM Studio, vLLM…) |
| `OPENAI_MODEL` | `gpt-4o-mini` | Model name |
| `GEMINI_API_KEY` | — | Google Gemini (free tier) |
| `GEMINI_MODEL` | `gemini-3.6-flash` | Gemini model |
| `IMAGE_PROVIDER` | `pollinations` | `pollinations` (free) · `local` · `none` |
| `POLLINATIONS_API_KEY` | *(empty)* | Optional free Pollinations key (`sk_…` from enter.pollinations.ai — reliable endpoint; without it the keyless free tier is used) |
| `LOCAL_SD_URL` | `http://127.0.0.1:7860` | Local Stable Diffusion (AUTOMATIC1111 API) |
| `HUGGINGFACE_API_KEY` | — | Reserved for future HF endpoints |
| `WHISPER_MODEL` | `small` | `tiny` `base` `small` `medium` `large-v3` |
| `MAX_AUDIO_MB` | `200` | Max upload size |
| `AUDIO_WORK_DIR` | `./tmp-audio` | Temp working folder (git-ignored) |
| `AUDIO_RETENTION_HOURS` | `0` | Keep temp files N hours (`0` = delete after each job) |
| `FFMPEG_PATH` | — | Force a specific ffmpeg binary |
| `YTDLP_PATH` | — | Force a specific yt-dlp binary (else auto-detected on PATH) |
| `PYANNOTE_AUTH_TOKEN` | — | HF token for optional speaker diarization |
| `RATE_LIMIT_MAX` | `40` | Requests per window per IP |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate-limit window |

### Swapping AI providers

Provider adapters live under `lib/ai/` and implement one interface each:

```
TextAIProvider   lib/ai/text/{templates,openai,gemini}.ts
ImageAIProvider  lib/ai/image/{pollinations,local}.ts
```

Add a backend, switch it on via `AI_TEXT_PROVIDER` / `IMAGE_PROVIDER`, and every
tool picks it up automatically. Output is honestly labelled
**“Free template”** vs **“AI provider”**.

---

## 🏗 Architecture

```
app/                    # Pages + API routes (App Router)
  api/
    ai/                 # text + image generation endpoints
    audio/              # transcribe / status / srt / health
    thumbnail lyrics caption youtube script seo video-prompt bible translate settings
components/
  ui/                   # shadcn-style primitives (button, card, input, select…)
  common/               # generators, output cards, page-specific clients
  layout/               # sidebar, mobile nav, app shell
lib/
  ai/                   # providers: text (openai/gemini/template) + image (pollinations/local)
  audio/                # ffmpeg detection, SRT builder/validator, job registry, pipeline
  storage/              # history (localStorage, DB-ready interface)
  api/                  # route helpers + rate limiting
scripts/
  transcribe.py         # faster-whisper backend (speech + song modes, word timestamps)
```

### Design notes

- **Background jobs** — transcription runs in a serialised in-memory queue
  (`lib/audio/jobs.ts`); the UI polls `/api/audio/status/[id]` so heavy Whisper
  models never block the request. The store interface is ready to swap for
  Redis/BullMQ on multi-server setups.
- **SRT quality** — `HH:MM:SS,mmm` timestamps, sequential numbering,
  `start < end`, UTF-8, **no overlaps** — enforced by the builder and double-checked
  by a validator on every export.
- **Zero ffprobe dependency** — video/audio duration is computed from the
  decoded WAV.
- **Windows-safe pipelines** — strict UTF-8 forced between Node and Python,
  ffmpeg auto-detection (PATH → env var → Python's bundled `imageio_ffmpeg`).

---

## ☁️ Deployment

Runs anywhere Next.js runs — Vercel, Node servers, Docker.

- Set the same env vars in your host dashboard (Vercel: *Settings → Environment
  Variables*). Secrets stay server-side.
- Audio → SRT keeps job state **in memory** and shells out to Python + FFmpeg on
  the same machine — prefer a long-running Node host or a dedicated worker, or
  swap in the Redis job store. `MAX_AUDIO_MB`, `WHISPER_MODEL` and
  `AUDIO_WORK_DIR` give you the knobs to stay within host limits.
- TTS is not bundled; for testing, synthesize speech (e.g. `edge-tts`) and feed
  it straight into Audio → SRT.

### Deploying to Vercel (free)

The `vercel.json` pins every API route to `maxDuration: 60` (Hobby-plan cap).
All image/text/thumbnail tools work — **Audio → SRT does not**, because
serverless hosts have no Python; the UI detects this from `/api/audio/health`
and the upload routes return a clear 503 instead of a doomed job. Keep that
tool on your local machine or a VPS.

Environment variables to add in Vercel (*Settings → Environment Variables*):

| Variable | Value | Purpose |
| --- | --- | --- |
| `AI_TEXT_PROVIDER` | `openai` (or `gemini`) | text AI for concepts/scripts/translation |
| `OPENAI_API_KEY` | your key | required for text AI (any OpenAI-compatible provider) — do **not** set `OPENAI_BASE_URL` to `localhost` on a hosted site |
| `IMAGE_PROVIDER` | `pollinations` | image generation (online; free tier with optional key) |
| `POLLINATIONS_API_KEY` | your key | reliable `gen.pollinations.ai` endpoint |
| (optional) | `GEMINI_API_KEY`, `HUGGINGFACE_API_KEY`, … | set to taste, see Configuration |

Deploy: push to GitHub → *vercel.com/new* → import the repo → add env vars →
Deploy. Or CLI: `npx vercel --prod` (logs in via browser once).

---

## 🛠 Troubleshooting

### `npm run build` fails with `Cannot find module for page: /_document` (Windows)

A known write-race in page-data collection: antivirus real-time scanning slows
worker file writes and the build requires a page file before it exists. The code
is fine — clear state and rebuild:

```powershell
Get-Process node | Stop-Process -Force   # stop stray next dev/start
cmd /c "rmdir /s /q .next"
npm run build
```

### Non-ASCII transcripts look mangled

Python on Windows pipes output in the console codepage. The app forces strict
UTF-8 on both sides (`PYTHONUTF8=1` in Node + `sys.stdout.reconfigure(encoding="utf-8")`
in `scripts/transcribe.py`).

### Audio → SRT stuck on “Transcribing…”

First run downloads the Whisper model (internet needed once). Bigger models on
CPU are slow — use `WHISPER_MODEL=tiny`/`base` for quick tests. Jobs are
serialised, so only one runs at a time.

### FFmpeg not found

WAV uploads work without it. For MP3/M4A/MP4 install FFmpeg
(`winget install ffmpeg`) or let the app auto-detect Python's bundled
`imageio-ffmpeg` binary. See `/settings`.

---

## 🤝 Contributing

PRs are welcome! Keep the same rules the project lives by:

- **Real functionality only** — no fake generation, no placeholder buttons
- Free-first — every new tool must work with zero API keys
- Honest UI — always label template vs AI output, never overpromise SEO

1. Fork & clone
2. `npm install && npm run lint && npm run build`
3. Push to your fork and open a pull request

---

<div align="center">

**© 2026 Balu AI Studio — Create More. For Free.** 🎬

Built with Next.js · TypeScript · Tailwind CSS · faster-whisper

</div>