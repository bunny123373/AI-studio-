/**
 * Retry helper for transient AI-provider failures.
 *
 * Google/OpenAI-compatible endpoints occasionally answer 503 UNAVAILABLE
 * ("high demand"), 429, or other 5xx blips that clear within seconds. A short
 * backoff-and-retry rides those out instead of dropping straight to the free
 * template engine. Genuine errors (400 bad request, 401/403 auth, aborts) are
 * never retried — they fail fast and honestly.
 */
export function isTransientError(err: unknown): boolean {
  if (err instanceof Error && err.name === "AbortError") return false;
  const msg = err instanceof Error ? err.message : String(err);
  if (/aborted|AbortError/i.test(msg)) return false;
  return /(^|\D)(429|500|502|503|504)(\D|$)|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|rate.?limit|overloaded|fetch failed|ECONNRESET|ETIMEDOUT|network/i.test(
    msg,
  );
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts?: { attempts?: number; baseDelayMs?: number },
): Promise<T> {
  const attempts = Math.max(1, opts?.attempts ?? 3);
  const base = Math.max(0, opts?.baseDelayMs ?? 800);
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i === attempts - 1 || !isTransientError(err)) throw err;
      const delay = base * 2 ** i + Math.floor(Math.random() * 250);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}
