import type { Metadata } from "next";

import { ImageClient } from "@/components/common/image-client";

export const metadata: Metadata = { title: "AI Image Generator" };

export default function ImagePage() {
  return <ImageClient />;
}