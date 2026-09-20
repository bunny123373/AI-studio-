"use client";

import * as React from "react";

export interface GeneratorResult {
  ok: boolean;
  mode?: "template" | "ai";
  tool?: string;
  blocks?: { title: string; text: string }[];
  raw?: string;
  notice?: string;
  error?: string;
}

export interface QueryPrefill {
  [key: string]: string;
}

/** Read ?key=value pairs from the URL (client-side, safe for SSR). */
export function useQueryPrefill(): QueryPrefill {
  const [prefill] = React.useState<QueryPrefill>(() => {
    if (typeof window === "undefined") return {};
    const q = new URLSearchParams(window.location.search);
    const out: QueryPrefill = {};
    q.forEach((v, k) => {
      out[k] = v;
    });
    return out;
  });
  return prefill;
}

/**
 * Shared client state for every text generator page:
 * loading, error and result handling with honest error messages.
 */
export function useGenerator(endpoint: string) {
  const [result, setResult] = React.useState<GeneratorResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const run = React.useCallback(
    async (body: Record<string, unknown>) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        let data: GeneratorResult;
        try {
          data = (await res.json()) as GeneratorResult;
        } catch {
          data = { ok: false, error: "The server returned an invalid response." };
        }
        if (!res.ok && !data.error) {
          data = { ...data, error: `Request failed (${res.status}).` };
        }
        if (!data.ok) {
          setError(
            data.error ?? "Something went wrong. Please try again.",
          );
          setResult(null);
        } else {
          setResult(data);
        }
        return data;
      } catch {
        setError("Something went wrong. Please try again.");
        setResult(null);
        return { ok: false as const, error: "Something went wrong. Please try again." };
      } finally {
        setLoading(false);
      }
    },
    [endpoint],
  );

  const reset = React.useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, run, reset };
}