import type {
  ImageGenerationInput,
  ImageGenerationResult,
  ImageProvider,
} from "@/lib/ai/types";
import { env } from "@/lib/ai/env";

/**
 * Nano Banana (Gemini image models) — real image generation via the Google
 * Generative Language API's generateContent endpoint with
 * `responseModalities: ["IMAGE"]`. Returns the rendered image as a data URL.
 *
 * Honest caveat shown in the UI: image models are billed separately from text
 * on this project's quota. When the account has no image allowance, Google
 * answers 429 RESOURCE_EXHAUSTED and the route falls back to free
 * Pollinations with a visible notice.
 */
const ASPECT_RATIOS: Record<string, string> = {
  "1024x1024": "1:1",
  "1280x720": "16:9",
  "720x1280": "9:16",
  "1024x768": "4:3",
};

export const geminiImageProvider: ImageProvider = {
  id: "gemini",
  label: "Google Gemini (Nano Banana)",
  get configured() {
    return env.geminiApiKey.length > 0;
  },
  async generate(
    input: ImageGenerationInput,
  ): Promise<ImageGenerationResult> {
    if (!this.configured) {
      return {
        ok: false,
        provider: this.id,
        error:
          "GEMINI_API_KEY is not set. Add it to .env.local or pick Pollinations (free) as the image engine.",
        seed: input.seed,
      };
    }

    const model = env.geminiImageModel;
    const sizeKey = `${input.width}x${input.height}`;
    const body: Record<string, unknown> = {
      contents: [{ parts: [{ text: input.prompt.slice(0, 1500) }] }],
      generationConfig: {
        responseModalities: ["IMAGE"],
        ...(ASPECT_RATIOS[sizeKey]
          ? { imageConfig: { aspectRatio: ASPECT_RATIOS[sizeKey] } }
          : {}),
      },
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 120_000);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(env.geminiApiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        },
      );
      const raw = (await res.json().catch(() => null)) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              inlineData?: { mimeType?: string; data?: string };
            }>;
          };
        }>;
        error?: { status?: string; message?: string };
      } | null;

      if (!res.ok) {
        const status = raw?.error?.status ?? "";
        const msg = raw?.error?.message ?? `HTTP ${res.status}`;
        if (
          res.status === 429 ||
          res.status === 403 ||
          status === "RESOURCE_EXHAUSTED" ||
          /quota/i.test(msg)
        ) {
          return {
            ok: false,
            provider: this.id,
            error:
              "Gemini image generation has no quota on this account — image models are billed separately from text on the Gemini API.",
            seed: input.seed,
          };
        }
        return {
          ok: false,
          provider: this.id,
          error: `Gemini image error (${res.status}): ${msg.slice(0, 300)}`,
          seed: input.seed,
        };
      }

      const part = raw?.candidates?.[0]?.content?.parts?.find(
        (p) => p.inlineData?.data,
      );
      if (!part?.inlineData?.data) {
        return {
          ok: false,
          provider: this.id,
          error:
            "Gemini returned no image data. Try a different prompt and try again.",
          seed: input.seed,
        };
      }
      const mime = part.inlineData.mimeType ?? "image/png";
      return {
        ok: true,
        provider: this.id,
        dataUrl: `data:${mime};base64,${part.inlineData.data}`,
        seed: input.seed,
      };
    } catch (err) {
      return {
        ok: false,
        provider: this.id,
        error: `Could not reach the Gemini image API: ${
          err instanceof Error ? err.message : "network error"
        }. Check your internet connection.`,
        seed: input.seed,
      };
    } finally {
      clearTimeout(timer);
    }
  },
};