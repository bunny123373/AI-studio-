import { badRequest, clientIp, json } from "@/lib/api/generate-route";
import { env } from "@/lib/ai/env";
import { rateLimit } from "@/lib/ai/ratelimit";

export const runtime = "nodejs";

/** Extract the 11-char video id from any common YouTube URL shape. */
function extractVideoId(input: string): string | null {
  const m = input.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  return m?.[1] ?? null;
}

/**
 * POST /api/youtube/info  { url }
 * Fetches a video's real title + channel via YouTube's public oEmbed (no API
 * key), and returns its thumbnail as a same-origin data URL so the browser can
 * always load it for palette extraction. Works on serverless hosting too.
 * Honest failure: private/age-restricted videos still return the thumbnail, or
 * a clear notice when not readable.
 */
export async function POST(req: Request) {
  const rl = rateLimit(
    `ytinfo:${clientIp(req)}`,
    Math.max(2, Math.floor(env.rateLimitMax / 4)),
    env.rateLimitWindowMs,
  );
  if (!rl.ok) {
    return json(
      { ok: false, error: "Too many requests. Try again shortly." },
      429,
    );
  }

  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }
  const url = (parsed as { url?: unknown } | null)?.url;
  if (typeof url !== "string" || !url.trim()) {
    return badRequest("Body must include `url`.");
  }
  const videoId = extractVideoId(url);
  if (!videoId) {
    return badRequest("That doesn't look like a YouTube video link.");
  }

  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const result: {
    ok: true;
    videoId: string;
    watchUrl: string;
    title: string | null;
    channel: string | null;
    thumbnailDataUrl: string | null;
    notice?: string;
  } = {
    ok: true,
    videoId,
    watchUrl,
    title: null,
    channel: null,
    thumbnailDataUrl: null,
  };

  // 1) Real title + channel via public oEmbed.
  const titleRes = await fetch(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`,
    { signal: AbortSignal.timeout(10_000) },
  );
  if (titleRes.ok) {
    const meta = (await titleRes.json()) as {
      title?: string;
      author_name?: string;
    };
    result.title = typeof meta.title === "string" ? meta.title.slice(0, 300) : null;
    result.channel =
      typeof meta.author_name === "string" ? meta.author_name.slice(0, 120) : null;
  } else {
    result.notice =
      "Could not read the video title (private or age-restricted video) — the thumbnail is still loaded if available.";
  }

  // 2) Thumbnail proxied to the browser as a data URL (CORS-proof).
  const thumbRes = await fetch(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, {
    signal: AbortSignal.timeout(10_000),
  });
  if (
    thumbRes.ok &&
    (thumbRes.headers.get("content-type")?.startsWith("image/") ?? false)
  ) {
    const buf = Buffer.from(await thumbRes.arrayBuffer());
    const mime = thumbRes.headers.get("content-type") ?? "image/jpeg";
    result.thumbnailDataUrl = `data:${mime};base64,${buf.toString("base64")}`;
  } else if (!result.title) {
    result.notice = "Could not read this video at all — check the link and try again.";
  }

  return json(result);
}