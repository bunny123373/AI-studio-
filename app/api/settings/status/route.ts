import { json } from "@/lib/api/generate-route";
import { textProviderConfig } from "@/lib/ai/text";
import { getImageProvider, getImageProviderFor } from "@/lib/ai/image";
import { env } from "@/lib/ai/env";
import { canSelectTextProvider, getRuntimeText } from "@/lib/ai/config";
import {
  isDiarizationReady,
  isFasterWhisperAvailable,
  findFfmpeg,
  isPythonAvailable,
  isYtDlpAvailable,
} from "@/lib/audio/ffmpeg";

/** GET — which providers are configured. Never exposes secret values. */
export async function GET() {
  const text = textProviderConfig();
  const image = getImageProvider();
  const [ffmpeg, whisper, ytDlp, diarization] = await Promise.all([
    findFfmpeg(),
    isFasterWhisperAvailable(),
    isYtDlpAvailable(),
    isDiarizationReady(),
  ]);
  return json({
    ok: true,
    text: text ?? { id: "none", configured: false },
    // Selectable text providers for the runtime switcher (keys stay in env).
    textOptions: [
      {
        id: "gemini",
        label: "Google Gemini",
        configured: canSelectTextProvider("gemini"),
        model: env.geminiModel,
      },
      {
        id: "openai",
        label: "OpenAI-compatible",
        configured: canSelectTextProvider("openai"),
        model: env.openaiModel,
      },
    ],
    runtime: getRuntimeText(),
    image: { id: image.id, label: image.label, configured: image.configured },
    // Image engines offered in the tools' "Image engine" picker (keys stay in env).
    imageOptions: [
      {
        id: "gemini",
        label: "Google Gemini (Nano Banana)",
        configured: getImageProviderFor("gemini").configured,
        model: env.geminiImageModel,
        note: "image models need their own quota — falls back to Pollinations when exhausted.",
      },
      {
        id: "huggingface",
        label: "Hugging Face (Inference Providers)",
        configured: getImageProviderFor("huggingface").configured,
        model: env.huggingfaceImageModel,
        note: "needs a free HUGGINGFACE_API_KEY token — falls back to Pollinations when missing.",
      },
      {
        id: "pollinations",
        label: "Pollinations.ai (free)",
        configured: getImageProviderFor("pollinations").configured,
        model: "flux",
        note: "free tier can be busy during peak hours.",
      },
    ],
    whisper: {
      configured: whisper,
      model: env.whisperModel,
      note: "faster-whisper runs locally (no API key).",
    },
    ffmpeg: { found: Boolean(ffmpeg) },
    python: { found: await isPythonAvailable() },
    ytDlp: { found: Boolean(ytDlp) },
    diarization: {
      installed: diarization.installed,
      tokenConfigured: diarization.tokenConfigured,
      ready: diarization.installed && diarization.tokenConfigured,
    },
    translation: {
      configured: Boolean(text && text.configured),
      provider: text?.label ?? "none",
    },
  });
}