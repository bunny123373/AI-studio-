"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { downloadTextFile } from "@/lib/utils";

export function DownloadButton({
  filename,
  text,
  label = "Download",
  mime,
  className,
}: {
  filename: string;
  text: string;
  label?: string;
  mime?: string;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      onClick={() => downloadTextFile(filename, text, mime)}
      disabled={!text}
    >
      <Download />
      {label}
    </Button>
  );
}