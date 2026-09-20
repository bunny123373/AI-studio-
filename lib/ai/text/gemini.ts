import { env } from "@/lib/ai/env";
import type { TextProvider } from "@/lib/ai/types";

/** Google Gemini text provider (free tier supported). */
export const geminiProvider: TextProvider = {
  id: "gemini",
  label: "Google Gemini",
  get configured() {
    return Boolean(env.geminiApiKey);
  },
  async generate(prompt, opts) {
    if (!env.geminiApiKey) throw new Error("GEMINI_API_KEY is not set.");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90_000);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent?key=${env.geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  ...(opts?.system ? [{ text: `System: ${opts.system}` }] : []),
                  { text: prompt },
                ],
              },
            ],
            generationConfig: { temperature: 0.8 },
          }),
          signal: controller.signal,
        },
      );
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Gemini error ${res.status}: ${body.slice(0, 300)}`);
      }
      const data = await res.json();
      const text: string | undefined =
        data?.candidates?.[0]?.content?.parts
          ?.map((p: { text?: string }) => p.text ?? "")
          .join("") as string | undefined;
      if (!text) throw new Error("Gemini returned an empty response.");
      return text.trim();
    } finally {
      clearTimeout(timer);
    }
  },
};