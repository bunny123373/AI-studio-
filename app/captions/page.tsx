import type { Metadata } from "next";

import { GenPage } from "@/components/common/gen-page";
import { LANGUAGES } from "@/lib/ai/text/langs";

export const metadata: Metadata = { title: "Caption Generator" };

export default function CaptionsPage() {
  return (
    <GenPage
      title="Caption Generator"
      subtitle="Short, medium and long captions with hashtags and a call to action for every platform."
      endpoint="/api/caption"
      tool="caption"
      toolLabel="Captions"
      fileName="caption.txt"
      language={{ default: "en", options: LANGUAGES.map((l) => l.value) }}
      fields={[
        { name: "topic", label: "Topic", kind: "text", required: true, placeholder: "What is the post about?", query: "topic" },
        { name: "platform", label: "Platform", kind: "select", options: ["youtube", "instagram", "facebook", "tiktok", "threads"], default: "instagram" },
        { name: "tone", label: "Tone", kind: "select", options: ["professional", "emotional", "funny", "inspirational", "christian", "cinematic", "casual"], default: "casual" },
        { name: "audience", label: "Audience", kind: "text", placeholder: "e.g. young creators, parents, students" },
      ]}
    />
  );
}