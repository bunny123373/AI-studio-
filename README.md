# BALU AI STUDIO 🎬

**Create More. For Free.**

A production-ready, free-first AI Creator Studio — images, YouTube thumbnails,
lyrics, captions, scripts, SEO, video prompts, Bible content, translation and
**real audio → SRT subtitles** running locally with faster-whisper.

> Built with Next.js 15 (App Router), TypeScript, Tailwind CSS v4 and a
> hand-rolled shadcn-style UI. Black + red SaaS theme. No fake generation —
> template engines, free providers and clear setup messages only.

---

## ✨ 13 Tools

| Tool | Page | How it works |
| --- | --- | --- |
| Dashboard | `/` | Overview + Quick Create |
| AI Image | `/image` | Free keyless image generation (Pollinations.ai by default) |
| Thumbnail | `/thumbnail` | Concept + 16:9 image generation |
| Lyrics | `/lyrics` | Offline template engine, 6 languages, 10 song types (natural Telugu) |
| Captions | `/captions` | Captions + hashtags + CTA per platform |
| YouTube | `/youtube` | 10 titles, description, tags, hook, pinned comment |
| Scripts | `/scripts` | Hook → intro → main content → voice-over → CTA |
| SEO | `/seo` | SEO title, meta, keywords, tags (rankings not guaranteed) |
| Video Prompts | `/prompts` | Scene-by-scene AI video prompts |
| Bible | `/bible` | Stories, verse explanations, songs, prayers, sermons (never invents quotes) |
| Translator | `/translate` | 6 Indian languages — needs an AI provider (honest empty state without one) |
| Audio → SRT | `/audio-to-srt` | **Real local transcription** with faster-whisper + editable synced subtitles |
| Prompt Library | `/library` | 60+ ready prompts |
| History | `/history` | Recent generations, saved in your browser |
| Settings | `/settings` | Provider status + setup instructions |

Every template-powered tool works 100% offline with **zero API keys**.

---

## 🚀 Getting started

### Prerequisites

- **Node.js 18.18+** (built & tested on Node 24)
- **Python 3.9+** and **pip** — only needed for the Audio → SRT tool
  (faster-whisper). Everything else is pure Node.js.
- **FFmpeg** *(optional)* — only needed to convert MP3/M4A/MP4/etc. WAV files
  work without it. The app also auto-detects the ffmpeg binary bundled inside
  Python's `imageio_ffmpeg` package if present.

### Install & run

```bash
# 1. Install JS dependencies
npm install

# 2. Install the local transcription backend (Audio → SRT only)
pip install faster-whisper        # or: py -m pip install faster-whisper

# 3. (Optional but recommended for non-WAV audio)
winget install ffmpeg             # Windows  ·  brew install ffmpeg  ·  apt install ffmpeg

# 4. Run
npm run dev                       # http://localhost:3000
```

Other commands:

```bash
npm run lint        # eslint
npm run build       # production build
npm run start       # serve the production build
npm run typecheck   # tsc --noEmit
```

### Audio → SRT — first use

1. Open **Audio → SRT** — the page checks your setup (Python, faster-whisper, ffmpeg).
2. Drag in an MP3/WAV/M4A/MP4 (up to 200 MB), pick language / Speech vs Song mode /
   line length, and hit **Transcribe**.
3. The first run downloads the Whisper model (internet needed once, ~75 MB for `small`).
4. When it finishes you get an **editable subtitle table** (add / delete / split /
   merge lines), a synced media preview, and **Download .srt / .txt**.

> **Privacy:** transcription runs 100% locally — audio never leaves your machine.
> Temp uploads are deleted automatically (see `AUDIO_RETENTION_HOURS`).

---

## 🔑 Configuration (all optional)

Copy `.env.example` → `.env.local` and set what you need. **No key = the app still
works** (free template engine / free providers). Keys never reach the browser.

