import { badRequest, json } from "@/lib/api/generate-route";
import { buildSrt, validateSrt, type SrtSegment } from "@/lib/audio/srt";

/** POST {segments:[{start,end,text}], language?, duration?} → validated SRT. */
export async function POST(req: Request) {
  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }
  const p = (parsed ?? {}) as { segments?: unknown };
  if (!Array.isArray(p.segments)) return badRequest("`segments` array is required.");

  const segments: SrtSegment[] = [];
  for (const raw of p.segments.slice(0, 5000)) {
    const s = raw as Record<string, unknown>;
    const start = Number(s.start);
    const end = Number(s.end);
    const text = typeof s.text === "string" ? s.text.trim() : "";
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    if (!text) continue;
    segments.push({ start: Math.max(0, start), end: Math.max(0, end), text });
  }
  if (segments.length === 0) {
    return badRequest("No valid segments found.");
  }

  const srt = buildSrt(segments);
  const check = validateSrt(srt);
  return json({
    ok: true,
    srt,
    valid: check.valid,
    errors: check.errors,
    segmentCount: segments.length,
  });
}