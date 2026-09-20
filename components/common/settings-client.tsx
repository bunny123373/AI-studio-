"use client";

import * as React from "react";
import {
  CheckCircle2,
  Image as ImageIcon,
  Mic,
  Settings2,
  Sparkles,
  XCircle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/common/loading-state";

interface Status {
  ok?: boolean;
  text?: { id: string; label: string; configured: boolean };
  image?: { id: string; label: string; configured: boolean };
  whisper?: { configured: boolean; model: string; note?: string };
  ffmpeg?: { found: boolean };
}

function Row({
  icon,
  title,
  status,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  status: "ok" | "no";
  detail: React.ReactNode;
}) {
  return (
    <Card className="border-border">
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-muted text-primary">
            {icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">{title}</h3>
              {status === "ok" ? (
                <CheckCircle2 className="size-4 text-emerald-400" />
              ) : (
                <XCircle className="size-4 text-muted-foreground" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">{detail}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const CODE = "font-mono text-[11px] text-primary";

export function SettingsClient() {
  const [status, setStatus] = React.useState<Status | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/settings/status")
      .then((r) => r.json())
      .then((d: Status) => setStatus(d))
      .catch(() => setError("Could not load provider status."));
  }, []);

  const statusPill = (configured: boolean) => (
    <Badge variant={configured ? "success" : "secondary"}>
      {configured ? "Configured" : "Not configured"}
    </Badge>
  );

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="See which AI providers are active. Everything is configured through environment variables — never in the browser."
        badge={<Badge variant="secondary">No secrets here</Badge>}
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {!status && !error ? <LoadingState message="Checking providers..." /> : null}

      {status ? (
        <div className="mb-8 grid gap-3 md:grid-cols-2">
          <Row
            icon={<Sparkles className="size-5" />}
            title="Text AI provider"
            status={status.text?.configured ? "ok" : "no"}
            detail={
              <span>
                {statusPill(status.text?.configured ?? false)}
                <span className="ml-2">
                  {status.text
                    ? `${status.text.label}${status.text.id === "template" ? " (offline, always works)" : ""}`
                    : "template"}
                </span>
              </span>
            }
          />
          <Row
            icon={<ImageIcon className="size-5" />}
            title="Image provider"
            status={status.image?.configured ? "ok" : "no"}
            detail={
              <span>
                {statusPill(status.image?.configured ?? false)}
                <span className="ml-2">{status.image?.label}</span>
              </span>
            }
          />
          <Row
            icon={<Mic className="size-5" />}
            title="Audio → SRT (faster-whisper)"
            status={status.whisper?.configured ? "ok" : "no"}
            detail={
              <span>
                {status.whisper
                  ? `model: ${status.whisper.model} · runs 100% locally`
                  : "Install Python + faster-whisper (instructions below)"}
              </span>
            }
          />
          <Row
            icon={<Settings2 className="size-5" />}
            title="FFmpeg"
            status={status.ffmpeg?.found ? "ok" : "no"}
            detail={
              status.ffmpeg?.found
                ? "Found — audio conversion works."
                : "Not found — WAV uploads still work; other formats need FFmpeg."
            }
          />
        </div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Text AI provider</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Default is the <b className="text-foreground">offline template engine</b> — no
              keys, works without internet. To upgrade, create{" "}
              <code className={CODE}>.env.local</code>:
            </p>
            <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 text-xs leading-5">
              {`# any OpenAI-compatible endpoint (OpenAI, Groq, DeepSeek, Ollama...)\nAI_TEXT_PROVIDER=openai\nOPENAI_API_KEY=sk-...\nOPENAI_BASE_URL=https://api.openai.com/v1\nOPENAI_MODEL=gpt-4o-mini\n\n# or Google Gemini (free tier)\n# AI_TEXT_PROVIDER=gemini\n# GEMINI_API_KEY=...`}
            </pre>
            <p>
              When a provider is configured, generated content is labelled{" "}
              <Badge variant="success" className="align-middle">AI provider</Badge>. If the
              provider fails it falls back to the template.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Image provider</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Default is <b className="text-foreground">Pollinations.ai</b> — free, no key,
              needs internet. It can be busy; hit “New variation” to retry.
            </p>
            <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 text-xs leading-5">
              {`IMAGE_PROVIDER=pollinations   # free, keyless (default)\n# IMAGE_PROVIDER=local        # local Stable Diffusion\n# LOCAL_SD_URL=http://127.0.0.1:7860\n# IMAGE_PROVIDER=none         # disable`}
            </pre>
            <p>Keys are never exposed to the browser — the server makes every call.</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Audio → SRT setup (one-time)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Transcription runs fully locally with{" "}
              <b className="text-foreground">faster-whisper</b> (free, open-source). You
              need Python and one package:
            </p>
            <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 text-xs leading-5">
              {`pip install faster-whisper   # or: py -m pip install faster-whisper`}
            </pre>
            <ul className="list-inside list-disc space-y-1 text-xs">
              <li>
                The first run downloads the Whisper model (internet needed once;
                ~75 MB for &quot;small&quot;).
              </li>
              <li>
                WAV files need no FFmpeg. For MP3/M4A/MP4 etc. install FFmpeg
                (e.g. <code className={CODE}>winget install ffmpeg</code>) — or the app
                auto-detects the bundled binary from Python&apos;s{" "}
                <code className={CODE}>imageio-ffmpeg</code>.
              </li>
              <li>
                <code className={CODE}>WHISPER_MODEL=small</code> (default), options:{" "}
                <code className={CODE}>tiny/base/small/medium/large-v3</code>.
              </li>
              <li>
                Temp uploads are deleted automatically{" "}
                (<code className={CODE}>AUDIO_RETENTION_HOURS</code>, default 0 = after
                each job).
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Other variables</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Full reference in <code className={CODE}>.env.example</code>:</p>
            <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 text-xs leading-5">
              {`MAX_AUDIO_MB=200\nAUDIO_WORK_DIR=./tmp-audio\nAUDIO_RETENTION_HOURS=0\nFFMPEG_PATH=\nRATE_LIMIT_MAX=40\nRATE_LIMIT_WINDOW_MS=60000`}
            </pre>
            <p className="text-xs">
              After editing <code className={CODE}>.env.local</code>, restart the dev
              server. Changes never require touching this page.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}