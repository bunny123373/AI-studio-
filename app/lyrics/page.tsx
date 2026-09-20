import type { Metadata } from "next";

import { GenPage } from "@/components/common/gen-page";
import { LANGUAGES } from "@/lib/ai/text/langs";

export const metadata: Metadata = { title: "Lyrics Generator" };

export default function LyricsPage() {
  return (
    <GenPage
      title="Lyrics Generator"
      subtitle="Natural, structured lyrics — Intro → Verse → Chorus → Bridge → Outro. Telugu output is conversational, not machine-translated."
      endpoint="/api/lyrics"
      tool="lyrics"
      toolLabel="Lyrics"
      fileName="lyrics.txt"
      language={{ default: "te", options: LANGUAGES.map((l) => l.value), title: "Language" }}
      note="Song names and lyrics are starting points — adapt them to your artist. Copyright holders may own the rights to a finished song."
      fields={[
        { name: "songType", label: "Song Type", kind: "select", options: ["worship", "devotional", "love", "sad", "motivational", "folk", "tribal", "cinematic", "pop", "melody"], default: "worship" },
        { name: "mood", label: "Mood", kind: "select", options: ["peaceful", "emotional", "hopeful", "powerful", "joyful", "sad"], default: "hopeful" },
        { name: "topic", label: "Song Topic", kind: "text", required: true, placeholder: "e.g. స్తుతి / worship / love", query: "topic" },
        { name: "message", label: "Main Message", kind: "text", placeholder: "What should the song communicate?" },
        { name: "singerType", label: "Singer Type", kind: "select", options: ["male", "female", "duet", "choir", "children"], default: "male" },
        { name: "length", label: "Song Length (minutes)", kind: "number", default: "4", hint: "Longer songs get more verses." },
      ]}
    />
  );
}