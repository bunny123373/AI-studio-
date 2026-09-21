"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, FolderOpen, Search } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/common/page-header";
import { CopyButton } from "@/components/common/copy-button";
import { Badge } from "@/components/ui/badge";
import { getHistoryStore } from "@/lib/storage/history";
import { uid } from "@/lib/utils";

interface LibPrompt {
  category: string;
  text: string;
  href?: string;
}

const PROMPTS: LibPrompt[] = [
  // Christian / Bible
  { category: "Christian", text: "worship guitarist silhouette at golden sunset, cinematic, vibrant colors", href: "/image" },
  { category: "Christian", text: "open Bible with rays of light breaking through clouds, reverent, cinematic", href: "/image" },
  { category: "Christian", text: "praying hands, soft golden light, minimal, emotional", href: "/image" },
  { category: "Christian", text: "Glory to God, powerful and uplifting worship song", href: "/lyrics" },
  { category: "Christian", text: "Grace in every season of life", href: "/captions" },
  { category: "Christian", text: "5 signs God is preparing you for a breakthrough", href: "/youtube" },
  { category: "Christian", text: "David and Goliath — a story of faith", href: "/bible" },
  { category: "Christian", text: "The Lord is my Shepherd — verse explanation", href: "/bible" },
  { category: "Christian", text: "Prayer for peace and healing", href: "/bible" },
  { category: "Christian", text: "Sermon on the power of forgiveness", href: "/bible" },
  // Telugu
  { category: "Telugu", text: "స్తుతి — ఒక సహజమైన ఆరాధన పాట (natural Telugu worship song)", href: "/lyrics" },
  { category: "Telugu", text: "ప్రేమ — తీయని ప్రేమ పాట తెలుగులో", href: "/lyrics" },
  { category: "Telugu", text: "జానపదం — మా ఊరి జానపద పాట", href: "/lyrics" },
  { category: "Telugu", text: "దేవుని ప్రేమ గురించి సినిమాటిక్ థంబ్నెయిల్", href: "/thumbnail" },
  { category: "Telugu", text: "తెలుగు భక్తిపాటలు — SEO కీవర్డ్", href: "/seo" },
  { category: "Telugu", text: "మీరు ఎంపిక చేసిన వాక్యాన్ని తెలుగులో వివరించండి", href: "/bible" },
  { category: "Telugu", text: "నేటి పాఠం — తెలుగు ఉపన్యాస ఆకృతి", href: "/bible" },
  // Content creation
  { category: "YouTube", text: "10 mistakes every YouTuber makes", href: "/youtube" },
  { category: "YouTube", text: "how to edit videos faster", href: "/youtube" },
  { category: "YouTube", text: "tutorial on using CapCut for beginners", href: "/scripts" },
  { category: "YouTube", text: "day in the life of a creator", href: "/scripts" },
  { category: "YouTube", text: "What I learned in my first 100 videos", href: "/captions" },
  { category: "SEO", text: "how to grow a YouTube channel", href: "/seo" },
  { category: "SEO", text: "best free video editor", href: "/seo" },
  { category: "SEO", text: "telugu christian songs", href: "/seo" },
  // Social
  { category: "Social", text: "5 mindset shifts that changed everything", href: "/captions" },
  { category: "Social", text: "behind the scenes of filming today", href: "/captions" },
  { category: "Social", text: "biblical encouragement for a hard week", href: "/captions" },
  { category: "Social", text: "simple morning routine that boosts productivity", href: "/captions" },
  // Image prompts
  { category: "Image", text: "portrait of a confident creator with ring light reflection", href: "/image" },
  { category: "Image", text: "drone view of sunrise over Indian village, golden light", href: "/image" },
  { category: "Image", text: "cinematic cityscape at night, neon reflections, rain", href: "/image" },
  { category: "Image", text: "cute 3D character holding a microphone, studio lighting", href: "/image" },
  { category: "Image", text: "abstract gradient background with soft bokeh, dark mode friendly", href: "/image" },
  { category: "Image", text: "anime style hero standing on cliff looking at the horizon", href: "/image" },
  // Video prompts
  { category: "Video", text: "a lone traveller walking through misty mountains at dawn, cinematic", href: "/prompts" },
  { category: "Video", text: "a dancer performing under spotlight on an empty stage, emotional", href: "/prompts" },
  { category: "Video", text: "a chef cooking traditional food in a rustic kitchen, warm light", href: "/prompts" },
  { category: "Video", text: "rain drops on leaves, timelapse, nature documentary style", href: "/prompts" },
  { category: "Video", text: "a child blowing birthday candles, joyful family moment", href: "/prompts" },
  // Scripts
  { category: "Script", text: "explain the basics of sound engineering for worship", href: "/scripts" },
  { category: "Script", text: "react to trending Telugu song, respectful commentary", href: "/scripts" },
  { category: "Script", text: "top 5 Bible reading apps, 6 minutes", href: "/scripts" },
  // Music
  { category: "Music", text: "melody — soft romantic song about first love", href: "/lyrics" },
  { category: "Music", text: "motivational — never give up, uplifting anthem", href: "/lyrics" },
  { category: "Music", text: "tribal — folk dance song celebrating the hills", href: "/lyrics" },
  { category: "Music", text: "cinematic — hero intro song, mass beat", href: "/lyrics" },
  { category: "Music", text: "pop — party anthem in English", href: "/lyrics" },
];

const CATEGORY_LABEL: Record<string, string> = {
  Christian: "Christian",
  Telugu: "Telugu",
  YouTube: "YouTube",
  SEO: "SEO",
  Social: "Social",
  Image: "Image",
  Video: "Video",
  Script: "Script",
  Music: "Music",
};

export function LibraryClient() {
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<string>("All");

  const categories = ["All", ...Array.from(new Set(PROMPTS.map((p) => p.category)))];

  const filtered = PROMPTS.filter((p) => {
    if (category !== "All" && p.category !== category) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      p.text.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  const trackCopy = (p: LibPrompt) => {
    getHistoryStore().add({
      id: uid("h"),
      tool: "library",
      toolLabel: "Prompt Library",
      prompt: p.text,
      resultText: p.text,
      status: "success",
    });
  };

  return (
    <div>
      <PageHeader
        title="Prompt Library"
        subtitle="60+ ready-made prompts. Copy one or open the tool with it preloaded."
        badge={<Badge variant="success">{PROMPTS.length} prompts</Badge>}
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Search prompts"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search prompts..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors ${
                category === c
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {CATEGORY_LABEL[c] ?? c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <FolderOpen className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No prompts match “{query}”.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((p, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    {CATEGORY_LABEL[p.category] ?? p.category}
                  </span>
                  <CopyButton
                    text={p.text}
                    label="Copy"
                    className="h-7 text-xs"
                    onCopied={() => trackCopy(p)}
                  />
                </div>
                <p className="text-sm leading-6 text-foreground/90">{p.text}</p>
                {p.href ? (
                  <Link
                    href={p.href}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    Open in tool <ArrowUpRight className="size-3.5" />
                  </Link>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}