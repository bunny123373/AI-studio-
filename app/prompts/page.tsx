import type { Metadata } from "next";

import { GenPage } from "@/components/common/gen-page";
import { LANGUAGES } from "@/lib/ai/text/langs";

export const metadata: Metadata = { title: "AI Video Prompt Generator" };

export default function PromptsPage() {
  return (
    <GenPage
      title="AI Video Prompt Generator"
      subtitle="Scene-by-scene AI video prompts — visual, character, environment, camera, movement, lighting, mood and voice-over per scene."
      endpoint="/api/video-prompt"
      tool="video-prompt"
      toolLabel="Video prompts"
      fileName="video-prompts.txt"
      language={{ default: "en", options: LANGUAGES.map((l) => l.value) }}
      fields={[
        { name: "story", label: "Story", kind: "textarea", required: true, placeholder: "Describe your story in a few sentences...", query: "story" },
        { name: "duration", label: "Duration (seconds)", kind: "select", options: ["30", "60", "180", "300", "600"], default: "60" },
        { name: "visualStyle", label: "Visual Style", kind: "select", options: ["cinematic", "anime", "3d", "realistic", "illustration", "pixar", "documentary", "motion graphics"], default: "cinematic" },
        { name: "aspectRatio", label: "Aspect Ratio", kind: "select", options: ["16:9", "9:16", "1:1", "4:3"], default: "16:9" },
        { name: "cameraStyle", label: "Camera Style", kind: "select", options: ["cinematic", "handheld", "documentary", "drone", "static", "slow motion"], default: "cinematic" },
        { name: "lighting", label: "Lighting", kind: "select", options: ["golden hour", "neon", "soft studio", "dramatic", "moody", "bright daylight"], default: "golden hour" },
      ]}
    />
  );
}