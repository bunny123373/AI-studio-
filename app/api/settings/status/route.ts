import { json } from "@/lib/api/generate-route";
import { textProviderConfig } from "@/lib/ai/text";
import { getImageProvider } from "@/lib/ai/image";
import { env } from "@/lib/ai/env";
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
    image: { id: image.id, label: image.label, configured: image.configured },
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