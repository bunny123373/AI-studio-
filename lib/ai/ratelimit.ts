/**
 * Basic in-memory rate limiter (single-server).
 * The abstraction is swappable for Redis/BullMQ-style rate limiting later.
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  retryAfterMs: number;
}

export function rateLimit(
  key: string,
  max: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, limit: max, remaining: max - 1, retryAfterMs: 0 };
  }
  bucket.count += 1;
  if (bucket.count > max) {
    return {
      ok: false,
      limit: max,
      remaining: 0,
      retryAfterMs: bucket.resetAt - now,
    };
  }
  return { ok: true, limit: max, remaining: max - bucket.count, retryAfterMs: 0 };
}

/** Smallest visible bucket — keeps the map from growing forever. */
export function pruneRateLimits() {
  const now = Date.now();
  for (const [k, v] of buckets) {
    if (v.resetAt <= now) buckets.delete(k);
  }
}