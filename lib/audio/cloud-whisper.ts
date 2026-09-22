/**
 * Optional cloud transcription fallback for hosts that cannot run the local
 * faster-whisper engine (serverless: Vercel/Netlify/Lambda — no Python).
 *
 * Talks to any OpenAI-compatible `/audio/transcriptions` endpoint and defaults
 * to Groq's free Whisper API (`whisper-large-v3-turbo`), which accepts MP3,
 * WAV, M4A, MP4, OGG, FLAC, AAC and WEBM directly — so this path needs no
 * FFmpeg either.
 *
 * This is NEVER used when the local engine is available: local faster-whisper
 * is the default wherever Python exists, and every result is labelled with
 * which engine actually ran. We never fake a transcript.
 */

import { env } from "@/lib/ai/env";
import type { TranscribeSegment } from "@/lib/audio/jobs";

/** Hard ceiling for one cloud call — fits Hobby serverless limits (60s). */
const CLOUD_TIMEOUT_MS = 55_000;

const AUDIO_MIME: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".mp4": "audio/mp4",
  ".ogg": "audio/ogg",
  ".oga": "audio/ogg",
  ".flac": "audio/flac",
  ".aac": "audio/aac",
  ".webm": "audio/webm",
};

const round3 = (n: number) => Math.round(n * 1000) / 1000;

function mimeFor(name: string): string {
  const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
  return AUDIO_MIME[ext] ?? "application/octet-stream";
}

/** True when a cloud transcriber key + URL are configured. */
export function cloudTranscriberConfigured(): boolean {
  return Boolean(env.transcriberKey.trim() && env.transcriberUrl.trim());
}

/** Short display name for health/status UIs (never exposes the key). */
export function cloudTranscriberLabel(): string {
  try {
    const host = new URL(env.transcriberUrl).hostname;
    if (host === "api.groq.com") return "Groq Whisper";
    return `${host} Whisper`;
  } catch {
    return "Cloud Whisper";
  }
}

interface VerboseSegment {
  start?: number;
  end?: number;
  text?: string;
}

interface VerboseResponse {
  language?: string;
  duration?: number;
  segments?: VerboseSegment[];
  error?: { message?: string };
}

export interface CloudTranscribeInput {
  fileData: Uint8Array;
  fileName: string;
  /** auto | te | en | hi | … — passed to Whisper when not "auto". */
  language: string;
  /** Cloud model name, e.g. whisper-large-v3-turbo. */
  model: string;
}

export interface CloudTranscribeResult {
  /** 2-letter detected language code when the provider reports one. */
  detectedLanguage?: string;
  duration: number;
  segments: TranscribeSegment[];
}

/**
 * Transcribe an uploaded audio file via the configured OpenAI-compatible
 * endpoint (`verbose_json` → timed segments, same shape as the local engine).
 * Throws with an honest, actionable message on any failure.
 */
export async function transcribeWithCloudWhisper(
  input: CloudTranscribeInput,
): Promise<CloudTranscribeResult> {
  if (!cloudTranscriberConfigured()) {
    throw new Error("No cloud transcriber is configured (AI_TRANSCRIBER_API_KEY).");
  }

  const form = new FormData();
  form.append(
    "file",
    new Blob([input.fileData as BlobPart], { type: mimeFor(input.fileName) }),
    input.fileName,
  );
  form.append("model", input.model);
  form.append("response_format", "verbose_json");
  // Segment-level timestamps (what SRT needs). Word granules are omitted so the
  // request works on any OpenAI-compatible endpoint.
  form.append("timestamp_granularities[]", "segment");
  if (input.language && input.language !== "auto") {
    form.append("language", input.language);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLOUD_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(env.transcriberUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.transcriberKey}`,
      },
      body: form,
      signal: controller.signal,
      // Uploads up to MAX_AUDIO_MB behind us + the API call; keep it bounded.
      keepalive: true,
    });
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error(
        "Cloud transcription took longer than 55 s — the serverless limit. " +
          "Use a shorter clip, or deploy on Render for unlimited local Whisper.",
      );
    }
    const why = err instanceof Error ? err.message : "network error";
    throw new Error(
      `Could not reach the cloud transcriber: ${why}. Check AI_TRANSCRIBER_URL and your internet connection.`,
    );
  } finally {
    clearTimeout(timer);
  }

  let data: VerboseResponse;
  try {
    data = (await res.json()) as VerboseResponse;
  } catch {
    throw new Error(
      `The cloud transcriber returned a ${res.status} response that was not JSON. ` +
        "Check AI_TRANSCRIBER_URL points at an OpenAI-compatible /audio/transcriptions endpoint.",
    );
  }

  if (!res.ok) {
    const msg = data?.error?.message?.trim();
    const hint =
      res.status === 401 || res.status === 403
        ? " Check AI_TRANSCRIBER_API_KEY (free Groq key: console.groq.com/keys)."
        : res.status === 429
          ? " The provider is rate-limited — try again in a minute."
          : "";
    throw new Error(
      `Cloud transcription failed (${res.status}): ${msg || "unknown provider error"}.${hint}`,
    );
  }

  const rawSegments = data.segments ?? [];
  const segments: TranscribeSegment[] = rawSegments
    .filter(
      (s) =>
        Number.isFinite(s.start) &&
        Number.isFinite(s.end) &&
        typeof s.text === "string" &&
        s.text.trim().length > 0,
    )
    .map((s) => ({
      start: round3(Number(s.start)),
      end: round3(Number(s.end)),
      text: (s.text ?? "").trim(),
    }));

  if (segments.length === 0) {
    throw new Error(
      "No speech was detected in the audio. Try a louder recording, or choose Song mode for music.",
    );
  }

  const duration =
    Number.isFinite(data.duration) && (data.duration as number) > 0
      ? Number(data.duration)
      : segments[segments.length - 1].end;

  // Providers return the detected language as either a code ("te") or a full
  // name ("Telugu"); only surface the code form — the UI maps codes to labels.
  const lang = (data.language ?? "").trim().toLowerCase();
  const detectedLanguage = /^[a-z]{2}$/.test(lang) ? lang : undefined;

  return {
    detectedLanguage,
    duration: round3(duration),
    segments,
  };
}