import type { Metadata } from "next";

import { ThumbnailClient } from "@/components/common/thumbnail-client";

export const metadata: Metadata = { title: "Thumbnail Generator" };

export default function ThumbnailPage() {
  return <ThumbnailClient />;
}