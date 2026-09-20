import type { Metadata } from "next";

import { LibraryClient } from "@/components/common/library-client";

export const metadata: Metadata = { title: "Prompt Library" };

export default function LibraryPage() {
  return <LibraryClient />;
}