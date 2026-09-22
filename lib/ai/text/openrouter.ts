import { env } from "@/lib/ai/env";
import { modelFor } from "@/lib/ai/config";
import { withRetry } from "@/lib/ai/retry";
import type { TextProvider } from "@/lib/ai/types";

/**
 * OpenRouter chat provider (OpenAI-compatible endpoint at
 * https://openrouter.ai/api/v1). Default model: inclusionai/ling-3.0-flash-vl
 * (Ling 3.0 Flash VL — a vision-language model). It writes/refines text; it
 * does NOT generate images — the image tools use it only to build a better
 * prompt, never as a fake image engine.
 */
export const openrouterProvider: TextProvider = {
  id: "openrouter",
  label: "OpenRouter (Ling 3.0 Flash VL)",
  get configured() {
    return Boolean(env.openrouterApiKey);
  },
  async generate(prompt, opts) {
    if (!env.openrouterApiKey) {
      throw new Error("OPENROUTER_API_KEY is not set.");
    }
    // Transient 429/5xx blips (and OpenRouter's free-tier rate limits) get a
    // short backoff-and-retry before the honest template fallback kicks in.
    return withRetry(async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 120_000);
      try {
        const res = await fetch(`${env.openrouterBaseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.openrouterApiKey}`,
          },
          body: JSON.stringify({
            model: modelFor("openrouter"),
            temperature: 0.8,
            messages: [
              ...(opts?.system
                ? [{ role: "system" as const, content: opts.system }]
                : []),
              { role: "user" as const, content: prompt },
            ],
          }),
          signal: controller.signal,
        });
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(`OpenRouter error ${res.status}: ${body.slice(0, 300)}`);
        }
        const data = await res.json();
        const text: string | undefined =
          data?.choices?.[0]?.message?.content;
        if (!text) throw new Error("OpenRouter returned an empty response.");
        return text.trim();
      } finally {
        clearTimeout(timer);
      }
    });
  },
  async chat(messages, opts) {
    if (!env.openrouterApiKey) {
      throw new Error("OPENROUTER_API_KEY is not set.");
    }
    return withRetry(async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 120_000);
      try {
        const res = await fetch(`${env.openrouterBaseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.openrouterApiKey}`,
          },
          body: JSON.stringify({
            model: modelFor("openrouter"),
            temperature: 0.7,
            messages: [
              ...(opts?.system
                ? [{ role: "system" as const, content: opts.system }]
                : []),
              ...messages,
            ],
          }),
          signal: controller.signal,
        });
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(`OpenRouter error ${res.status}: ${body.slice(0, 300)}`);
        }
        const data = await res.json();
        const text: string | undefined =
          data?.choices?.[0]?.message?.content;
        if (!text) throw new Error("OpenRouter returned an empty response.");
        return text.trim();
      } finally {
        clearTimeout(timer);
      }
    });
  },
};