/**
 * AI provider types — the contract for every text/image backend.
 * Providers are swappable: local models, open-source, free APIs or
 * paid providers can all implement these interfaces.
 */

export interface TextProvider {
  id: string;
  label: string;
  /** Whether the provider is configured (e.g. env key present). */
  configured: boolean;
  generate(prompt: string, opts?: { system?: string }): Promise<string>;
}

export interface ImageGenerationInput {
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  seed?: number;
  model?: string;
}

export interface ImageGenerationResult {
  ok: boolean;
  provider: string;
  /** Public URL of the generated image (browser-displayable). */
  url?: string;
  /** Data-URL fallback when the provider returns base64. */
  dataUrl?: string;
  seed?: number;
  waitSeconds?: string;
  error?: string;
}

export interface ImageProvider {
  id: string;
  label: string;
  configured: boolean;
  generate(input: ImageGenerationInput): Promise<ImageGenerationResult>;
}

export interface OutputBlock {
  title: string;
  text: string;
}

export interface GenerationRequest {
  /** Tool id: lyrics | caption | youtube | script | seo | video-prompt | bible */
  tool: string;
  language?: string;
  input: Record<string, string | number | undefined>;
}

export interface GenerationResult {
  ok: boolean;
  mode: "template" | "ai";
  tool: string;
  blocks: OutputBlock[];
  raw?: string;
  /** Shown as a friendly warning (e.g. AI failed, fell back to template). */
  notice?: string;
  error?: string;
}

export interface ProviderStatus {
  text: { id: string; label: string; configured: boolean };
  image: { id: string; label: string; configured: boolean };
  whisper: { configured: boolean; model: string };
  ffmpeg: { found: boolean; path?: string };
  python: { found: boolean };
}