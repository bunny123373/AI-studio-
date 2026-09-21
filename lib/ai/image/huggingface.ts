import { env } from "@/lib/ai/env";
import { withRetry } from "@/lib/ai/retry";
import type {
  ImageGenerationInput,
  ImageGenerationResult,
  ImageProvider,
} from "@/lib/ai/types";

/**
 * Hugging Face — text-to-image through the Inference Providers router.
 *
 * Request:  POST {HUGGINGFACE_BASE_URL}/{model}
 *           Authorization: Bearer hf_…
 *           { inputs, parameters: { negative_prompt, width, height, seed } }
 * Response: raw image bytes (image/png | image/jpeg) — returned as a data URL.
 *
 * Honest notes:
 *  - Needs a free HF access token with "Inference Providers" permission
 *    (HUGGINGFACE_API_KEY). Without one the provider reports `configured:false`
 *    and the route honestly uses the free Pollinations engine instead.
 *  - The free serverless tier is rate-limited and cold models answer 503 while
 *    they load — withRetry rides that out; if it still fails we say so.
 *  - Model + base URL are configurable (HUGGINGFACE_IMAGE_MODEL /
 *    HUGGINGFACE_BASE_URL), so a dedicated Inference Endpoint URL also works.
 */
export const huggingfaceProvider: ImageProvider = {
  id: "huggingface",
  label: "Hugging Face (Inference Providers)",
  get configured() {
    return env.huggingfaceApiKey.length > 0;
  },
  async generate(
    input: ImageGenerationInput,
  ): Promise<ImageGenerationResult> {
    if (!this.configured) {
      return {
        ok: false,
        provider: this.id,
        error:
          "HUGGINGFACE_API_KEY is not set. Create a free token with 'Inference Providers' permission at huggingface.co/settings/tokens, then set HUGGINGFACE_API_KEY in .env.local (or pick another image engine).",
        seed: input.seed,
      };
    }

    const model = env.huggingfaceImageModel;
    const url = `${env.huggingfaceBaseUrl}/${model}`;

    try {
      return await withRetry(async () => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 120_000);
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${env.huggingfaceApiKey}`,
              "Content-Type": "application/json",
              Accept: "image/png",
            },
            body: JSON.stringify({
              inputs: input.prompt.slice(0, 1000),
              parameters: {
                ...(input.negativePrompt
                  ? { negative_prompt: input.negativePrompt.slice(0, 500) }
                  : {}),
                width: input.width,
                height: input.height,
                ...(input.seed !== undefined ? { seed: input.seed } : {}),
              },
            }),
            signal: controller.signal,
          });

          if (!res.ok) {
            const txt = await res.text().catch(() => "");
            if (res.status === 401 || res.status === 403) {
              throw new Error(
                "Hugging Face rejected the token (401/403). Check HUGGINGFACE_API_KEY and that it has 'Inference Providers' permission.",
              );
            }
            if (res.status === 404) {
              throw new Error(
                `Hugging Face has no model "${model}" on this route. Set HUGGINGFACE_IMAGE_MODEL to a served text-to-image model.`,
              );
            }
            throw new Error(`Hugging Face error ${res.status}: ${txt.slice(0, 300)}`);
          }

          const contentType = res.headers.get("content-type") ?? "";
          if (!contentType.startsWith("image/")) {
            const txt = await res.text().catch(() => "");
            throw new Error(
              `Hugging Face returned ${contentType || "no content-type"} instead of an image: ${txt.slice(0, 200)}`,
            );
          }

          const buf = Buffer.from(await res.arrayBuffer());
          if (buf.length < 1000) {
            throw new Error("Hugging Face returned an empty image. Try again.");
          }
          return {
            ok: true,
            provider: this.id,
            dataUrl: `data:${contentType};base64,${buf.toString("base64")}`,
            seed: input.seed,
          } satisfies ImageGenerationResult;
        } finally {
          clearTimeout(timer);
        }
      });
    } catch (err) {
      return {
        ok: false,
        provider: this.id,
        error:
          err instanceof Error
            ? err.message
            : "Could not reach Hugging Face. Check your internet connection.",
        seed: input.seed,
      };
    }
  },
};