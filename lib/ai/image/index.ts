import { env } from "@/lib/ai/env";
import { pollinationsProvider } from "@/lib/ai/image/pollinations";
import { localSdProvider } from "@/lib/ai/image/local";
import type { ImageProvider } from "@/lib/ai/types";

/** Returns the configured image provider (default: free Pollinations.ai). */
export function getImageProvider(): ImageProvider {
  switch (env.imageProvider) {
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
    default:
      return pollinationsProvider;
  }
}