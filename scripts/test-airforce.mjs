#!/usr/bin/env node
/**
 * Live smoke-test for the Airforce (OpenAI-compatible) provider.
 *
 * Reads the key from (in order):
 *   1. an AIRFORCE_API_KEY env var (the doc-style name), or
 *   2. .env.local's OPENAI_API_KEY / OPENAI_BASE_URL / OPENAI_MODEL
 *
 * Never prints secrets — only masked status + the model's reply.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvLocal() {
  const map = {};
  try {
    const raw = readFileSync(join(root, ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) map[m[1]] = m[2];
    }
  } catch {
    /* no .env.local — fall through to process env only */
  }
  return map;
}

const local = loadEnvLocal();
const { OpenAI } = await import("openai");

// Resolve config: real process env wins, then .env.local.
const airKey = process.env.AIRFORCE_API_KEY || local.OPENAI_API_KEY || "";
const baseUrl =
  (process.env.OPENAI_BASE_URL || local.OPENAI_BASE_URL || "").replace(/\/+$/, "") ||
  "https://api.airforce/v1";
const model = process.env.OPENAI_MODEL || local.OPENAI_MODEL || "codestral-2508";

function mask(k) {
  if (!k) return "(missing)";
  return `${k.slice(0, 7)}…${k.slice(-4)} (${k.length} chars)`;
}

console.log(`baseURL : ${baseUrl}`);
console.log(`model   : ${model}`);
console.log(`apiKey  : ${mask(airKey)}`);

if (!airKey || !airKey.startsWith("sk-")) {
  console.error("✖ No key found. Add AIRFORCE_API_KEY=… or OPENAI_API_KEY=… to .env.local first.");
  process.exit(1);
}

const client = new OpenAI({ baseURL: baseUrl, apiKey: airKey });

const started = Date.now();
try {
  const r = await client.chat.completions.create({
    model,
    messages: [
      { role: "user", content: "Reply with exactly: PROVIDER_OK" },
    ],
    max_tokens: 16,
  });
  const reply = r.choices?.[0]?.message?.content ?? "(empty)";
  console.log(`\n✓ OK in ${Date.now() - started}ms → ${JSON.stringify(reply)}`);
} catch (e) {
  console.error(`\n✖ FAILED after ${Date.now() - started}ms:`);
  console.error(e?.status ? `  HTTP ${e.status}` : "  connection error");
  console.error(" " + String(e?.message || e));
  process.exit(1);
}
