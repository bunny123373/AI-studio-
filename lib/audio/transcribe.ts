/**
 * Server-side transcription runner: Node orchestrates FFmpeg (+ yt-dlp for
 * YouTube URLs) and the Python faster-whisper backend. Runs as a background
 * job so the UI never blocks.
 */

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";

import {
  cleanupWorkDir,
  convertToWav,
  downloadYoutubeAudio,
  ensureWorkDir,
  estimateWavDurationSeconds,
  findFfmpeg,
  findYtDlp,
  pythonInterpreter,
  TRANSCRIBE_SCRIPT,
  WORK_DIR,
} from "@/lib/audio/ffmpeg";
import { createJob, getJob, updateJob, type AudioJob, type TranscribeSegment } from "@/lib/audio/jobs";
import { translateCues } from "@/lib/audio/translate";
import { uid } from "@/lib/utils";

export interface TranscribeOptions {
  language: string; // auto | te | en | hi | ta | kn | ml
  mode: "speech" | "song";
  maxChars: number;
  model: string; // tiny|base|small|medium|large-v3
  source: "upload" | "url";
  /** Upload source: file name + bytes. */
  fileName?: string;
  fileData?: Uint8Array;
  /** URL source: YouTube link (requires yt-dlp). */
  url?: string;
  /** Bilingual subtitle target (e.g. "te") or "" for none. */
  translateTo?: string;
  /** Request speaker diarization labels (optional, needs pyannote). */
  diarize?: boolean;
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
    (opts.fileName ? path.basename(opts.fileName).replace(/[^\w.\-\u0080-\uFFFF]/g, "_") : "") ||
    "audio";
  const ext = path.extname(base) || ".wav";
  const inputPath = path.join(safeDir, `${jobId}_in${ext}`);
  const wavPath = path.join(safeDir, `${jobId}.wav`);

  try {
    /* -------------------------------------------------- acquire audio */
    let audioPath = inputPath;
    if (opts.source === "url") {
      updateJob(jobId, {
        stage: "downloading",
        progress: 10,
        message: "Downloading audio from YouTube...",
      });
      const ytDlp = await findYtDlp();
      if (!ytDlp) {
        throw new Error(
          "yt-dlp was not found. YouTube transcription needs it — install with:\n" +
            "  pip install yt-dlp    (or: winget install yt-dlp)\n" +
            "then restart the server. You can still upload files without it.",
        );
      }
      const downloaded = await downloadYoutubeAudio(opts.url ?? "", ytDlp, jobId);
      updateJob(jobId, {
        stage: "extracting",
        progress: 18,
        message: "Preparing audio...",
      });
      audioPath = downloaded;
    } else {
      await writeFile(inputPath, Buffer.from(opts.fileData ?? new Uint8Array()));
      updateJob(jobId, {
        stage: "extracting",
        progress: 15,
        message: "Extracting audio...",
      });
    }

    const ffmpeg = await findFfmpeg();
    if (ffmpeg) {
      const converted = await convertToWav(audioPath, wavPath, ffmpeg)
        .then(() => true)
        .catch(() => false);
      if (converted) {
        audioPath = wavPath;
        updateJob(jobId, { progress: 35, message: "Audio normalised." });
      } else if (ext.toLowerCase() !== ".wav" || opts.source === "url") {
        throw new Error(
          "Could not convert the audio. The file may be corrupted or the format is unsupported.",
        );
      }
    } else if (ext.toLowerCase() !== ".wav" || opts.source === "url") {
      throw new Error(
        "FFmpeg was not found and this format needs it. Install FFmpeg (see README) and restart.",
      );
    } else {
      updateJob(jobId, { progress: 35, message: "Using WAV directly." });
    }

    /* -------------------------------------------------- transcribe */
    updateJob(jobId, {
      stage: "detecting",
      progress: 40,
      message:
        opts.language === "auto"
          ? "Detecting language..."
          : `Transcribing in ${opts.language.toUpperCase()}...`,
    });

    const pythonArgs = [
      TRANSCRIBE_SCRIPT,
      "--input", audioPath,
      "--lang", opts.language,
      "--mode", opts.mode,
      "--max-chars", String(opts.maxChars),
      "--model", opts.model,
    ];
    if (opts.diarize) pythonArgs.push("--diarize");

    updateJob(jobId, {
      stage: "transcribing",
      progress: 50,
      message:
        `Transcribing with faster-whisper (model: ${opts.model})` +
        `${opts.diarize ? " + speaker diarization" : ""} — the first run may download the model...`,
    });

    /* ---------------------------------------------- run + stream real progress */
    const child = spawn(pythonInterpreter(), pythonArgs, {
      windowsHide: true,
      env: {
        ...process.env,
        // Force strict UTF-8 in the Python child on Windows (stdout pipes
        // otherwise inherit the console codepage and mangle non-ASCII).
        PYTHONIOENCODING: "utf-8",
        PYTHONUTF8: "1",
      },
    });

    const stdoutChunks: Buffer[] = [];
    let stderrBuf = "";
    let lastRounded = -1;
    let timedOut = false;

    // Hard kill after 40 minutes (mirrors the old execFile timeout).
    const killTimer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, 40 * 60 * 1000);

