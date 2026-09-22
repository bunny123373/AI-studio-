/**
 * Offline chat assistant — the zero-key fallback for the Agent Chat.
 *
 * This is NOT a fake AI. It is a small, honest rule-based assistant that
 * answers real questions about the studio and its tools (it knows the same
 * things the README and the UI know). It never pretends to be a language
 * model: when a question is beyond its built-in answers it says so and points
 * to Settings to add a real AI provider for open-ended conversation.
 */

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

interface Intent {
  /** Regexes matched against the lowercased user message. */
  patterns: RegExp[];
  reply: () => string;
}

const INTENTS: Intent[] = [
  {
    patterns: [
      /\b(?:hi|hello|hey|namaste|vanakkam|salaam|yo|greetings)\b/,
    ],
    reply: () =>
      "Hello! 👋 I'm the offline assistant for Balu AI Studio.\n\nI can point you to the right tool, explain how the free-first setup works, and give quick answers about images, thumbnails, lyrics, YouTube scripts, captions, SEO, Bible content, translation and Audio → SRT.\n\nTry asking “what tools are available?” — or just type a question.",
  },
  {
    patterns: [
      /\b(?:who are you|what are you|your name|about you|yourself)\b/,
    ],
    reply: () =>
      "I'm the built-in assistant that ships with Balu AI Studio — a free-first AI creator studio.\n\nMy job is to help you get the most out of the 14 tools, explain how to add an AI provider (opening Settings and adding a key), and answer quick questions. With no AI provider configured I answer from a built-in knowledge base; add one (OpenAI-compatible, OpenRouter or Gemini) and I become a full conversational assistant.",
  },
  {
    patterns: [
      /\b(?:what can you do|help|how (?:do|can) i use|what tools|available tools|list.*tools|capabilities|features)\b/,
    ],
    reply: () =>
      "Here's what the studio can create — everything works free, with zero API keys:\n\n• AI Image — text-to-image (Gemini Nano Banana by default, free Pollinations fallback)\n• Thumbnail — concepts + 16:9 image with text drawn on it\n• Lyrics — 6 languages, 10 song types (great Telugu)\n• Captions — per-platform captions, hashtags, CTAs\n• YouTube — titles, description, tags, hook, pinned comment\n• Scripts — hook → intro → main content → voice-over → CTA\n• SEO — titles, meta, keywords, tags (suggestions — rankings not guaranteed)\n• Video Prompts — scene-by-scene AI video prompts\n• Bible — stories, prayers, sermons (never invents quotes)\n• Translator — 6 Indian languages (needs an AI provider)\n• Audio → SRT — real, local transcription to subtitles (upload a file or paste a YouTube URL)\n• Prompt Library — 60+ ready-made prompts\n• History — every generation saved in your browser\n• Settings — provider status + setup guides\n\nWhich one would you like to try?",
  },
  {
    patterns: [
      /\b(?:image|picture|photo|art|draw|generate.*image|text.?to.?image|image generator)\b/,
    ],
    reply: () =>
      "The **AI Image** tool (/image) generates images from a description.\n\nBy default it uses Gemini (Nano Banana) with the same GEMINI_API_KEY as text; if your account has no image quota it honestly falls back to the always-free Pollinations engine and shows a notice. You can force the free engine in Settings with IMAGE_PROVIDER=pollinations, or use your local Stable Diffusion via IMAGE_PROVIDER=local.\n\nHead to /image, type your prompt, pick an engine and hit Generate.",
  },
  {
    patterns: [
      /\b(?:thumbnail)\b/,
    ],
    reply: () =>
      "The **Thumbnail** tool (/thumbnail) creates a concept sheet plus a 16:9 image, and it draws real text on the image in your language (6 scripts, real fonts).\n\nYou can paste a YouTube URL to pull the video's topic, or use the single-prompt mode. It also offers A/B variations. Open /thumbnail to start.",
  },
  {
    patterns: [
      /\b(?:lyric|song|music|worship song|christian song)\b/,
    ],
    reply: () =>
      "The **Lyrics** tool (/lyrics) writes original lyrics offline — no AI provider needed.\n\nIt supports 6 languages (Telugu, English, Hindi, Tamil, Kannada, Malayalam) and 10 song types, with natural conversational Telugu. Pick the language and song type, describe your topic, and generate. When an AI provider is configured the lyrics are written by it instead (labelled honestly).",
  },
  {
    patterns: [
      /\b(?:caption|hashtag|social (?:media|post)|instagram|facebook|twitter|x\.com|linkedin|post copy)\b/,
    ],
    reply: () =>
      "The **Captions** tool (/captions) writes short, medium and long captions plus hashtags and a call-to-action per platform.\n\nIt works offline with the template engine, and upgrades to your AI provider when one is configured. Open /captions and describe your post.",
  },
  {
    patterns: [
      /\b(?:youtube|title(s)?|video titles|description|tags?|pinned comment|hook)\b/,
    ],
    reply: () =>
      "The **YouTube** tool (/youtube) produces 10 titles, a description, tags, hashtags, a pinned comment and a hook — everything you need to publish and promote a video.\n\nIt's a template tool that upgrades to AI when a provider is configured. It never promises ranking guarantees. Open /youtube and give it your topic.",
  },
  {
    patterns: [
      /\b(?:script|voice.?over|video script|screenplay)\b/,
    ],
    reply: () =>
      "The **Scripts** tool (/scripts) builds a full video script: hook, introduction, main content, scene suggestions, voice-over and CTA — for the duration you choose.\n\nFor Telugu the voice-over block uses natural spoken Telugu. Choose a topic, duration, audience and style, then generate.",
  },
  {
    patterns: [
      /\b(?:seo|keyword|meta|search|rank|ranking|google)\b/,
    ],
    reply: () =>
      "The **SEO** tool (/seo) generates an SEO title, meta description, YouTube description, keywords, tags and hashtags.\n\nImportant: these are suggestions — the tool clearly states that SEO success is not guaranteed. It works offline with templates, or with your AI provider when set.",
  },
  {
    patterns: [
      /\b(?:video prompt|prompts?|ai video|text.?to.?video|scene.?by.?scene)\b/,
    ],
    reply: () =>
      "The **Video Prompts** tool (/prompts) writes a story bible and scene-by-scene prompts for AI video generators — each scene has visual, character, environment, camera, movement, lighting, mood and voice-over.\n\nPaste the result into your favourite AI video tool. Open /prompts to try it.",
  },
  {
    patterns: [
      /\b(?:bible|scripture|verse|prayer|sermon|worship|church|christian)\b/,
    ],
    reply: () =>
      "The **Bible** tool (/bible) creates stories, verse explanations, prayers, sermons and Christian songs — in 6 languages.\n\nIt is deliberately honest: it never invents Bible quotations. If scripture is referenced it names the translation. Open /bible and choose a format.",
  },
  {
    patterns: [
      /\b(?:translat|telugu|hindi|tamil|kannada|malayalam|indian language)\b/,
    ],
    reply: () =>
      "The **Translator** (/translate) translates across English, Telugu, Hindi, Tamil, Kannada and Malayalam, preferring natural conversational Telugu.\n\nOne honest note: translation genuinely needs an AI provider (OpenAI-compatible, OpenRouter or Gemini). Without one the tool shows you how to add a key instead of faking a translation — check /settings.",
  },
  {
    patterns: [
      /\b(?:audio|srt|subtitle|transcri|whisper|youtube.*(?:srt|subtitle)|caption.*video|karaoke)\b/,
    ],
    reply: () =>
      "**Audio → SRT** (/audio-to-srt) is the flagship: real, timestamped transcription that runs 100% locally on the server with faster-whisper — your audio never leaves the machine.\n\n• Upload MP3/WAV/M4A/MP4, or paste a YouTube URL (yt-dlp fetches the audio)\n• ~99 real languages in their own script, speech + song modes\n• Editable time-aligned subtitles, karaoke word highlighting\n• Export SRT / WebVTT / TXT with caption styles\n\nIt needs Python + faster-whisper on the host (see Settings), so it runs on your machine, a VPS or Render. On serverless hosts like Vercel, file uploads can fall back to a free cloud transcriber (AI_TRANSCRIBER_API_KEY — e.g. Groq) — YouTube links still need the local engine, and the UI labels exactly which engine ran.",
  },
  {
    patterns: [
      /\b(?:library|prompt library|prompts list)\b/,
    ],
    reply: () =>
      "The **Prompt Library** (/library) has 60+ ready-made prompts — one click to copy, or open pre-loaded in the right tool. A handy starting point if you're not sure what to ask for.",
  },
  {
    patterns: [
      /\b(?:history|previous|saved|past)\b/,
    ],
    reply: () =>
      "**History** (/history) saves every generation in your browser (localStorage) — images, lyrics, scripts, transcripts and chats. You can review and copy anything from there.",
  },
  {
    patterns: [
      /\b(?:setting|config|key|api[ -]?key|provider|token|env|add.*ai|free.*provider|ollama|groq|gemini|openrouter)\b/,
    ],
    reply: () =>
      "Great question — the app is free-first, so every tool works with zero keys. To add a real AI provider you only edit one file:\n\n1. Copy .env.example → .env.local\n2. Pick a provider and paste a key. Free options:\n   • Ollama (local, no key): AI_TEXT_PROVIDER=openai, OPENAI_BASE_URL=http://localhost:11434/v1, OPENAI_MODEL=llama3.2:3b\n   • Groq free tier: OPENAI_API_KEY=… with base https://api.groq.com/openai/v1\n   • Gemini free tier: AI_TEXT_PROVIDER=gemini, GEMINI_API_KEY=…\n   • OpenRouter :free models: AI_TEXT_PROVIDER=openrouter, OPENROUTER_API_KEY=…\n3. Restart the dev server.\n\nEvery tool picks it up automatically, and output is labelled “AI provider”. In development you can also switch provider/model at runtime in Settings without editing files. Keys stay server-side only.",
  },
  {
    patterns: [
      /\b(?:free|cost|price|paid|money|subscription|charge)\b/,
    ],
    reply: () =>
      "Everything here is free-first: templates, dashboard, library, history and settings work with zero API keys, and there are no locked features or upsell walls.\n\nAdding a provider is optional — it only upgrades quality. Even the free providers (Gemini free tier, Groq, OpenRouter :free, local Ollama) work without paying.",
  },
  {
    patterns: [
      /\b(?:thank|thanks|thx|great|awesome)\b/,
    ],
    reply: () =>
      "You're welcome! 🙌 If you'd like a richer, open-ended conversation, add any AI provider in /settings — otherwise I'll keep answering from the built-in guide. Anything else?",
  },
  {
    patterns: [
      /\b(?:bye|goodbye|see you|cya|exit)\b/,
    ],
    reply: () =>
      "Goodbye! 👋 Come back any time — or open a tool and start creating. Create More. For Free.",
  },
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ");
}

