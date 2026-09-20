import { env } from "@/lib/ai/env";
import { badRequest, clientIp, json } from "@/lib/api/generate-route";
import { rateLimit } from "@/lib/ai/ratelimit";
import { getImageProvider } from "@/lib/ai/image";
import type { ImageGenerationInput } from "@/lib/ai/types";

const STYLES: Record<string, string> = {
  realistic: "photorealistic, 8k, sharp details",
  cinematic: "cinematic lighting, film look, dramatic",
  anime: "anime style, vibrant, clean lineart",
  "3d": "3D render, octane, soft studio lighting",
  pixar: "pixar-like 3D animation style, cute, stylized",
  illustration: "digital illustration, painterly",
  "digital-art": "digital art, concept art, trending on artstation",
  fantasy: "epic fantasy, mystical, detailed",
  christian: "Christian symbolism, serene light, reverent tone",
  nature: "natural landscape, vivid colors, golden hour",
  product: "product photography, studio backdrop, commercial",
  portrait: "professional portrait, shallow depth of field",
  thumbnail: "YouTube thumbnail style, bold, high contrast, minimal text",
};

const RATIOS: Record<string, [number, number]> = {
  "1:1": [1024, 1024],
  "16:9": [1280, 720],
  "9:16": [720, 1280],
  "4:3": [1024, 768],
};

export async function POST(req: Request) {
  const rl = rateLimit(`img:${clientIp(req)}`, env.rateLimitMax, env.rateLimitWindowMs);
  if (!rl.ok) {
    return json({ ok: false, error: "Too many requests. Try again shortly." }, 429);
  }

  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }
  const p = (parsed ?? {}) as Record<string, unknown>;
  const prompt = typeof p.prompt === "string" ? p.prompt.slice(0, 1500).trim() : "";
  if (!prompt) return badRequest("`prompt` is required.");

  const style = typeof p.style === "string" ? p.style : "realistic";
  const ratio = typeof p.ratio === "string" ? p.ratio : "1:1";
  const size = RATIOS[ratio] ?? RATIOS["1:1"];
  const negative = typeof p.negative === "string" ? p.negative.slice(0, 500) : "";

  const styledPrompt = (STYLES[style] ? `${prompt}, ${STYLES[style]}` : prompt).slice(0, 1000);

  const input: ImageGenerationInput = {
    prompt: styledPrompt,
    negativePrompt: negative || "text, watermark, logo, low quality, blurry",
    width: size[0],
    height: size[1],
    seed: typeof p.seed === "number" ? p.seed : undefined,
    model: typeof p.model === "string" ? p.model : undefined,
  };

  const provider = getImageProvider();
  if (!provider.configured) {
    return json({
      ok: false,
      error:
        "No image provider is configured. Set IMAGE_PROVIDER=pollinations (free, keyless) or a local Stable Diffusion server, then restart. See .env.example.",
    });
  }
  const result = await provider.generate(input);
  return json(result);
}