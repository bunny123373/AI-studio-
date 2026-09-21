import type { Metadata } from "next";

import { SettingsClient } from "@/components/common/settings-client";
import { runtimePickerEnabled } from "@/lib/ai/config";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return <SettingsClient showPicker={runtimePickerEnabled()} />;
}