/** Pick the best intent match — the one whose match starts earliest, then longest. */
function bestIntent(text: string): Intent | undefined {
  const n = normalize(text);
  let best: { intent: Intent; index: number; length: number } | undefined;
  for (const intent of INTENTS) {
    for (const re of intent.patterns) {
      const m = n.match(re);
      if (!m || m.index === undefined) continue;
      if (!best || m.index < best.index || (m.index === best.index && m[0].length > best.length)) {
        best = { intent, index: m.index, length: m[0].length };
      }
    }
  }
  return best?.intent;
}

const FALLBACK: string =
  "I'm the offline assistant, so I can only answer from the studio's built-in guide (tools, setup, free providers). I don't have an AI brain wired up on this page right now — that's the honest answer.\n\nTo chat about anything open-ended (drafts, ideas, translations), add a free AI provider in /settings — for example a Gemini free-tier key, Groq, or a local Ollama model. Then this chat becomes a full AI conversation.\n\nFor now, try asking: “what tools are available?” or “how do I set up an AI provider?”";

/**
 * Answer a message with the offline rule-based assistant.
 * The offline agent answers every turn independently (it has no memory); the
 * conversation history lives client-side and only the AI provider path uses it.
 */
export function chatTemplate(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return FALLBACK;
  const intent = bestIntent(trimmed);
  return intent ? intent.reply() : FALLBACK;
}