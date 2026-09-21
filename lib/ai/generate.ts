import type {
  GenerationRequest,
  GenerationResult,
  OutputBlock,
} from "@/lib/ai/types";
import { getTextProvider } from "@/lib/ai/text";
import { runTemplate } from "@/lib/ai/text/templates";

const SYSTEM_FOR: Record<string, string> = {
  lyrics:
    "You are a professional songwriter. Write original lyrics in the exact language requested. Natural, conversational language, NOT literal translation. Structured sections: Intro, Verse 1, Pre-Chorus, Chorus, Verse 2, Bridge, Final Chorus, Outro. Mark each section with '## '.",
  "christian-song":
    "You are a Christian worship songwriter. Write original worship lyrics (never quote copyrighted material or invent Bible verses) in the requested language. Mark sections with '## '.",
  caption:
    "You are a social media copywriter. Create short, medium and long captions (mark with '## Short', '## Medium', '## Long'), a hashtag list ('## Hashtags') and a CTA ('## Call To Action').",
  youtube:
    "You are a YouTube strategist. Produce: '## 10 YouTube Titles', '## Description', '## Tags', '## Hashtags', '## Pinned Comment', '## Thumbnail Text', '## Hook', '## Call To Action', '## SEO Note'. Never promise ranking guarantees.",
  script:
    "You are a video scriptwriter. Produce: '## Hook', '## Introduction', '## Main Content', '## Scene Suggestions', '## Voice-over' (natural spoken language for voice-over), '## CTA'.",
  seo: "You are an SEO specialist. Produce: '## SEO Title', '## Meta Description', '## YouTube Description', '## Keywords', '## Tags', '## Hashtags', '## Note' (mention rankings are not guaranteed).",
  "video-prompt":
    "You are an AI video prompt engineer. Create a story bible then scene-by-scene prompts. Each scene has Visual, Character, Environment, Camera, Movement, Lighting, Mood, Voice-over. Mark scenes with '## Scene N'.",
  "bible-story":
    "Create a Bible story retelling. Do NOT invent Bible quotations; if scripture is referenced, name the translation. Produce '## Title', '## Outline', '## Retelling', '## Faith Lesson'.",
  "bible-verse":
    "Explain the exact verse the user pasted (quote it with the chosen translation, matching it verbatim). Sections: '## Your Selected Verse', '## Context', '## Meaning', '## Application'. Never invent a different wording.",
  prayer:
    "Write a sincere, natural prayer with '## Prayer' and '## Prayer Points'.",
  sermon:
    "Write a sermon outline with '## Sermon Title' and '## Outline' and '## Application Question'.",
  "christian-script":
    "Write a Christian YouTube video script with '## Hook', '## Introduction', '## Main Content', '## Scene Suggestions', '## Voice-over', '## CTA'.",
  "christian-thumbnail": "Give a short, punchy Christian thumbnail image prompt and text suggestion with minimal words on the image.",
  thumbnail:
    "Create a YouTube thumbnail concept: '## Concept', '## Thumbnail Text Suggestions', '## Layout Suggestion', '## Color Suggestion', '## Image Generation Prompt'. Keep text on image minimal — at most 4 short words. Write the Thumbnail Text Suggestions in the language from the prompt's Language field (if it is not English); the Image Generation Prompt should describe a scene with empty space for the text.",
};

export function defaultSystem(tool: string): string {
  return SYSTEM_FOR[tool] ?? "You are a helpful AI creative assistant.";
}

function parseBlocks(text: string): OutputBlock[] {
  const lines = text.split("\n");
  const blocks: OutputBlock[] = [];
  let current: OutputBlock | null = null;
  for (const line of lines) {
    const m = line.match(/^##\s+(.*)$/);
    if (m) {
      if (current) blocks.push(current);
      current = { title: m[1].trim(), text: "" };
    } else if (current) {
      current.text += (current.text ? "\n" : "") + line;
    }
  }
  if (current) blocks.push(current);
  if (blocks.length === 0) {
    blocks.push({ title: "Result", text });
  }
  return blocks;
}

function buildPrompt(req: GenerationRequest): string {
  const lines: string[] = [`Language: ${req.language ?? "auto"}`, `Tool: ${req.tool}`];
  for (const [k, v] of Object.entries(req.input)) {
    if (v !== undefined && v !== "") lines.push(`${k}: ${v}`);
  }
  return lines.join("\n");
}

/**
 * Generate content for a tool — uses the configured AI provider when
 * available, otherwise the free template engine. The result always
 * carries an honest `mode` flag.
 */
export async function generateText(
  req: GenerationRequest,
): Promise<GenerationResult> {
  const provider = getTextProvider();

  if (provider.configured) {
    try {
      const prompt = buildPrompt(req);
      const raw = await provider.generate(prompt, {
        system: defaultSystem(req.tool),
      });
      const blocks = parseBlocks(raw);
      return {
        ok: true,
        mode: "ai",
        tool: req.tool,
        blocks,
        raw,
      };
    } catch (err) {
      const note =
        `AI provider failed (${err instanceof Error ? err.message : "unknown error"}). ` +
        `Showing the free template result instead.`;
      const blocks = runTemplate(req.tool, req.input);
      return {
        ok: true,
        mode: "template",
        tool: req.tool,
        blocks,
        raw: blocks.map((b) => b.text).join("\n\n"),
        notice: note,
      };
    }
  }

  const blocks = runTemplate(req.tool, req.input);
  return {
    ok: true,
    mode: "template",
    tool: req.tool,
    blocks,
    raw: blocks.map((b) => b.text).join("\n\n"),
  };
}