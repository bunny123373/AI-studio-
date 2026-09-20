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

export const WORK_DIR = path.resolve(process.cwd(), env.audioWorkDir);

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
      "python",
      ["-c", "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"],
      { windowsHide: true, timeout: 15000 },
    );
    const p = stdout.trim().split("\n").pop() ?? "";
    if (p && existsSync(p)) return p;
  } catch {
    // python or bundle missing
  }
  return null;
}

export async function isPythonAvailable(): Promise<boolean> {
  try {
    await execFileP("python", ["--version"], {
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
      "python",
      ["-c", "import faster_whisper"],
      { windowsHide: true, timeout: 20000 },
    );
    return true;
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