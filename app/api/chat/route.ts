import { env } from "@/lib/ai/env";
import { chatMessage, type ChatTurn } from "@/lib/ai/chat";
import { badRequest, clientIp, json } from "@/lib/api/generate-route";
import { rateLimit } from "@/lib/ai/ratelimit";

const MAX_MESSAGE = 4000;
const MAX_HISTORY = 30;
const MAX_TURN = 12000;

function cleanTurn(v: unknown): ChatTurn | null {
  if (!v || typeof v !== "object") return null;
  const t = v as Record<string, unknown>;
  if (t.role !== "user" && t.role !== "assistant") return null;
  if (typeof t.content !== "string") return null;
  const content = t.content.slice(0, MAX_TURN).trim();
  if (!content) return null;
  return { role: t.role, content };
}

/**
 * Agent Chat endpoint — rate limited like the other generation routes.
 * The body carries the new message plus the conversation history so the
 * provider can remember context. History is capped to the last 30 turns.
 */
export async function POST(req: Request) {
  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }
  if (!parsed || typeof parsed !== "object") return badRequest("Invalid body.");

  const p = parsed as Record<string, unknown>;
  const message = typeof p.message === "string" ? p.message.slice(0, MAX_MESSAGE) : "";
  if (!message.trim()) return badRequest("Body must include a non-empty `message`.");

  const history: ChatTurn[] = Array.isArray(p.history)
    ? p.history.map(cleanTurn).filter((t): t is ChatTurn => t !== null).slice(-MAX_HISTORY)
    : [];

  const rl = rateLimit(`chat:${clientIp(req)}`, env.rateLimitMax, env.rateLimitWindowMs);
  if (!rl.ok) {
    return json(
      {
        ok: false,
        error: `Too many requests. Try again in ${Math.ceil(rl.retryAfterMs / 1000)}s.`,
      },
      429,
    );
  }

  const result = await chatMessage(message.trim(), history);
  return json(result);
}