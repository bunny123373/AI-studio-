/**
 * Server-side transcription runner: Node orchestrates FFmpeg + the Python
 * faster-whisper backend. Runs as a background job so the UI never blocks.
 */

import { execFile } from "node:child_process";
import { mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import {
  cleanupWorkDir,
  convertToWav,
  ensureWorkDir,
  estimateWavDurationSeconds,
  findFfmpeg,
  pythonInterpreter,
  TRANSCRIBE_SCRIPT,
  WORK_DIR,
} from "@/lib/audio/ffmpeg";
import { createJob, getJob, updateJob, type AudioJob } from "@/lib/audio/jobs";
import { uid } from "@/lib/utils";

const execFileP = promisify(execFile);

export interface TranscribeOptions {
  language: string; // auto | te | en | hi | ta | kn | ml
  mode: "speech" | "song";
  maxChars: number;
  model: string; // tiny|base|small|medium|large-v3
  fileName: string;
  fileData: Uint8Array;
}

/** Serialise heavy Whisper jobs so the server never runs two at once. */
let queue: Promise<unknown> = Promise.resolve();
function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const next = queue.then(fn);
  queue = next.catch(() => undefined);
  return next;
}

export function startTranscribe(opts: TranscribeOptions): { jobId: string } {
  const jobId = uid("job");
  createJob(jobId);
  updateJob(jobId, {
    stage: "uploading",
    progress: 5,
    message: "Upload received.",
  });
  enqueue(() => runPipeline(jobId, opts)).catch(() => undefined);
  return { jobId };
}

async function runPipeline(jobId: string, opts: TranscribeOptions) {
  ensureWorkDir();
  const safeDir = path.join(WORK_DIR, "uploads");
  mkdirSync(safeDir, { recursive: true });
  const base =
    path.basename(opts.fileName).replace(/[^\w.\-\u0080-\uFFFF]/g, "_") ||
    "audio";
  const ext = path.extname(base) || ".wav";
  const inputPath = path.join(safeDir, `${jobId}_in${ext}`);
  const wavPath = path.join(safeDir, `${jobId}.wav`);

  try {
    await writeFile(inputPath, Buffer.from(opts.fileData));
    updateJob(jobId, {
      stage: "extracting",
      progress: 15,
      message: "Extracting audio...",
    });

    const ffmpeg = await findFfmpeg();
    let audioPath = inputPath;
    if (ffmpeg) {
      const converted = await convertToWav(inputPath, wavPath, ffmpeg)
        .then(() => true)
        .catch(() => false);
      if (converted) {
        audioPath = wavPath;
        updateJob(jobId, { progress: 35, message: "Audio normalised." });
      } else if (ext.toLowerCase() !== ".wav") {
        throw new Error(
          "Could not convert the audio. The file may be corrupted or the format is unsupported.",
        );
      }
    } else if (ext.toLowerCase() !== ".wav") {
      throw new Error(
        "FFmpeg was not found and this format needs it. Install FFmpeg (see README) and restart.",
      );
    } else {
      updateJob(jobId, { progress: 35, message: "Using WAV directly." });
    }

    updateJob(jobId, {
      stage: "detecting",
      progress: 40,
      message:
        opts.language === "auto"
          ? "Detecting language..."
          : `Transcribing in ${opts.language.toUpperCase()}...`,
    });

    updateJob(jobId, {
      stage: "transcribing",
      progress: 50,
      message: `Transcribing with faster-whisper (model: ${opts.model}) — the first run may download the model...`,
    });

    const { stdout, stderr } = await execFileP(
      pythonInterpreter(),
      [
        TRANSCRIBE_SCRIPT,
        "--input", audioPath,
        "--lang", opts.language,
        "--mode", opts.mode,
        "--max-chars", String(opts.maxChars),
        "--model", opts.model,
      ],
      {
        windowsHide: true,
        timeout: 30 * 60 * 1000,
        maxBuffer: 64 * 1024 * 1024,
        env: {
          ...process.env,
          // Force strict UTF-8 in the Python child on Windows (stdout pipes
          // otherwise inherit the console codepage and mangle non-ASCII).
          PYTHONIOENCODING: "utf-8",
          PYTHONUTF8: "1",
        },
      },
    );

    let payload: {
      ok?: boolean;
      error?: string;
      language?: string;
      duration?: number;
      segments?: { start: number; end: number; text: string }[];
    };
    try {
      payload = JSON.parse(stdout);
    } catch {
      throw new Error(
        "The transcription backend returned invalid output.\n" +
          (stderr || "No details.").slice(0, 800),
      );
    }

    if (!payload.ok || !payload.segments) {
      throw new Error(payload.error ?? "Transcription failed.");
    }

    const segments = payload.segments.filter(
      (s) =>
        Number.isFinite(s.start) &&
        Number.isFinite(s.end) &&
        typeof s.text === "string" &&
        s.text.length > 0,
    );
    if (segments.length === 0) {
      throw new Error(
        "No speech was detected in the audio. Try a louder recording, or choose Song mode for music.",
      );
    }

    updateJob(jobId, {
      stage: "timing",
      progress: 85,
      message: "Creating timestamps...",
    });
    updateJob(jobId, {
      stage: "srt",
      progress: 92,
      message: "Generating SRT...",
    });

    const duration =
      payload.duration && payload.duration > 0
        ? payload.duration
        : estimateWavDurationSeconds(wavPath);

    updateJob(jobId, {
      stage: "complete",
      progress: 100,
      message: "Complete.",
      result: {
        language: payload.language ?? opts.language,
        duration,
        segments,
        model: opts.model,
      },
    });
  } catch (err) {
    updateJob(jobId, {
      stage: "error",
      progress: 100,
      message: "Failed.",
      error:
        err instanceof Error ? err.message : "Unknown transcription error.",
    });
  } finally {
    cleanupWorkDir();
  }
}

export function getJobState(jobId: string): AudioJob | undefined {
  return getJob(jobId);
}