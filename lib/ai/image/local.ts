import { env } from "@/lib/ai/env";
import type {
  ImageGenerationInput,
  ImageGenerationResult,
  ImageProvider,
} from "@/lib/ai/types";

/**
 * Local Stable Diffusion / ComfyUI compatible server (AUTOMATIC1111 API).
 * Configure with LOCAL_SD_URL — free, fully local, no API key.
 */
export const localSdProvider: ImageProvider = {
  id: "local",
  label: "Local Stable Diffusion",
  get configured() {
    return Boolean(env.localSdUrl);
  },
  async generate(input: ImageGenerationInput): Promise<ImageGenerationResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 180_000);
    try {
      if (!env.localSdUrl) throw new Error("LOCAL_SD_URL is not set.");
      const res = await fetch(`${env.localSdUrl}/sdapi/v1/txt2img`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: input.prompt,
          negative_prompt: input.negativePrompt ?? "",
          width: input.width,
          height: input.height,
          seed: input.seed ?? -1,
          steps: 24,
          cfg_scale: 7,
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        return {
          ok: false,
          provider: this.id,
          error: `Local SD server error ${res.status}. Is your Stable Diffusion / ComfyUI server running at ${env.localSdUrl}?`,
        };
      }
      const data = await res.json();
      const b64 = data?.images?.[0];
      if (!b64) {
        return {
          ok: false,
          provider: this.id,
          error: "Local SD server returned no image.",
        };
      }
      return {
        ok: true,
        provider: this.id,
        dataUrl: `data:image/png;base64,${b64}`,
        seed: input.seed,
      };
    } catch (err) {
      return {
        ok: false,
        provider: this.id,
        error: `Could not reach the local image server: ${
          err instanceof Error ? err.message : "connection error"
        }`,
      };
    } finally {
      clearTimeout(timer);
    }
  },
};