/**
 * Server-side helpers for the audio → SRT pipeline.
 * Everything here runs on the server (Node). Never import from client code.
 */

export interface SrtSegment {
  start: number;
  end: number;
  text: string;
}

const pad = (n: number, w: number) => String(n).padStart(w, "0");

/** Seconds → "HH:MM:SS,mmm". */
export function toSrtTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const ms = Math.round((seconds % 1) * 1000);
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)},${pad(ms, 3)}`;
}

/** "HH:MM:SS,mmm" (or "MM:SS,mmm" / "SS.mmm") → seconds. */
export function parseSrtTime(value: string): number {
  const clean = value.trim().replace(",", ".");
  const parts = clean.split(":").map(Number);
  if (parts.some((n) => Number.isNaN(n))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] ?? 0;
}

/**
 * Build a valid SRT document from segments.
 * Guarantees: sequential numbers, start < end, no overlaps, valid formatting.
 */
export function buildSrt(segments: SrtSegment[]): string {
  const clean: SrtSegment[] = [];
  for (const seg of segments) {
    let start = Number(seg.start) || 0;
    let end = Number(seg.end) || 0;
    const text = (seg.text ?? "").replace(/\r/g, "").trim();
    if (!text) continue;
    if (end <= start) end = start + 0.5;
    // clamp against the previous segment so nothing overlaps
    const prev = clean[clean.length - 1];
    if (prev && start < prev.end) {
      start = round3(prev.end + 0.001);
      if (end <= start) end = start + 0.5;
    }
    clean.push({ start, end, text });
  }
  return clean
    .map((seg, i) => `${i + 1}\n${toSrtTime(seg.start)} --> ${toSrtTime(seg.end)}\n${seg.text}`)
    .join("\n\n");
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;

/** Validate an SRT document; returns issues if any. */
export function validateSrt(srt: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const blocks = srt.replace(/^\uFEFF/, "").trim().split(/\n{2,}/);
  if (blocks.length === 0) {
    return { valid: false, errors: ["Empty SRT."] };
  }
  let prevEnd = -1;
  for (const block of blocks) {
    const lines = block.split("\n");
    const num = Number(lines[0]);
    if (!Number.isInteger(num) || num < 1) {
      errors.push(`Bad subtitle number: "${lines[0]}"`);
      continue;
    }
    const tm = lines[1]?.match(
      /^(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})$/,
    );
    if (!tm) {
      errors.push(`Bad timestamp line: "${lines[1] ?? "(missing)"}"`);
      continue;
    }
    const start = +tm[1] * 3600 + +tm[2] * 60 + +tm[3] + +tm[4] / 1000;
    const end = +tm[5] * 3600 + +tm[6] * 60 + +tm[7] + +tm[8] / 1000;
    if (start >= end) errors.push(`start >= end in block ${num}`);
    if (start < prevEnd) errors.push(`Overlapping subtitle in block ${num}`);
    prevEnd = end;
  }
  return { valid: errors.length === 0, errors };
}