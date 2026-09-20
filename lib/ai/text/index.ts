import { env } from "@/lib/ai/env";
import { openaiProvider } from "@/lib/ai/text/openai";
import { geminiProvider } from "@/lib/ai/text/gemini";
import type { TextProvider } from "@/lib/ai/types";

/**
 * Returns the configured text provider.
 * "template" is always the fallback — generation never requires a paid API.
 */
export function getTextProvider(): TextProvider {
  switch (env.textProvider) {
    case "openai":
      return openaiProvider;
    case "gemini":
      return geminiProvider;
    case "none":
      return { id: "none", label: "Disabled", configured: false, generate: async () => { throw new Error("Text provider disabled."); } };
    case "template":
    default:
      return { id: "template", label: "Free template engine", configured: false, generate: async () => { throw new Error("Template mode."); } };
  }
}

export function textProviderConfig():
  | { id: string; label: string; configured: boolean }
  | undefined {
  const p = getTextProvider();
  return { id: p.id, label: p.label, configured: p.configured };
}