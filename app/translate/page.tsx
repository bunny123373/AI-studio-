import type { Metadata } from "next";

import { TranslateClient } from "@/components/common/translate-client";

export const metadata: Metadata = { title: "Translator" };

export default function TranslatePage() {
  return <TranslateClient />;
}