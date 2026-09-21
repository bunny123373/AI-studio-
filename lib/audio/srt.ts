/**
 * Server-side helpers for the audio → SRT pipeline.
 * Everything here runs on the server (Node). Never import from client code.
 */

export type SrtLayout = "original" | "translation" | "dual";

export interface SrtSegment {
  start: number;
  end: number;
  text: string;
  /** Optional speaker label, e.g. "Speaker 1" (from diarization). */
  speaker?: string;
  /** Optional translation of `text` (bilingual mode). */
  translation?: string;
}

export interface SrtBuildOptions {
  /** Which text to emit per cue. Defaults to "original". */
  layout?: SrtLayout;
  /** Prefix cues with their speaker label. Defaults to false. */
  speakers?: boolean;
  /**
   * Optional caption styling, embedded where the format supports it:
   * SRT → per-cue `<font color>`; VTT → `STYLE ::cue` + cue settings.
   * Plain text formats ignore it.
   */
  style?: CaptionStyle;
}

/** Caption appearance shared by the live preview and exported files. */
export interface CaptionStyle {
  /** Text color, hex e.g. "#ffffff". */
  textColor?: string;
  /** Background CSS color, e.g. "rgba(0,0,0,0.75)" or "#000000". */
  background?: string;
  /** Font size preset. Defaults to "medium". */
  size?: "small" | "medium" | "large";
  /** Vertical position. Defaults to "bottom". */
  position?: "bottom" | "top" | "middle";
}

const CAPTION_SIZE_PCT: Record<NonNullable<CaptionStyle["size"]>, string> = {
  small: "90%",
  medium: "110%",
  large: "140%",
};

export type SrtFormat = "srt" | "vtt" | "txt";

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

/** Seconds → "HH:MM:SS.mmm" (WebVTT). */
export function toVttTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const ms = Math.round((seconds % 1) * 1000);
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)}.${pad(ms, 3)}`;
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

/** Per-cue display lines honoring layout + speaker prefix. */
function cueText(seg: SrtSegment, opts: SrtBuildOptions): string {
  const original = (seg.text ?? "").trim();
  const translation = (seg.translation ?? "").trim();
  let body = original;
  if (opts.layout === "translation") {
    body = translation || original;
  } else if (opts.layout === "dual") {
    body = translation ? `${original}\n${translation}` : original;
  }
  if (opts.speakers && seg.speaker && body) {
    return `${seg.speaker}: ${body}`;
  }
  return body;
}

/** Clean + clamp segments so output is sequential, overlap-free, valid. */
function normalise(segments: SrtSegment[]): SrtSegment[] {
  const clean: SrtSegment[] = [];
  for (const seg of segments) {
    let start = Number(seg.start) || 0;
    let end = Number(seg.end) || 0;
    const speaker = (seg.speaker ?? "").trim() || undefined;
    const translation = (seg.translation ?? "").trim() || undefined;
    const text = (seg.text ?? "").replace(/\r/g, "").trim();
    if (!text) continue;
    if (end <= start) end = start + 0.5;
    // clamp against the previous segment so nothing overlaps
    const prev = clean[clean.length - 1];
    if (prev && start < prev.end) {
      start = round3(prev.end + 0.001);
      if (end <= start) end = start + 0.5;
    }
    clean.push({ start, end, text, speaker, translation });
  }
  return clean;
}

/**
 * Build a valid SRT document from segments.
 * Guarantees: sequential numbers, start < end, no overlaps, valid formatting.
 */
export function buildSrt(segments: SrtSegment[], opts: SrtBuildOptions = {}): string {
  return normalise(segments)
    .map(
      (seg, i) =>
        `${i + 1}\n${toSrtTime(seg.start)} --> ${toSrtTime(seg.end)}\n${srtStyledText(
          cueText(seg, opts),
          opts.style,
        )}`,
    )
    .join("\n\n");
}

/** Build a WebVTT document (same cues, HH:MM:SS.mmm timestamps). */
export function buildVtt(segments: SrtSegment[], opts: SrtBuildOptions = {}): string {
  const styleBlock = vttStyleBlock(opts.style);
  const settings = vttCueSettings(opts.style?.position);
  const cues = normalise(segments)
    .map((seg) => `${toVttTime(seg.start)} --> ${toVttTime(seg.end)}${settings}\n${cueText(seg, opts)}`)
    .join("\n\n");
  return `WEBVTT\n\n${styleBlock}${cues}`;
}

/** Build a plain-text transcript (one line per cue). */
export function buildTxt(segments: SrtSegment[], opts: SrtBuildOptions = {}): string {
  return normalise(segments)
    .map((seg) => cueText(seg, opts))
    .filter(Boolean)
    .join("\n");
}

/** Build any supported format. */
export function buildSubtitles(
  format: SrtFormat,
  segments: SrtSegment[],
  opts: SrtBuildOptions = {},
): string {
  if (format === "vtt") return buildVtt(segments, opts);
  if (format === "txt") return buildTxt(segments, opts);
  return buildSrt(segments, opts);
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;

/* ------------------------------------------------ caption styling helpers */

/** Wrap SRT cue text in an HTML <font color> tag (widely supported by players). */
function srtStyledText(text: string, style?: CaptionStyle): string {
  if (style?.textColor) return `<font color="${style.textColor}">${text}</font>`;
  return text;
}

/** WebVTT STYLE block (Chromium/YouTube-style players honour ::cue rules). */
function vttStyleBlock(style?: CaptionStyle): string {
  if (!style) return "";
  const rules: string[] = [];
  if (style.textColor) rules.push(`  color: ${style.textColor};`);
  if (style.background) rules.push(`  background-color: ${style.background};`);
  if (style.size) rules.push(`  font-size: ${CAPTION_SIZE_PCT[style.size]};`);
  if (rules.length === 0) return "";
  return `STYLE\n::cue {\n${rules.join("\n")}\n}\n\n`;
}

/** Per-cue WebVTT positioning settings (bottom = default, so no settings). */
function vttCueSettings(position?: CaptionStyle["position"]): string {
  if (position === "top") return " line:10% align:middle";
  if (position === "middle") return " line:50% align:middle";
  return "";
}

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