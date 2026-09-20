import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Balu AI Studio — Create More. For Free.",
    template: "%s — Balu AI Studio",
  },
  description:
    "Create images, thumbnails, lyrics, scripts and content with AI. Free-first AI creator studio with Telugu support.",
  applicationName: "Balu AI Studio",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}