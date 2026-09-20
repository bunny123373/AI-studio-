import { json } from "@/lib/api/generate-route";
import { textProviderConfig } from "@/lib/ai/text";
import { getImageProvider } from "@/lib/ai/image";
import { env } from "@/lib/ai/env";
import { isFasterWhisperAvailable, findFfmpeg } from "@/lib/audio/ffmpeg";

/** GET — which providers are configured. Never exposes secret values. */
export async function GET() {
  const text = textProviderConfig();
  const image = getImageProvider();
  const [ffmpeg, whisper] = await Promise.all([
    findFfmpeg(),
    isFasterWhisperAvailable(),
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
  });
}