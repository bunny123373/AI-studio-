import type { Metadata } from "next";

import { AudioSrtClient } from "@/components/common/audio-srt-client";

export const metadata: Metadata = { title: "Audio → SRT Subtitles" };

export default function AudioToSrtPage() {
  return <AudioSrtClient />;
}