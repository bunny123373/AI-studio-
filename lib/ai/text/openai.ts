import { env } from "@/lib/ai/env";
import type { TextProvider } from "@/lib/ai/types";

/** Basic OpenAI-compatible chat provider (works with any OpenAI-compatible
 * endpoint: OpenAI, Groq, Together, DeepSeek, Ollama/OpenAI-mode, LM Studio...). */
export const openaiProvider: TextProvider = {
  id: "openai",
  label: "OpenAI-compatible",
  get configured() {
    return Boolean(env.openaiApiKey) || Boolean(env.openaiBaseUrl !== "https://api.openai.com/v1");
  },
  async generate(prompt, opts) {
    if (!env.openaiApiKey && env.openaiBaseUrl === "https://api.openai.com/v1") {
      throw new Error("OPENAI_API_KEY is not set.");
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90_000);
    try {
      const res = await fetch(`${env.openaiBaseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(env.openaiApiKey ? { Authorization: `Bearer ${env.openaiApiKey}` } : {}),
        },
        body: JSON.stringify({
          model: env.openaiModel,
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
        throw new Error(`Provider error ${res.status}: ${body.slice(0, 300)}`);
      }
      const data = await res.json();
      const text: string | undefined =
        data?.choices?.[0]?.message?.content;
      if (!text) throw new Error("Provider returned an empty response.");
      return text.trim();
    } finally {
      clearTimeout(timer);
    }
  },
};