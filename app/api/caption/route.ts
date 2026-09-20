import { badRequest, guardedGenerate, parseGenBody } from "@/lib/api/generate-route";

export async function POST(req: Request) {
  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }
  const body = parseGenBody(parsed);
  if (!body || !body.input) return badRequest("Body must include `input`.");
  return guardedGenerate(req, "caption", body);
}