import { env } from "@/lib/ai/env";
import { pollinationsProvider } from "@/lib/ai/image/pollinations";
import { geminiImageProvider } from "@/lib/ai/image/gemini";
import { localSdProvider } from "@/lib/ai/image/local";
import type { ImageProvider } from "@/lib/ai/types";

/** Resolve a provider by id ("gemini" | "pollinations" | "local" | "none"). */
export function getImageProviderFor(id: string): ImageProvider {
  switch (id) {
    case "local":
      return localSdProvider;
    case "none":
      return {
        id: "none",
        label: "Disabled",
        configured: false,
        generate: async () => ({
          ok: false,
          provider: "none",
          error: "Image generation is disabled.",
        }),
      };
    case "pollinations":
      return pollinationsProvider;
    case "gemini":
    default:
      return geminiImageProvider;
  }
}

/** Returns the configured image provider (default: Google Gemini). */
export function getImageProvider(): ImageProvider {
  return getImageProviderFor(env.imageProvider);
}