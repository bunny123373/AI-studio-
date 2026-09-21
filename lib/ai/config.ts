import { env } from "@/lib/ai/env";

/**
 * Runtime (in-process) text-provider override.
 *
 * Lets the user switch provider + model from the Settings UI without touching
 * `.env.local`. Keys ALWAYS come from environment variables — this only picks
 * which configured provider is active and which model it uses. The override
 * lives in server memory: it survives page refreshes on one long-running host
 * but resets on restart (and is per-instance on serverless — documented in
 * the UI, which is why Vercel still needs the env vars set).
 */
export type TextProviderChoice = "gemini" | "openai" | "openrouter";

const runtime: { provider: TextProviderChoice | null; model: string | null } = {
  provider: null,
  model: null,
};

export function setRuntimeText(
  provider: TextProviderChoice | null,
  model: string | null,
): void {
  runtime.provider = provider;
  runtime.model = model && model.trim() ? model.trim() : null;
}

export function getRuntimeText(): {
  provider: TextProviderChoice | null;
  model: string | null;
} {
  return { provider: runtime.provider, model: runtime.model };
}

/** True when this provider has enough env config to be usable. */
export function canSelectTextProvider(id: TextProviderChoice): boolean {
  if (id === "gemini") return Boolean(env.geminiApiKey);
  if (id === "openrouter") return Boolean(env.openrouterApiKey);
  // OpenAI-compatible endpoints (OpenAI, Groq, DeepSeek, Ollama, OpenRouter…)
  // are usable with a key, or keyless when a custom base URL is set.
  return (
    Boolean(env.openaiApiKey) || env.openaiBaseUrl !== "https://api.openai.com/v1"
  );
}

/** Model to use for a provider — runtime override wins, else the env default. */
export function modelFor(id: TextProviderChoice): string {
  if (runtime.provider === id && runtime.model) return runtime.model;
  if (id === "gemini") return env.geminiModel;
  if (id === "openrouter") return env.openrouterModel;
  return env.openaiModel;
}

/**
 * The Settings provider/model switcher is a personal, host-side tool — it
 * reveals host configuration and mutates in-memory server state, so it is
 * hidden on public deployments. Enabled only in local development, or when
 * the host explicitly allows it (ALLOW_RUNTIME_SWITCHER=1).
 */
export function runtimePickerEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_RUNTIME_SWITCHER === "1"
  );
}