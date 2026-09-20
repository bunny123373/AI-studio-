import { env } from "@/lib/ai/env";
import { rateLimit } from "@/lib/ai/ratelimit";
import { badRequest, clientIp, json } from "@/lib/api/generate-route";
import { getTextProvider } from "@/lib/ai/text";

const LANG_NAMES: Record<string, string> = {
  te: "Telugu",
  en: "English",
  hi: "Hindi",
  ta: "Tamil",
  kn: "Kannada",
  ml: "Malayalam",
};

/**
 * Translator — needs a real AI provider (we never fake translations).
 * When no provider is configured the API honestly returns a setup message.
 */
export async function POST(req: Request) {
  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }
  const p = (parsed ?? {}) as Record<string, unknown>;
  const text = typeof p.text === "string" ? p.text.slice(0, 4000).trim() : "";
  const from = typeof p.from === "string" ? p.from.slice(0, 16) : "auto";
  const to = typeof p.to === "string" ? p.to.slice(0, 16) : "en";
  if (!text) return badRequest("`text` is required.");
  if (!LANG_NAMES[to]) return badRequest("Unknown target language.");

  const rl = rateLimit(`translate:${clientIp(req)}`, env.rateLimitMax, env.rateLimitWindowMs);
  if (!rl.ok) {
    return json({ ok: false, error: "Too many requests. Try again shortly." }, 429);
  }

  const provider = getTextProvider();
  if (!provider.configured) {
    return json({
      ok: false,
      error:
        "No translation provider is configured. Add an OpenAI-compatible or Gemini API key in Settings (AI provider), or install a local model, to enable translation. We never return fake translations.",
    });
  }

  try {
    const translated = await provider.generate(text, {
      system: `You are a professional translator. Translate the text from ${from === "auto" ? "its detected language" : LANG_NAMES[from] ?? "the source language"} into ${LANG_NAMES[to]}. Output ONLY the translation, no explanations. Keep the natural tone; for Telugu use conversational Telugu, not literal machine translation.`,
    });
    return json({ ok: true, mode: "ai", from, to, text: translated });
  } catch (err) {
    return json({
      ok: false,
      error: `Translation failed: ${err instanceof Error ? err.message : "provider error"}`,
    });
  }
}