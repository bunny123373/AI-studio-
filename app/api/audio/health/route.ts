import { json } from "@/lib/api/generate-route";
import {
  isFasterWhisperAvailable,
  findFfmpeg,
  isPythonAvailable,
} from "@/lib/audio/ffmpeg";
import { env } from "@/lib/ai/env";

/** GET — capability status for the audio pipeline (no secrets). */
export async function GET() {
  const [ffmpeg, python, fasterWhisper] = await Promise.all([
    findFfmpeg(),
    isPythonAvailable(),
    isFasterWhisperAvailable(),
  ]);
  return json({
    ok: true,
    ffmpeg: { found: Boolean(ffmpeg), path: ffmpeg ?? undefined },
    python: { found: python },
    fasterWhisper: { found: fasterWhisper },
    whisperModel: env.whisperModel,
    maxAudioMb: env.maxAudioMb,
  });
}