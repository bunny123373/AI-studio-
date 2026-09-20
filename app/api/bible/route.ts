import { badRequest, guardedGenerate, parseGenBody } from "@/lib/api/generate-route";

/**
 * Bible content generator. `input.bibleTool` selects the sub-tool:
 * story | verse | song | prayer | sermon | script | thumbnail
 */
const TOOL_MAP: Record<string, string> = {
  story: "bible-story",
  verse: "bible-verse",
  song: "christian-song",
  prayer: "prayer",
  sermon: "sermon",
  script: "christian-script",
  thumbnail: "christian-thumbnail",
};

export async function POST(req: Request) {
  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }
  const body = parseGenBody(parsed);
  if (!body || !body.input) return badRequest("Body must include `input`.");
  const sub = (body.input.bibleTool ?? "story").toString();
  const tool = TOOL_MAP[sub] ?? "bible-story";
  return guardedGenerate(req, tool, body);
}