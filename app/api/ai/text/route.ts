import { guardedGenerate, badRequest, parseGenBody } from "@/lib/api/generate-route";

export async function POST(req: Request) {
  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }
  const body = parseGenBody(parsed);
  if (!body || !body.input) {
    return badRequest("Body must include an object in `input`.");
  }
  const tool = (body.tool ?? "").toString();
  if (!tool) return badRequest("Missing `tool`.");
  return guardedGenerate(req, tool, body);
}