    // stdout stays the single JSON document; stderr carries {evt:progress}
    // NDJSON + incidental Whisper logs.
    child.stdout?.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
    child.stderr?.on("data", (chunk: Buffer) => {
      stderrBuf += chunk.toString("utf8");
      if (stderrBuf.length > 64 * 1024) {
        stderrBuf = stderrBuf.slice(-64 * 1024);
      }
      let nl: number;
      while ((nl = stderrBuf.indexOf("\n")) !== -1) {
        const line = stderrBuf.slice(0, nl).trim();
        stderrBuf = stderrBuf.slice(nl + 1);
        const m = /^\{"evt":"progress","pct":(\d+(?:\.\d+)?)\}$/.exec(line);
        if (!m) continue;
        const pct = Number(m[1]);
        const rounded = Math.round(pct);
        if (rounded === lastRounded) continue;
        lastRounded = rounded;
        updateJob(jobId, {
          stage: "transcribing",
          progress: Math.min(86, Math.round(52 + pct * 0.34)),
          message: `Transcribing with faster-whisper (model: ${opts.model}) — ${rounded}% of audio decoded…`,
        });
      }
    });

    const exitCode = await new Promise<number>((resolve) => {
      child.on("close", (code) => resolve(code ?? -1));
    });
    clearTimeout(killTimer);

    const stdout = Buffer.concat(stdoutChunks).toString("utf8");
    const stderr = stderrBuf.slice(0, 80_000);
    if (timedOut) {
      throw new Error("Transcription timed out after 40 minutes.");
    }
    if (exitCode !== 0) {
      // The Python backend prints {"ok":false,...} to stdout for known
      // failures (missing deps, model load…) — prefer that message.
      let known: { ok?: boolean; error?: string } | null = null;
      try {
        known = JSON.parse(stdout) as { ok?: boolean; error?: string };
      } catch {
        known = null;
      }
      if (known && known.ok === false && typeof known.error === "string") {
        throw new Error(known.error);
      }
      throw new Error(
        "The transcription backend exited unexpectedly.\n" +
          (stderr || `exit code ${exitCode}`),
      );
    }

    let payload: {
      ok?: boolean;
      error?: string;
      language?: string;
      detectedLanguage?: string;
      languageConfidence?: number;
      duration?: number;
      diarizeApplied?: boolean;
      diarizeError?: string;
      segments?: TranscribeSegment[];
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

    /* -------------------------------------------------- optional translation */
    const notices: string[] = [];
    const translatedTo = opts.translateTo?.trim() || "";
    if (translatedTo) {
      updateJob(jobId, {
        stage: "translating",
        progress: 88,
        message: `Translating ${segments.length} subtitle lines into ${translatedTo.toUpperCase()}...`,
      });
      const res = await translateCues(segments.map((s) => s.text), translatedTo);
      if (res.ok) {
        for (let i = 0; i < segments.length; i++) {
          if (res.translations[i]) segments[i].translation = res.translations[i];
        }
      } else {
        notices.push(res.error);
        updateJob(jobId, { progress: 88, message: "Translation skipped." });
      }
    }

    if (opts.diarize && !payload.diarizeApplied) {
      notices.push(
        payload.diarizeError ||
          "Speaker diarization did not run — labels were not added.",
      );
    }

    updateJob(jobId, {
      stage: "timing",
      progress: 92,
      message: "Creating timestamps...",
    });
    updateJob(jobId, {
      stage: "srt",
      progress: 96,
      message: "Generating subtitles...",
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
        detectedLanguage: payload.detectedLanguage || undefined,
        languageConfidence:
          typeof payload.languageConfidence === "number"
            ? payload.languageConfidence
            : undefined,
        duration,
        segments,
        model: opts.model,
        source: opts.source,
        url: opts.source === "url" ? opts.url : undefined,
        diarizeApplied: Boolean(payload.diarizeApplied),
        translatedTo: translatedTo || undefined,
        notice: notices.length ? notices.join(" ") : undefined,
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