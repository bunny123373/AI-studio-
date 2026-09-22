import { getTextProvider } from "@/lib/ai/text";
import { chatTemplate, type ChatTurn } from "@/lib/ai/chat-template";
import type { ChatMessage } from "@/lib/ai/types";

export type { ChatTurn };

export interface ChatResult {
  ok: boolean;
  mode: "template" | "ai";
  reply: string;
  provider: string;
  providerLabel: string;
  /** Shown as a friendly warning (e.g. AI failed, offline assistant answered). */
  notice?: string;
  error?: string;
}

/**
 * System prompt for the AI-powered chat. The agent helps creators navigate
 * the studio and draft content — it never claims to generate images/audio
 * itself; the studio tools do that.
 */
const CHAT_SYSTEM =
  "You are BALU, the friendly assistant for Balu AI Studio — a free-first AI " +
  "creator studio. You help creators with images, thumbnails, YouTube titles, " +
  "descriptions and scripts, captions, lyrics (Telugu, English, Hindi, Tamil, " +
  "Kannada, Malayalam), SEO, video prompts, Bible content, translation and " +
  "Audio → SRT subtitles.\n\n" +
  "Answer conversationally and concisely: a few short paragraphs or bullet " +
  "lists. Use plain text with '\\n' line breaks — no markdown tables.\n\n" +
  "Honesty rules:\n" +
  "- You are a text assistant; you cannot generate images, audio or video " +
  "yourself. When the user wants to actually create something, suggest which " +
  "studio tool to open (e.g. /image, /thumbnail, /lyrics, /scripts, " +
  "/audio-to-srt) and what to type there.\n" +
  "- SEO suggestions never guarantee rankings.\n" +
  "- Never invent Bible quotations; if scripture is referenced, name the " +
  "translation.\n" +
  "- Write lyrics, scripts and translations in the language the user asks for, " +
  "in natural, conversational phrasing — not literal translation.";

/**
 * Send one chat message with history to the active text provider.
 * Falls back to the built-in offline assistant when no provider is
 * configured (or when the provider fails) — always with an honest `mode`.
 */
export async function chatMessage(
  message: string,
  history: ChatTurn[],
): Promise<ChatResult> {
  const provider = getTextProvider();

  const messages: ChatMessage[] = [
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: message },
  ];

  if (provider.configured && provider.id !== "template" && provider.id !== "none") {
    try {
      const reply = await provider.chat(messages, { system: CHAT_SYSTEM });
      return {
        ok: true,
        mode: "ai",
        reply,
        provider: provider.id,
        providerLabel: provider.label,
      };
    } catch (err) {
      const reply = chatTemplate(message);
      return {
        ok: true,
        mode: "template",
        reply,
        provider: "template",
        providerLabel: "Free offline assistant",
        notice: `AI provider failed (${err instanceof Error ? err.message : "unknown error"}). The offline assistant answered instead.`,
      };
    }
  }

  const reply = chatTemplate(message);
  return {
    ok: true,
    mode: "template",
    reply,
    provider: "template",
    providerLabel: "Free offline assistant",
  };
}