import { badRequest, clientIp, json } from "@/lib/api/generate-route";
import { env } from "@/lib/ai/env";
import { rateLimit } from "@/lib/ai/ratelimit";
import { isYoutubeUrl, isYtDlpAvailable, transcriptionBackendReady } from "@/lib/audio/ffmpeg";
import { startTranscribe } from "@/lib/audio/transcribe";

export const runtime = "nodejs";
export const maxDuration = 300; // background pipeline may take minutes

/**
 * POST JSON:
 *   url        — YouTube link (youtube.com / youtu.be / music.youtube.com)
 *   language   — auto|te|en|hi|ta|kn|ml (default auto)
 *   mode       — speech|song (default speech)
 *   maxChars   — subtitle line length target
 *   model      — tiny|base|small|medium|large-v3
 *   translateTo — optional 2-letter target language for bilingual subtitles
 *   diarize    — boolean, request speaker labels
 *
 * Responds immediately with a jobId; poll /api/audio/status/[jobId].
 * Requires yt-dlp on the server (checked here before a job is started).
 */
export async function POST(req: Request) {
  const rl = rateLimit(
    `audio:${clientIp(req)}`,
    Math.max(2, Math.floor(env.rateLimitMax / 4)),
    env.rateLimitWindowMs,
  );
  if (!rl.ok) {
    return json(
      { ok: false, error: "Too many transcription jobs. Try again soon." },
      429,
    );
  }

  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }
  const p = (parsed ?? {}) as Record<string, unknown>;
  const url = typeof p.url === "string" ? p.url.trim().slice(0, 400) : "";
  if (!url) return badRequest("`url` is required.");
  if (!isYoutubeUrl(url)) {
    return badRequest("That does not look like a YouTube URL (youtube.com / youtu.be).");
  }
  // Fail fast on hosts that can't run local Whisper (serverless/edge).
  const backend = await transcriptionBackendReady();
  if (!backend.ready) {
    return json(
      { ok: false, error: backend.reason ?? "Audio transcription is unavailable on this host." },
      503,
    );
  }
  if (!(await isYtDlpAvailable())) {
    return json({
      ok: false,
      error:
        "yt-dlp was not found on this server, so it cannot download YouTube " +
        "audio. Install it (pip install yt-dlp) and restart — or deploy the " +
        "app on Render with this repo's Dockerfile, which includes it.",
    }, 503);
  }

  const language = String(p.language ?? "auto").slice(0, 16) || "auto";
  const mode = String(p.mode ?? "speech") === "song" ? "song" : "speech";
  const maxChars = Math.min(200, Math.max(10, Number(p.maxChars) || 60));
  const modelRaw = String(p.model ?? env.whisperModel);
  const model = ["tiny", "base", "small", "medium", "large-v3"].includes(modelRaw)
    ? modelRaw
    : env.whisperModel;
  const translateTo = String(p.translateTo ?? "").slice(0, 8).toLowerCase();
  const diarize = p.diarize === true || p.diarize === "true" || p.diarize === "1";

  const { jobId } = startTranscribe({
    language,
    mode,
    maxChars,
    model,
    source: "url",
    url,
    translateTo,
    diarize,
  });

  return json({ ok: true, jobId }, 202);
}