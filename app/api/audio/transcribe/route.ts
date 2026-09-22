import { badRequest, clientIp, json } from "@/lib/api/generate-route";
import { env } from "@/lib/ai/env";
import { rateLimit } from "@/lib/ai/ratelimit";
import {
  allowedAudio,
  maxUploadBytes,
  transcriptionBackendReady,
} from "@/lib/audio/ffmpeg";
import { startTranscribe, transcribeUploadWithCloud, type TranscribeOptions } from "@/lib/audio/transcribe";
import { cloudTranscriberConfigured } from "@/lib/audio/cloud-whisper";

export const runtime = "nodejs";
export const maxDuration = 300; // background pipeline may take minutes

/**
 * POST multipart/form-data:
 *   file      — audio file (mp3/wav/m4a/mp4/ogg/flac/aac/webm)
 *   language  — auto|te|en|hi|ta|kn|ml  (default auto)
 *   mode      — speech|song             (default speech)
 *   maxChars  — subtitle line length target (song mode)
 *   model     — tiny|base|small|medium|large-v3 (default WHISPER_MODEL)
 *   translateTo — optional 2-letter target language for bilingual subtitles
 *   diarize   — "1" to request speaker labels (needs pyannote.audio)
 *
 * Local engine (Python + faster-whisper): responds with a jobId; poll
 * /api/audio/status/[jobId].
 * Serverless hosts (no Python): with AI_TRANSCRIBER_API_KEY configured the
 * upload is transcribed synchronously through the cloud transcriber instead —
 * the response includes the completed `result` (engine: "cloud") directly.
 */
export async function POST(req: Request) {
  const rl = rateLimit(`audio:${clientIp(req)}`, Math.max(2, Math.floor(env.rateLimitMax / 4)), env.rateLimitWindowMs);
  if (!rl.ok) {
    return json({ ok: false, error: "Too many transcription jobs. Try again soon." }, 429);
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return badRequest("Expected multipart/form-data upload.");
  }

  const fileEntry = form.get("file");
  if (!(fileEntry instanceof File)) return badRequest("Missing `file` upload.");
  if (fileEntry.size === 0) return badRequest("The uploaded file is empty.");
  if (fileEntry.size > maxUploadBytes()) {
    return json(
      { ok: false, error: `File is too large. Maximum size is ${env.maxAudioMb} MB.` },
      413,
    );
  }
  if (!allowedAudio(fileEntry.name)) {
    return badRequest(
      "Unsupported file type. Use MP3, WAV, M4A, MP4, OGG, FLAC, AAC or WEBM.",
    );
  }

  const language = String(form.get("language") ?? "auto").slice(0, 16) || "auto";
  const modeRaw = String(form.get("mode") ?? "speech");
  const mode = modeRaw === "song" ? "song" : "speech";
  const maxChars = Math.min(
    200,
    Math.max(10, Number(form.get("maxChars")) || 60),
  );
  const modelRaw = String(form.get("model") ?? env.whisperModel);
  const model = ["tiny", "base", "small", "medium", "large-v3"].includes(modelRaw)
    ? modelRaw
    : env.whisperModel;
  const translateTo = String(form.get("translateTo") ?? "").slice(0, 8).toLowerCase();
  const diarize =
    String(form.get("diarize") ?? "") === "1" ||
    String(form.get("diarize") ?? "").toLowerCase() === "true";

  const buf = new Uint8Array(await fileEntry.arrayBuffer());
  const opts: TranscribeOptions = {
    language,
    mode,
    maxChars,
    model,
    source: "upload",
    fileName: fileEntry.name.slice(0, 200),
    fileData: buf,
    translateTo,
    diarize,
  };

  // Local engine available → background job on this host (the default).
  const backend = await transcriptionBackendReady();
  if (backend.ready) {
    const { jobId } = startTranscribe(opts);
    return json({ ok: true, jobId }, 202);
  }

  // No Python here (serverless) — fall back to the cloud transcriber if one is
  // configured, otherwise fail fast with the honest reason.
  if (cloudTranscriberConfigured()) {
    try {
      const result = await transcribeUploadWithCloud(opts);
      return json({ ok: true, engine: "cloud", result }, 200);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Cloud transcription failed.";
      return json({ ok: false, error: msg }, 502);
    }
  }

  const reason =
    (backend.reason ??
      "Audio transcription is unavailable on this host.") +
    " Or add a free AI_TRANSCRIBER_API_KEY (Groq, console.groq.com/keys) " +
    "to transcribe uploads in the cloud — no Python needed.";
  return json({ ok: false, error: reason }, 503);
}