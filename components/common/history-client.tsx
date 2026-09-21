"use client";

import * as React from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { CopyButton } from "@/components/common/copy-button";
import { DownloadButton } from "@/components/common/download-button";
import { Badge } from "@/components/ui/badge";
import { getHistoryStore, type HistoryItem } from "@/lib/storage/history";
import { fmtClock } from "@/lib/utils";

const TOOL_LINK: Record<string, string> = {
  image: "/image",
  thumbnail: "/thumbnail",
  lyrics: "/lyrics",
  caption: "/captions",
  youtube: "/youtube",
  script: "/scripts",
  seo: "/seo",
  "video-prompt": "/prompts",
  bible: "/bible",
  translate: "/translate",
  library: "/library",
  "audio-to-srt": "/audio-to-srt",
  "bible-story": "/bible",
  "bible-verse": "/bible",
  "christian-song": "/bible",
  prayer: "/bible",
  sermon: "/bible",
  "christian-script": "/bible",
  "christian-thumbnail": "/bible",
};

const TOOL_DEFAULT_LINK = "/";

export function HistoryClient() {
  const [items, setItems] = React.useState<HistoryItem[]>(() =>
    getHistoryStore().list(),
  );
  // Live "… ago" timestamps — refresh the clock every 30s.
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(t);
  }, []);

  const refresh = React.useCallback(() => {
    setItems(getHistoryStore().list());
  }, []);

  const remove = (id: string) => {
    getHistoryStore().remove(id);
    refresh();
  };

  const clearAll = () => {
    if (window.confirm("Delete all history? This cannot be undone.")) {
      getHistoryStore().clear();
      refresh();
    }
  };

  const preview = (t: string, max = 160) =>
    t.length > max ? t.slice(0, max) + "…" : t;

  return (
    <div>
      <PageHeader
        title="History"
        subtitle="Your recent generations, stored in this browser only (nothing is sent to a server)."
      />

      {items.length === 0 ? (
        <EmptyState
          title="No history yet"
          message="Generate something in any tool and it will show up here."
        />
      ) : (
        <>
          <div className="mb-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={clearAll}>
              <Trash2 /> Clear all
            </Button>
          </div>
          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item.id} className="border-border">
                <CardContent className="p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={item.status === "success" ? "default" : "destructive"}>
                        {item.toolLabel}
                      </Badge>
                      {item.mode ? (
                        <span className="text-[11px] text-muted-foreground">
                          {item.mode === "ai" ? "AI provider" : "Free template"}
                        </span>
                      ) : null}
                      <span className="text-[11px] text-muted-foreground">
                        {fmtClock((now - item.createdAt) / 1000)} ago
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <CopyButton text={item.resultText} label="Copy" className="h-7 text-xs" />
                      <DownloadButton
                        filename={`${item.tool}-${item.id}.txt`}
                        text={item.resultText}
                        label="Save"
                        className="h-7 text-xs"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                        onClick={() => remove(item.id)}
                        aria-label="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{preview(item.prompt)}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-foreground/80">
                    {preview(item.resultText.replace(/\n+/g, " "), 200)}
                  </p>
                  <Link
                    href={TOOL_LINK[item.tool] ?? TOOL_DEFAULT_LINK}
                    className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
                  >
                    Open tool →
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}