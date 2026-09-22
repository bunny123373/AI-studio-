import { env } from "@/lib/ai/env";
import { modelFor } from "@/lib/ai/config";
import { withRetry } from "@/lib/ai/retry";
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
    // Gemini's "high demand" spikes (503 UNAVAILABLE) are transient — retry a
    // couple of times with backoff before honestly falling back to templates.
    return withRetry(async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 90_000);
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelFor("gemini")}:generateContent?key=${env.geminiApiKey}`,
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
    });
  },
  async chat(messages, opts) {
    if (!env.geminiApiKey) throw new Error("GEMINI_API_KEY is not set.");
    // Gemini's content API only accepts "user" and "model" roles — map
    // assistant→model and fold the system prompt into the first user turn.
    const sys = opts?.system;
    const contents: {
      role: "user" | "model";
      parts: { text: string }[];
    }[] = [];
    for (const m of messages) {
      if (m.role === "system") continue;
      const text =
        m.role === "user" && sys && contents.length === 0
          ? `System: ${sys}\n\n${m.content}`
          : m.content;
      contents.push({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text }],
      });
    }
    if (contents.length === 0) {
      contents.push({ role: "user", parts: [{ text: sys ?? "Hello." }] });
    }
    return withRetry(async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 120_000);
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelFor("gemini")}:generateContent?key=${env.geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents,
              generationConfig: { temperature: 0.7 },
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
    });
  },
};
