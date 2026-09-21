/**
 * Server-only utilities for the audio pipeline (FFmpeg detection,
 * WAV conversion, Python/faster-whisper checks, temp file management).
 */

import { execFile } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

import { env } from "@/lib/ai/env";

const execFileP = promisify(execFile);

export const WORK_DIR = path.resolve(
  /* turbopackIgnore: true */ process.cwd(),
  env.audioWorkDir,
);

export const PYTHON_JS = "transcribe.py";
export const TRANSCRIBE_SCRIPT = path.join(process.cwd(), "scripts", PYTHON_JS);

const ALLOWED_EXT = new Set([
  ".mp3", ".wav", ".m4a", ".mp4", ".ogg", ".flac", ".aac", ".webm",
]);

export function ensureWorkDir() {
  mkdirSync(WORK_DIR, { recursive: true });
  mkdirSync(path.join(WORK_DIR, "uploads"), { recursive: true });
}

export function allowedAudio(name: string): boolean {
  return ALLOWED_EXT.has(path.extname(name).toLowerCase());
}

export function maxUploadBytes(): number {
  return env.maxAudioMb * 1024 * 1024;
}

/** Locate an FFmpeg binary: env → PATH → Python imageio-ffmpeg bundle. */
export async function findFfmpeg(): Promise<string | null> {
  if (env.ffmpegPath) {
    if (existsSync(env.ffmpegPath)) return env.ffmpegPath;
    return null;
  }
  try {
    const { stdout } = await execFileP("ffmpeg", ["-version"], {
      windowsHide: true,
      timeout: 8000,
    });
    if (stdout.includes("ffmpeg version")) return "ffmpeg";
  } catch {
    // not on PATH — continue
  }
  for (const name of ["ffmpeg.exe", "ffmpeg"]) {
    const bin = path.join(process.cwd(), "bin", name);
    if (existsSync(bin)) return bin;
  }
  // Python bundle (imageio-ffmpeg ships a real ffmpeg binary)
  try {
    const { stdout } = await execFileP(
      pythonInterpreter(),
      ["-c", "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"],
      { windowsHide: true, timeout: 15000 },
    );
    const p = stdout.trim().split("\n").pop() ?? "";
    if (p && existsSync(/* turbopackIgnore: true */ p)) return p;
  } catch {
    // python or bundle missing
  }
  return null;
}

export async function isPythonAvailable(): Promise<boolean> {
  try {
    await execFileP(pythonInterpreter(), ["--version"], {
      windowsHide: true,
      timeout: 8000,
    });
    return true;
  } catch {
    return false;
  }
}

