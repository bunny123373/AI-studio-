import { json } from "@/lib/api/generate-route";
import {
  isDiarizationReady,
  isFasterWhisperAvailable,
  findFfmpeg,
  isPythonAvailable,
  isYtDlpAvailable,
} from "@/lib/audio/ffmpeg";
import { textProviderConfig, getTextProvider } from "@/lib/ai/text";
import { env } from "@/lib/ai/env";

/** GET — capability status for the audio pipeline (no secrets). */
export async function GET() {
  const [ffmpeg, python, fasterWhisper, ytDlp, diarization] = await Promise.all([
    findFfmpeg(),
    isPythonAvailable(),
    isFasterWhisperAvailable(),
    isYtDlpAvailable(),
    isDiarizationReady(),
  ]);
  const text = textProviderConfig() ?? { id: "none", label: "None", configured: false };
  // A host that can never install Python (Vercel/Netlify/Lambda) — the UI uses
  // this to show "deploy on Render" instead of a misleading "pip install" hint.
  const serverless = Boolean(
    process.env.VERCEL ||
      process.env.NETLIFY ||
      process.env.AWS_LAMBDA_FUNCTION_NAME,
  );
  return json({
    ok: true,
    // Local engine = Python + faster-whisper on this host.
    localReady: python && fasterWhisper,
    serverless,
    ffmpeg: { found: Boolean(ffmpeg), path: ffmpeg ?? undefined },
    python: { found: python },
    fasterWhisper: { found: fasterWhisper },
    ytDlp: { found: ytDlp },
    diarization: {
      installed: diarization.installed,
      tokenConfigured: diarization.tokenConfigured,
      ready: diarization.installed && diarization.tokenConfigured,
    },
    translation: {
      configured: getTextProvider().configured,
      provider: text.label,
    },
    whisperModel: env.whisperModel,
    maxAudioMb: env.maxAudioMb,
  });
}