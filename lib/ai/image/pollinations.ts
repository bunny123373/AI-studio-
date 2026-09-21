import type {
  ImageGenerationInput,
  ImageGenerationResult,
  ImageProvider,
} from "@/lib/ai/types";
import { env } from "@/lib/ai/env";

const UA = "Mozilla/5.0 (compatible; BaluAIStudio/1.0)";

/**
 * Pollinations.ai — free text-to-image.
 *
 * Two routes, selected automatically:
 *  - No key (default): legacy keyless endpoint. Fully free, no account, but it
 *    is a best-effort public tier — busy windows return 429/503 and some style
 *    phrasing returns 500. The route layer retries once with the plain prompt.
 *  - POLLINATIONS_API_KEY set (free Quest-Pollen key at enter.pollinations.ai):
 *    the current gen.pollinations.ai endpoint. Reliable and supported.
 *
 * Different models behave differently, so the requested size is applied as a
 * hint and images are normalised by the caller.
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
    const apiKey = env.pollinationsApiKey;

    const base =
      apiKey.length > 0
        ? "https://gen.pollinations.ai/image/"
        : "https://image.pollinations.ai/prompt/";

    const params = new URLSearchParams({
      width: String(input.width),
      height: String(input.height),
      seed: String(seed),
      model: input.model || "flux",
      nologo: "true",
      referrer: "balu-ai-studio",
    });
    if (apiKey) params.set("key", apiKey);
    const url = `${base}${encodeURIComponent(sharpPrompt)}?${params.toString()}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 180_000);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA },
        signal: controller.signal,
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          return {
            ok: false,
            provider: this.id,
            error:
              "The image service needs a (free) API key. Grab one at enter.pollinations.ai (Quest Pollen — no card needed), then set POLLINATIONS_API_KEY in .env.local and restart.",
            seed,
          };
        }
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