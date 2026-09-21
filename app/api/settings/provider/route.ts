import { badRequest, clientIp, json } from "@/lib/api/generate-route";
import { env } from "@/lib/ai/env";
import { rateLimit } from "@/lib/ai/ratelimit";
import {
  canSelectTextProvider,
  getRuntimeText,
  setRuntimeText,
  type TextProviderChoice,
} from "@/lib/ai/config";

export const runtime = "nodejs";

const CHOICES: TextProviderChoice[] = ["gemini", "openai"];

/**
 * GET — the current runtime override (in-memory) and the per-provider
 * defaults from the environment. Never exposes secret values.
 */
export async function GET() {
  return json(providerState());
}

/**
 * POST — switch the active text provider / model at runtime.
 * Body: { provider?: "gemini" | "openai" | null, model?: string | null }
 * Passing provider: null resets to the `.env.local` default.
 */
export async function POST(req: Request) {
  const rl = rateLimit(
    `settings:${clientIp(req)}`,
    Math.max(2, Math.floor(env.rateLimitMax / 10)),
    env.rateLimitWindowMs,
  );
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

  const rawProvider = p.provider === null || p.provider === undefined ? null : p.provider;
  let provider: TextProviderChoice | null;
  if (rawProvider === null) {
    provider = null;
  } else if (typeof rawProvider === "string" && (CHOICES as string[]).includes(rawProvider)) {
    provider = rawProvider as TextProviderChoice;
  } else {
    return badRequest("`provider` must be \"gemini\", \"openai\" or null.");
  }

  const model =
    p.model === null || p.model === undefined || p.model === ""
      ? null
      : typeof p.model === "string"
        ? p.model.trim().slice(0, 200) || null
        : null;

  setRuntimeText(provider, model);
  return json(providerState());
}

function providerState() {
  const rt = getRuntimeText();
  return {
    ok: true,
    runtime: rt,
    defaults: {
      provider: env.textProvider,
      gemini: {
        configured: canSelectTextProvider("gemini"),
        model: env.geminiModel,
      },
      openai: {
        configured: canSelectTextProvider("openai"),
        model: env.openaiModel,
      },
    },
  };
}