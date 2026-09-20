import type { Metadata } from "next";

import { HistoryClient } from "@/components/common/history-client";

export const metadata: Metadata = { title: "History" };

export default function HistoryPage() {
  return <HistoryClient />;
}