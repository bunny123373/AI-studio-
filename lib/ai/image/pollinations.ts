import type {
  ImageGenerationInput,
  ImageGenerationResult,
  ImageProvider,
} from "@/lib/ai/types";

const UA = "Mozilla/5.0 (compatible; BaluAIStudio/1.0)";
const ENDPOINT = "https://image.pollinations.ai/prompt/";

/**
 * Pollinations.ai — free, keyless text-to-image provider.
 * Requires internet. Different models behave differently, so the requested
 * size is applied as a hint and images are normalised by the caller.
 */
export const pollinationsProvider: ImageProvider = {
  id: "pollinations",
  label: "Pollinations.ai (free)",
  get configured() {
    return true;
  },
  async generate(input: ImageGenerationInput): Promise<ImageGenerationResult> {
    const sharpPrompt = input.prompt.slice(0, 900);
    const seed = input.seed ?? Math.floor(Math.random() * 2 ** 31);
    const params = new URLSearchParams({
      width: String(input.width),
      height: String(input.height),
      seed: String(seed),
      model: input.model || "flux",
      nologo: "true",
      referrer: "balu-ai-studio",
      enhance: "true",
    });
    const url = `${ENDPOINT}${encodeURIComponent(sharpPrompt)}?${params.toString()}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 180_000);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA },
        signal: controller.signal,
      });
      if (!res.ok) {
        if (res.status === 429 || res.status === 503) {
          return {
            ok: false,
            provider: this.id,
            error:
              "The free image service is busy right now. Wait a few seconds and try again (Regenerate).",
            seed,
          };
        }
        return {
          ok: false,
          provider: this.id,
          error: `Image service error ${res.status}. Please try again.`,
          seed,
        };
      }
      const blob = await res.blob();
      if (blob.size < 1000) {
        return {
          ok: false,
          provider: this.id,
          error: "The image service returned an empty result. Try again.",
          seed,
        };
      }
      // Cache-busting URL so <img> shows the fresh seed every time.
      const displayUrl = `${url}&_=${Date.now()}`;
      return { ok: true, provider: this.id, url: displayUrl, seed };
    } catch (err) {
      return {
        ok: false,
        provider: this.id,
        error: `Could not reach the free image service: ${
          err instanceof Error ? err.message : "network error"
        }. Check your internet connection.`,
        seed,
      };
    } finally {
      clearTimeout(timer);
    }
  },
};