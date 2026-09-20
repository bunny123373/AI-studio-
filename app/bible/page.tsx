import type { Metadata } from "next";

import { BibleClient } from "@/components/common/bible-client";

export const metadata: Metadata = { title: "Bible Content Generator" };

export default function BiblePage() {
  return <BibleClient />;
}