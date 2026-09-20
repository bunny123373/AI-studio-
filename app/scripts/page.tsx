import type { Metadata } from "next";

import { GenPage } from "@/components/common/gen-page";
import { LANGUAGES } from "@/lib/ai/text/langs";

export const metadata: Metadata = { title: "Script Generator" };

export default function ScriptsPage() {
  return (
    <GenPage
      title="Script Generator"
      subtitle="Hook, intro, main content, scene suggestions, voice-over and CTA — built for the duration you choose."
      endpoint="/api/script"
      tool="script"
      toolLabel="Script"
      fileName="script.txt"
      language={{ default: "en", options: LANGUAGES.map((l) => l.value) }}
      note="For Telugu scripts, the voice-over block uses natural spoken Telugu suitable for recording."
      fields={[
        { name: "topic", label: "Topic", kind: "text", required: true, placeholder: "What is the video about?", query: "topic" },
        { name: "duration", label: "Duration", kind: "select", options: ["30", "60", "180", "300", "600"], default: "60", hint: "seconds" },
        { name: "audience", label: "Audience", kind: "text", placeholder: "e.g. beginners, teens, church" },
        { name: "style", label: "Style", kind: "select", options: ["educational", "storytelling", "cinematic", "youtube", "shorts", "documentary", "christian", "vlog"], default: "educational" },
      ]}
    />
  );
}