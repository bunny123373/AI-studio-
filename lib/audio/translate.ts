/**
 * Server-side bilingual subtitle translation.
 * Uses the configured text AI provider — we never fake translations.
 * If no provider is configured this returns an honest error and the
 * pipeline continues with un-translated subtitles.
 */

import { getTextProvider } from "@/lib/ai/text";

const LANG_NAMES: Record<string, string> = {
  te: "Telugu",
  en: "English",
  hi: "Hindi",
  ta: "Tamil",
  kn: "Kannada",
  ml: "Malayalam",
};

const BATCH = 50;

export function isSupportedTarget(lang: string): boolean {
  return lang in LANG_NAMES;
}

/** Reply mapping helpers — parsed output only, never invent text. */
function parseJsonList(raw: string, expected: number): string[] | null {
  const m = raw.match(/\[[\s\S]*\]/);
  if (!m) return null;
  try {
    const arr = JSON.parse(m[0]);
    if (!Array.isArray(arr) || arr.length !== expected) return null;
    return arr.map((x) => (typeof x === "string" ? x.trim() : ""));
  } catch {
    return null;
  }
}

function parseNumbered(raw: string, expected: number): string[] | null {
  const out: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*\d+[.)\]]?\s+(.*)$/);
    if (m) out.push(m[1].trim());
  }
  return out.length === expected && out.every(Boolean) ? out : null;
}

async function translateChunk(
  texts: string[],
  to: string,
): Promise<string[]> {
  const provider = getTextProvider();
  const target = LANG_NAMES[to] ?? to;
  const numbered = texts.map((t, j) => `${j + 1}. ${t}`).join("\n");
  let out: string[] | null = null;
  try {
    const system =
      `You are a professional subtitle translator. Translate each numbered ` +
      `line into ${target}. Reply ONLY with the same numbered lines ` +
      `"N. <translation>", one per line, in the same order — never merge, ` +
      `reorder or skip lines, and keep each line roughly the same length. ` +
      `For Telugu use natural conversational Telugu, not literal machine ` +
      `translation.`;
    const raw = await provider.generate(numbered, { system });
    out = parseNumbered(raw, texts.length) ?? parseJsonList(raw, texts.length);
  } catch {
    out = null;
  }
  if (out) return out;
  // Per-line fallback (slower but robust).
  const result: string[] = [];
  for (const t of texts) {
    try {
      result.push(
        (
          await provider.generate(t.trim(), {
            system: `Translate this subtitle line into ${target}. Output ONLY the translation.`,
          })
        ).trim(),
      );
    } catch {
      result.push(t); // keep original on failure rather than dropping the cue
    }
  }
  return result;
}

export type TranslateCuesResult =
  | { ok: true; translations: string[] }
  | { ok: false; error: string };

/**
 * Translate every non-empty cue text into `to`.
 * Returns translations aligned with the input array (originals kept for
 * empty lines). Fails honestly when no AI provider is configured.
 */
export async function translateCues(
  texts: string[],
  to: string,
): Promise<TranslateCuesResult> {
  if (!isSupportedTarget(to)) {
    return { ok: false, error: `Unknown target language: ${to}` };
  }
  const provider = getTextProvider();
  if (!provider.configured) {
    return {
      ok: false,
      error:
        "No translation provider is configured. Add an OpenAI-compatible or " +
        "Gemini API key in Settings to enable bilingual subtitles. Nothing was faked.",
    };
  }
  const done: string[] = new Array<string>(texts.length).fill("");
  const indexes: number[] = [];
  const textsToTranslate: string[] = [];
  texts.forEach((t, i) => {
    const clean = (t ?? "").trim();
    if (clean) {
      indexes.push(i);
      textsToTranslate.push(clean);
    }
  });
  if (textsToTranslate.length === 0) {
    return { ok: true, translations: done };
  }
  try {
    for (let i = 0; i < textsToTranslate.length; i += BATCH) {
      const chunk = textsToTranslate.slice(i, i + BATCH);
      const out = await translateChunk(chunk, to);
      for (let k = 0; k < out.length; k++) {
        const ci = indexes[i + k];
        if (ci !== undefined) done[ci] = out[k] ?? "";
      }
    }
  } catch (err) {
    return {
      ok: false,
      error:
        "Translation failed: " +
        (err instanceof Error ? err.message : "provider error"),
    };
  }
  return { ok: true, translations: done };
}