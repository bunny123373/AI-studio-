/**
 * Server-only access to environment variables.
 * NEVER import this from client components — secrets must stay on the server.
 *
 * In Next.js App Router, server code importing this file is tree-shaken out
 * of client bundles as long as client components never import it transitively.
 */
export const env = {
  textProvider: process.env.AI_TEXT_PROVIDER ?? "template",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiBaseUrl: (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, ""),
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  openrouterApiKey: process.env.OPENROUTER_API_KEY ?? "",
  openrouterBaseUrl: (
    process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1"
  ).replace(/\/$/, ""),
  openrouterModel:
    process.env.OPENROUTER_MODEL ?? "inclusionai/ling-3.0-flash-vl",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-3.6-flash",
  geminiImageModel: process.env.GEMINI_IMAGE_MODEL ?? "gemini-3.1-flash-image",
  imageProvider: process.env.IMAGE_PROVIDER ?? "gemini",
  pollinationsApiKey: process.env.POLLINATIONS_API_KEY ?? "",
  localSdUrl: (process.env.LOCAL_SD_URL ?? "http://127.0.0.1:7860").replace(/\/$/, ""),
  huggingfaceApiKey: process.env.HUGGINGFACE_API_KEY ?? "",
  huggingfaceBaseUrl: (
    process.env.HUGGINGFACE_BASE_URL ??
    "https://router.huggingface.co/hf-inference/models"
  ).replace(/\/$/, ""),
  huggingfaceImageModel:
    process.env.HUGGINGFACE_IMAGE_MODEL ??
      "stabilityai/stable-diffusion-3-medium-diffusers",
  whisperModel: process.env.WHISPER_MODEL ?? "small",
  maxAudioMb: Number(process.env.MAX_AUDIO_MB ?? 200),
  audioWorkDir: process.env.AUDIO_WORK_DIR ?? "./tmp-audio",
  audioRetentionHours: Number(process.env.AUDIO_RETENTION_HOURS ?? 0),
  ffmpegPath: process.env.FFMPEG_PATH ?? "",
  ytdlpPath: process.env.YTDLP_PATH ?? "",
  pyanoteAuthToken: process.env.PYANNOTE_AUTH_TOKEN ?? "",
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 40),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000),
};

export function isServer() {
  return typeof window === "undefined";
}