export async function isFasterWhisperAvailable(): Promise<boolean> {
  try {
    await execFileP(
      pythonInterpreter(),
      ["-c", "import faster_whisper"],
      { windowsHide: true, timeout: 20000 },
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * True when THIS host can actually run local Whisper transcription.
 * Serverless/edge hosts (Vercel, Netlify, Lambda) have no Python, so uploads
 * there must fail fast with a clear message instead of creating a job that
 * dies with `spawn python ENOENT`. A host that DOES ship Python (your machine,
 * a VPS, or Render via the repo's Dockerfile) reports ready.
 */
export async function transcriptionBackendReady(): Promise<{
  ready: boolean;
  reason?: string;
}> {
  if (!(await isPythonAvailable())) {
    return {
      ready: false,
      reason:
        "This host has no Python, so the local Whisper engine cannot run here. " +
        "It needs Python + faster-whisper on the same machine: run the app " +
        "locally, on a VPS, or on Render using this repo's Dockerfile / " +
        "render.yaml (serverless hosts like Vercel and Netlify cannot).",
    };
  }
  if (!(await isFasterWhisperAvailable())) {
    return {
      ready: false,
      reason:
        "faster-whisper is not installed on this server. Install it with:\n" +
        "  pip install faster-whisper\n" +
        "and restart. Audio transcription runs locally on the host that has it.",
    };
  }
  return { ready: true };
}

/**
 * Speaker diarization availability: pyannote.audio installed AND a HF token
 * present (PYANNOTE_AUTH_TOKEN / HUGGINGFACE_API_KEY / HF_TOKEN). This is the
 * honest signal the UI uses to enable the "Speaker labels" option.
 */
export async function isDiarizationReady(): Promise<{
  installed: boolean;
  tokenConfigured: boolean;
}> {
  const tokenConfigured = Boolean(
    env.pyanoteAuthToken ||
      env.huggingfaceApiKey ||
      process.env.HF_TOKEN,
  );
  try {
    await execFileP(
      pythonInterpreter(),
      ["-c", "import pyannote.audio"],
      { windowsHide: true, timeout: 25000 },
    );
    return { installed: true, tokenConfigured };
  } catch {
    return { installed: false, tokenConfigured };
  }
}

/* ------------------------------------------------ YouTube (via yt-dlp) -- */

export const YOUTUBE_WORK_DIR = path.join(WORK_DIR, "youtube");

/** Locate yt-dlp: env → PATH. Returns the executable string or null. */
export async function findYtDlp(): Promise<string | null> {
  if (env.ytdlpPath) {
    if (existsSync(env.ytdlpPath)) return env.ytdlpPath;
    return null;
  }
  try {
    const { stdout } = await execFileP("yt-dlp", ["--version"], {
      windowsHide: true,
      timeout: 8000,
    });
    if (stdout.trim()) return "yt-dlp";
  } catch {
    // not on PATH
  }
  return null;
}

export async function isYtDlpAvailable(): Promise<boolean> {
  return (await findYtDlp()) !== null;
}

/**
 * Download the best available audio track of a YouTube URL into the temp
 * work dir and return the local file path. Conversion to WAV happens later
 * with FFmpeg, so any container yt-dlp picks (m4a/webm/opus…) is fine.
 */
export async function downloadYoutubeAudio(
  url: string,
  ytDlp: string,
  jobId: string,
): Promise<string> {
  mkdirSync(YOUTUBE_WORK_DIR, { recursive: true });
  const outPattern = path.join(YOUTUBE_WORK_DIR, `${jobId}.%(ext)s`);
  await execFileP(
    ytDlp,
    [
      "-f", "bestaudio/best",
      "--no-playlist",
      "--no-warnings",
      "--no-progress",
      "-o", outPattern,
      "--", url,
    ],
    {
      windowsHide: true,
      timeout: 15 * 60 * 1000,
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  const match = readdirSync(YOUTUBE_WORK_DIR).find((n) =>
    n.startsWith(`${jobId}.`),
  );
  if (!match) {
    throw new Error(
      "yt-dlp finished but produced no audio file. The video may be unavailable or region-locked.",
    );
  }
  return path.join(YOUTUBE_WORK_DIR, match);
}

/** True for supported YouTube URL forms (host check only, no network I/O). */
export function isYoutubeUrl(value: string): boolean {
  try {
    const host = new URL(value.trim()).hostname.toLowerCase();
    return (
      host === "youtube.com" ||
      host === "www.youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "youtu.be" ||
      host.endsWith(".youtube.com")
    );
  } catch {
    return false;
  }
}

/** Normalise any supported input to 16 kHz mono WAV (required for Whisper). */
export async function convertToWav(
  inputPath: string,
  outputPath: string,
  ffmpeg: string,
): Promise<void> {
  await execFileP(
    ffmpeg,
    ["-y", "-i", inputPath, "-ac", "1", "-ar", "16000", "-vn", outputPath],
    { windowsHide: true, timeout: 6 * 60 * 1000 },
  );
}

/** Seconds of a 16 kHz mono WAV based on the file size (rough, instant). */
export function estimateWavDurationSeconds(filePath: string): number {
  try {
    const size = statSync(filePath).size;
    // 16-bit mono 16 kHz = 32000 bytes/sec + 44-byte header
    return Math.max(0, (size - 44) / 32000);
  } catch {
    return 0;
  }
}

/** Remove all temp uploads older than the retention window (0 = all). */
export function cleanupWorkDir() {
  try {
    ensureWorkDir();
    const dir = path.join(WORK_DIR, "uploads");
    const keep = env.audioRetentionHours * 3600 * 1000;
    const now = Date.now();
    for (const name of readdirSync(dir)) {
      const p = path.join(dir, name);
      try {
        const age = now - statSync(p).mtimeMs;
        if (keep === 0 || age > keep) rmSync(p, { force: true });
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
}

export function pythonInterpreter(): string {
  return process.env.PYTHON_BIN ?? "python";
}