import { env } from "@/lib/ai/env";
import { getRuntimeText } from "@/lib/ai/config";
import { openaiProvider } from "@/lib/ai/text/openai";
import { openrouterProvider } from "@/lib/ai/text/openrouter";
import { geminiProvider } from "@/lib/ai/text/gemini";
import type { TextProvider } from "@/lib/ai/types";

/**
 * Returns the active text provider — the runtime switch (Settings UI) wins
 * over the `.env.local` default.
 * "template" is always the fallback — generation never requires a paid API.
 */
export function getTextProvider(): TextProvider {
  const rt = getRuntimeText();
  switch (rt.provider ?? env.textProvider) {
    case "openai":
      return openaiProvider;
    case "openrouter":
      return openrouterProvider;
    case "gemini":
      return geminiProvider;
    case "none":
      return {
        id: "none",
        label: "Disabled",
        configured: false,
        generate: async () => { throw new Error("Text provider disabled."); },
        chat: async () => { throw new Error("Text provider disabled."); },
      };
    case "template":
    default:
      return {
        id: "template",
        label: "Free template engine",
        configured: false,
        generate: async () => { throw new Error("Template mode."); },
        chat: async () => { throw new Error("Template mode."); },
      };
  }
}

export function textProviderConfig():
  | { id: string; label: string; configured: boolean }
  | undefined {
  const p = getTextProvider();
  return { id: p.id, label: p.label, configured: p.configured };
}