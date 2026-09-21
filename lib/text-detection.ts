/**
 * Honest text-on-image hints.
 *
 * Free text-to-image providers (Hugging Face, Pollinations, Gemini's free
 * tier) cannot reliably draw text — especially non-Latin scripts — and often
 * paint letters in another language instead. These helpers detect when a
 * prompt is asking for text so the UI can say so up front, instead of
 * silently generating wrong-script letters.
 */

const SCRIPT_RANGES: ReadonlyArray<[number, number]> = [
  [0x0600, 0x06ff], // Arabic
  [0x0400, 0x04ff], // Cyrillic
  [0x0900, 0x097f], // Devanagari (Hindi, Marathi…)
  [0x0980, 0x09ff], // Bengali / Assamese
  [0x0a00, 0x0a7f], // Gurmukhi
  [0x0a80, 0x0aff], // Gujarati
  [0x0b00, 0x0b7f], // Odia
  [0x0b80, 0x0bff], // Tamil
  [0x0c00, 0x0c7f], // Telugu
  [0x0c80, 0x0cff], // Kannada
  [0x0d00, 0x0d7f], // Malayalam
  [0x0e00, 0x0e7f], // Thai
  [0x3040, 0x30ff], // Hiragana / Katakana
  [0x4e00, 0x9fff], // CJK unified ideographs
  [0xac00, 0xd7af], // Hangul
];

/** True when the string contains characters from a non-Latin script. */
export function hasNonLatinScript(s: string): boolean {
  for (const ch of s) {
    const cp = ch.codePointAt(0) ?? 0;
    for (const [lo, hi] of SCRIPT_RANGES) {
      if (cp >= lo && cp <= hi) return true;
    }
  }
  return false;
}

/** True when the string contains a quoted phrase ("…", “…”, '…', «…»…). */
export function hasQuotedText(s: string): boolean {
  // No /s flag — the [^…\n] class already forbids newlines inside the phrase.
  return /[“‘"«»][^“‘"«»\n]{2,80}[”’"«»]/.test(s);
}

/** True when a prompt looks like it asks the model to render text. */
export function promptAsksForText(s: string): boolean {
  return hasNonLatinScript(s) || hasQuotedText(s);
}

/** Human description used in honest warnings. */
export function describeTextAsk(s: string): string {
  if (hasNonLatinScript(s)) return "a non-Latin script";
  return "quoted text";
}