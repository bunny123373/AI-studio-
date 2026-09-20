import type { Metadata } from "next";

import { GenPage } from "@/components/common/gen-page";
import { LANGUAGES } from "@/lib/ai/text/langs";

export const metadata: Metadata = { title: "YouTube Content Generator" };

export default function YouTubePage() {
  return (
    <GenPage
      title="YouTube Content Generator"
      subtitle="10 titles, description, tags, hashtags, pinned comment, thumbnail text, hook and CTA for one video."
      endpoint="/api/youtube"
      tool="youtube"
      toolLabel="YouTube content"
      fileName="youtube-package.txt"
      language={{ default: "en", options: LANGUAGES.map((l) => l.value) }}
      note="SEO suggestions are estimates — they do not guarantee rankings."
      fields={[
        { name: "topic", label: "Video Topic", kind: "text", required: true, placeholder: "e.g. worship guitar tutorial", query: "topic" },
        { name: "audience", label: "Audience", kind: "text", placeholder: "e.g. beginner guitarists" },
        { name: "videoType", label: "Video Type", kind: "select", options: ["vlog", "tutorial", "review", "documentary", "reaction", "sermon", "music"], default: "tutorial" },
      ]}
    />
  );
}