import type { Metadata } from "next";

import { GenPage } from "@/components/common/gen-page";
import { LANGUAGES } from "@/lib/ai/text/langs";

export const metadata: Metadata = { title: "SEO Generator" };

export default function SeoPage() {
  return (
    <GenPage
      title="SEO Generator"
      subtitle="SEO title, meta description, YouTube description, keywords, tags and hashtags for one keyword."
      endpoint="/api/seo"
      tool="seo"
      toolLabel="SEO content"
      fileName="seo.txt"
      language={{ default: "en", options: LANGUAGES.map((l) => l.value) }}
      note="SEO suggestions are generated estimates and do not guarantee rankings."
      fields={[
        { name: "keyword", label: "Keyword", kind: "text", required: true, placeholder: "e.g. telugu worship songs", query: "keyword" },
        { name: "topic", label: "Topic", kind: "text", placeholder: "Broader topic if different from the keyword" },
        { name: "platform", label: "Platform", kind: "select", options: ["youtube", "google", "instagram", "blog"], default: "youtube" },
      ]}
    />
  );
}