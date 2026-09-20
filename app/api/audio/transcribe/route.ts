import { badRequest, clientIp, json } from "@/lib/api/generate-route";
import { env } from "@/lib/ai/env";
import { rateLimit } from "@/lib/ai/ratelimit";
import {
  allowedAudio,
  maxUploadBytes,
} from "@/lib/audio/ffmpeg";
import { startTranscribe } from "@/lib/audio/transcribe";

export const runtime = "nodejs";
export const maxDuration = 300; // background pipeline may take minutes

/**
 * POST multipart/form-data:
 *   file      — audio file (mp3/wav/m4a/mp4/ogg/flac/aac/webm)
 *   language  — auto|te|en|hi|ta|kn|ml  (default auto)
 *   mode      — speech|song             (default speech)
 *   maxChars  — subtitle line length target (song mode)
 *   model     — tiny|base|small|medium|large-v3 (default WHISPER_MODEL)
 *
 * Responds immediately with a jobId; poll /api/audio/status/[jobId].
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

  const buf = new Uint8Array(await fileEntry.arrayBuffer());
  const { jobId } = startTranscribe({
    language,
    mode,
    maxChars,
    model,
    fileName: fileEntry.name.slice(0, 200),
    fileData: buf,
  });

  return json({ ok: true, jobId }, 202);
}