| Variable | Default | Purpose |
| --- | --- | --- |
| `AI_TEXT_PROVIDER` | `template` | `template` (offline) · `openai` · `gemini` · `none` |
| `OPENAI_API_KEY` | — | Any OpenAI-compatible API (OpenAI, Groq, DeepSeek, Ollama...) |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | Point at local models (LM Studio, vLLM...) |
| `OPENAI_MODEL` | `gpt-4o-mini` | Model name |
| `GEMINI_API_KEY` | — | Google Gemini (free tier) |
| `GEMINI_MODEL` | `gemini-1.5-flash` | Gemini model |
| `IMAGE_PROVIDER` | `pollinations` | `pollinations` (free, keyless) · `local` · `none` |
| `LOCAL_SD_URL` | `http://127.0.0.1:7860` | Local Stable Diffusion (AUTOMATIC1111 API) |
| `HUGGINGFACE_API_KEY` | — | Reserved for future HF endpoints |
| `WHISPER_MODEL` | `small` | `tiny` `base` `small` `medium` `large-v3` |
| `MAX_AUDIO_MB` | `200` | Max upload size |
| `AUDIO_WORK_DIR` | `./tmp-audio` | Temp working folder (git-ignored) |
| `AUDIO_RETENTION_HOURS` | `0` | Delete temp files after N hours (`0` = immediately) |
| `FFMPEG_PATH` | — | Force a specific ffmpeg binary |
| `RATE_LIMIT_MAX` | `40` | Requests per window per IP |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate-limit window |

### Swapping AI providers

The provider layer is swappable by design (`lib/ai/provider abstraction`):
`TextAIProvider` (`lib/ai/text/*`) and `ImageAIProvider` (`lib/ai/image/*`).
Add a new backend, switch on `AI_TEXT_PROVIDER` / `IMAGE_PROVIDER`, and every
tool picks it up automatically. Generated content is honestly labelled
**"Free template"** vs **"AI provider"** in the UI.

---

## 🧱 Project structure

```
app/                    # Pages + API routes (App Router)
  api/
    ai/                 # text + image generation endpoints
    audio/              # transcribe / status / srt / health
    thumbnail lyrics caption youtube script seo video-prompt bible translate settings
components/
  ui/                   # shadcn-style primitives (button, card, input, select...)
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

### Architecture notes

- **Background jobs:** transcription runs as an in-memory background job
  (`lib/audio/jobs.ts`); the UI polls `/api/audio/status/[id]`. Jobs are
  serialised so heavy Whisper models never run in parallel. The interface is
  ready to swap for Redis/BullMQ on multi-server setups.
- **SRT quality:** timestamps are `HH:MM:SS,mmm`, the builder enforces
  sequential numbering, `start < end`, UTF-8 text and **no overlaps**, and a
  validator double-checks every document the exporter writes.
- **Video duration** is computed from the decoded audio (no ffprobe dependency).

---

## ☁️ Deployment

Works anywhere Next.js runs (Vercel, Node servers, Docker). Notes:

- Set the same env vars in your host dashboard (Vercel: Settings → Environment
  Variables). Secrets stay server-side.
- The Audio → SRT tool keeps job state in **memory** and shells out to Python +
  FFmpeg on the same machine. For serverless, prefer a long-running Node host,
  a dedicated worker, or the Redis job-store swap. `MAX_AUDIO_MB`, model size
  and `AUDIO_WORK_DIR` give you the knobs to stay within host limits.
- Pronunciation/TTS is not bundled; speech samples for testing can be made with
  tools like `edge-tts` and fed straight into Audio → SRT.

---

## 🛠 Troubleshooting

- **`npm run build` dies with `Cannot find module for page: /_document`**
  (Windows). This is a known write-race in the page-data collection step:
  antivirus real-time scanning slows the worker's file writes and the build
  tries to `require()` a page file before it has been flushed. The codebase is
  fine — clear the state and rebuild:
  ```powershell
  Get-Process node | Stop-Process -Force   # stop any stray next dev/start
  cmd /c "rmdir /s /q .next"
  npm run build
  ```
  If it still trips, retry once — it consistently succeeds on a clean run.
- **Non-ASCII text in transcripts/uploads can be mangled** (Python prints to a
  Windows pipe using the console codepage). The app now forces strict UTF-8 on
  both sides (`PYTHONUTF8=1` in Node + `sys.stdout.reconfigure(encoding="utf-8")`
  in `scripts/transcribe.py`); upgrade if you edited either file and removed it.
- **Audio → SRT stays stuck on "Transcribing…"**: the first run downloads the
  Whisper model (internet needed once). Bigger models on CPU are slow — use
  `WHISPER_MODEL=tiny`/`base` for quick tests. The job is serialised, so one
  at a time.
- **FFmpeg not found**: WAV uploads work without it. For MP3/M4A/MP4, install
  FFmpeg (`winget install ffmpeg`) or let the app auto-detect the binary
  bundled with Python's `imageio-ffmpeg`. See `/settings`.

---

© 2026 Balu AI Studio — Create More. For Free.