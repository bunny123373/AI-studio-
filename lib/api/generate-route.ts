import { NextResponse } from "next/server";

import { env } from "@/lib/ai/env";
import { generateText } from "@/lib/ai/generate";
import { rateLimit } from "@/lib/ai/ratelimit";
import type { GenerationResult } from "@/lib/ai/types";

const MAX_STRING = 4000;

export function badRequest(message: string): NextResponse {
  return NextResponse.json(
    { ok: false, error: message },
    { status: 400 },
  );
}

export function json(text: unknown, status = 200): NextResponse {
  return NextResponse.json(text, { status });
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return "local";
}

function cleanString(v: unknown, max = MAX_STRING): string {
  if (typeof v !== "string") return "";
  return v.slice(0, max);
}

export interface GenBody {
  tool?: string;
  language?: string;
  input?: Record<string, string | number | undefined>;
}

/** Parse + shallow-validate a generation request body. */
export function parseGenBody(parsed: unknown): GenBody | null {
  if (!parsed || typeof parsed !== "object") return null;
  const p = parsed as Record<string, unknown>;
  const input: Record<string, string | number | undefined> = {};
  if (p.input && typeof p.input === "object") {
    for (const [k, v] of Object.entries(p.input as Record<string, unknown>)) {
      if (typeof v === "string") input[k] = cleanString(v);
      else if (typeof v === "number" && Number.isFinite(v)) input[k] = v;
      else input[k] = undefined;
    }
  }
  return {
    tool: cleanString(p.tool),
    language: cleanString(p.language, 16) || undefined,
    input,
  };
}

/**
 * Standard guard used by all public generation routes:
 * rate limit → call the provider/template engine → honest JSON.
 */
export async function guardedGenerate(
  req: Request,
  tool: string,
  body: GenBody,
): Promise<NextResponse> {
  const rl = rateLimit(
    `gen:${clientIp(req)}:${tool}`,
    env.rateLimitMax,
    env.rateLimitWindowMs,
  );
  if (!rl.ok) {
    return json(
      {
        ok: false,
        error: `Too many requests. Try again in ${Math.ceil(rl.retryAfterMs / 1000)}s.`,
      },
      429,
    );
  }
  const result: GenerationResult = await generateText({
    tool,
    language: body.language || "en",
    input: body.input ?? {},
  });
  return json(result);
}