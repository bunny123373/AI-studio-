import { badRequest, json } from "@/lib/api/generate-route";
import {
  buildSubtitles,
  validateSrt,
  type CaptionStyle,
  type SrtFormat,
  type SrtLayout,
  type SrtSegment,
} from "@/lib/audio/srt";

const FORMATS: SrtFormat[] = ["srt", "vtt", "txt"];
const LAYOUTS: SrtLayout[] = ["original", "translation", "dual"];

/** Validate an incoming style object → only whitelisted values pass. */
function sanitizeCaptionStyle(raw: unknown): CaptionStyle | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const style: CaptionStyle = {};
  if (typeof r.textColor === "string" && /^#[0-9a-fA-F]{6}$/.test(r.textColor)) {
    style.textColor = r.textColor;
  }
  if (
    typeof r.background === "string" &&
    /^(#[0-9a-fA-F]{3,8}|rgba?\([\d.,\s%]+\)|hsla?\([\d.,%\s]+\))$/.test(r.background)
  ) {
    style.background = r.background;
  }
  if (r.size === "small" || r.size === "medium" || r.size === "large") style.size = r.size;
  if (r.position === "bottom" || r.position === "top" || r.position === "middle") {
    style.position = r.position;
  }
  return Object.keys(style).length > 0 ? style : undefined;
}

/**
 * POST {segments:[{start,end,text,speaker?,translation?}], format?, layout?,
 *         speakers?} → validated subtitles in the chosen format.
 * "original"   → the transcript text
 * "translation"→ the translated text (falls back to original per line)
 * "dual"       → original \n translation per cue
 */
export async function POST(req: Request) {
  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }
  const p = (parsed ?? {}) as {
    segments?: unknown;
    format?: unknown;
    layout?: unknown;
    speakers?: unknown;
    style?: unknown;
  };
  if (!Array.isArray(p.segments)) return badRequest("`segments` array is required.");

  const segments: SrtSegment[] = [];
  for (const raw of p.segments.slice(0, 5000)) {
    const s = raw as Record<string, unknown>;
    const start = Number(s.start);
    const end = Number(s.end);
    const text = typeof s.text === "string" ? s.text.trim() : "";
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    if (!text) continue;
    const seg: SrtSegment = {
      start: Math.max(0, start),
      end: Math.max(0, end),
      text,
    };
    if (typeof s.speaker === "string" && s.speaker.trim()) {
      seg.speaker = s.speaker.trim().slice(0, 80);
    }
    if (typeof s.translation === "string" && s.translation.trim()) {
      seg.translation = s.translation.trim();
    }
    segments.push(seg);
  }
  if (segments.length === 0) {
    return badRequest("No valid segments found.");
  }

  const format: SrtFormat = FORMATS.includes(p.format as SrtFormat)
    ? (p.format as SrtFormat)
    : "srt";
  const layout: SrtLayout = LAYOUTS.includes(p.layout as SrtLayout)
    ? (p.layout as SrtLayout)
    : "original";
  const speakers = p.speakers === true;
  const style = sanitizeCaptionStyle(p.style);

  const subtitles = buildSubtitles(format, segments, { layout, speakers, style });
  const check = format === "srt" ? validateSrt(subtitles) : { valid: true, errors: [] };

  return json({
    ok: true,
    format,
    layout,
    speakers,
    style: style ?? null,
    subtitles,
    srt: format === "srt" ? subtitles : buildSubtitles("srt", segments, { layout, speakers, style }),
    valid: check.valid,
    errors: check.errors,
    segmentCount: segments.length,
  });
}