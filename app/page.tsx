import Link from "next/link";
import {
  AudioLines,
  Clapperboard,
  Image as ImageIcon,
  Mic,
  Rocket,
  Zap,
} from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { ToolCard } from "@/components/common/tool-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TOOL_CARDS } from "@/components/layout/nav";

const STATS = [
  { value: "13", label: "Creator tools" },
  { value: "$0", label: "Required to start" },
  { value: "6", label: "Indian languages" },
  { value: "Local", label: "Transcription option" },
];

const QUICK: {
  href: string;
  icon: typeof Zap;
  label: string;
  sample: string;
}[] = [
  {
    href: "/image?prompt=worship%20guitar%20silhouette%20golden%20sunset%20cinematic%20vibrant",
    icon: ImageIcon,
    label: "Generate an image",
    sample: "“worship guitar, golden sunset, cinematic”",
  },
  {
    href: "/thumbnail?style=christian&emotion=powerful",
    icon: Clapperboard,
    label: "Make a thumbnail",
    sample: "YouTube thumbnail concept",
  },
  {
    href: "/lyrics?language=te&songType=worship&topic=%E0%B0%B8%E0%B1%8D%E0%B0%A4%E0%B1%81%E0%B0%A4%E0%B0%BF",
    icon: Mic,
    label: "Write Telugu lyrics",
    sample: "Worship song in Telugu",
  },
  {
    href: "/audio-to-srt",
    icon: AudioLines,
    label: "Transcribe audio",
    sample: "MP3 → .srt subtitles (local)",
  },
];

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Welcome to Balu AI Studio"
        subtitle="Create images, thumbnails, lyrics, scripts and content with AI."
        badge={<Badge variant="success">Free-first</Badge>}
      />

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATS.map((s) => (
          <Card key={s.label} className="border-border">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <section aria-labelledby="tools-heading" className="mb-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 id="tools-heading" className="text-lg font-semibold">
            Creator tools
          </h2>
          <span className="text-xs text-muted-foreground">
            Everything runs free — optional AI providers upgrade quality.
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOOL_CARDS.map((t) => (
            <ToolCard
              key={t.href}
              href={t.href}
              icon={t.icon}
              title={t.title}
              description={t.desc}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="quick-heading">
        <div className="mb-4 flex items-center gap-2">
          <Rocket className="size-5 text-primary" />
          <h2 id="quick-heading" className="text-lg font-semibold">
            Quick Create
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK.map((q) => {
            const Icon = q.icon;
            return (
              <Link
                key={q.href}
                href={q.href}
                className="group rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Icon className="size-5 text-primary" />
                <div className="mt-2 text-sm font-semibold">{q.label}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {q.sample}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <Card className="mt-10 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="size-5 text-primary" />
            Free-first by design
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          <p>
            Every template generator (lyrics, captions, scripts, SEO, prompts)
            works offline with zero API keys. Image generation uses a free
            keyless service, and Audio → SRT transcribes locally with
            faster-whisper. Want higher quality? Open{" "}
            <Link href="/settings" className="text-primary hover:underline">
              Settings
            </Link>{" "}
            and add any OpenAI-compatible provider with one environment
            variable — never required, never exposed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}