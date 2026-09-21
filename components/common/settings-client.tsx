"use client";

import * as React from "react";
import {
  CheckCircle2,
  Download,
  Image as ImageIcon,
  Languages,
  Mic,
  MicVocal,
  Settings2,
  Sparkles,
  XCircle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/common/field";
import { LoadingState } from "@/components/common/loading-state";

interface Status {
  ok?: boolean;
  text?: { id: string; label: string; configured: boolean };
  textOptions?: Array<{
    id: string;
    label: string;
    configured: boolean;
    model: string;
  }>;
  runtime?: { provider: string | null; model: string | null };
  image?: { id: string; label: string; configured: boolean };
  whisper?: { configured: boolean; model: string; note?: string };
  ffmpeg?: { found: boolean };
  ytDlp?: { found: boolean };
  diarization?: { installed: boolean; tokenConfigured: boolean; ready: boolean };
  translation?: { configured: boolean; provider?: string };
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

export function SettingsClient({ showPicker = false }: { showPicker?: boolean }) {
  const [status, setStatus] = React.useState<Status | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [providerSel, setProviderSel] = React.useState("");
  const [modelSel, setModelSel] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [applyMsg, setApplyMsg] = React.useState<string | null>(null);
  const [applyErr, setApplyErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/settings/status")
      .then((r) => r.json())
      .then((d: Status) => setStatus(d))
      .catch(() => setError("Could not load provider status."));
  }, []);

  // Effective values: whatever the user picked, else the runtime override,
  // else the .env.local default. Derived at render — no state syncing.
  const defaultProvider =
    status?.runtime?.provider ??
    (status?.text && (status.text.id === "gemini" || status.text.id === "openai")
      ? status.text.id
      : status?.textOptions?.[0]?.id ?? "");
  const defaultModel =
    status?.runtime?.model ??
    status?.textOptions?.find((o) => o.id === defaultProvider)?.model ??
    "";
  const effectiveProvider = providerSel || defaultProvider;
  const effectiveModel = modelSel || defaultModel;

  const switchProvider = (id: string) => {
    setProviderSel(id);
    setModelSel(status?.textOptions?.find((o) => o.id === id)?.model ?? "");
  };

  const refreshStatus = async () => {
    try {
      const d = (await (await fetch("/api/settings/status")).json()) as Status;
      setStatus(d);
      return d;
    } catch {
      return null;
    }
  };

  const persistProvider = async (
    provider: string | null,
    model: string | null,
  ) => {
    setSaving(true);
    setApplyErr(null);
    setApplyMsg(null);
    try {
      const res = await fetch("/api/settings/provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, model }),
      });
      const d = (await res.json()) as {
        ok?: boolean;
        error?: string;
        runtime?: { provider: string | null; model: string | null };
      };
      if (!res.ok || !d.ok) {
        setApplyErr(d.error ?? "Could not apply the selection.");
        return false;
      }
      const fresh = await refreshStatus();
      if (fresh?.runtime?.provider && fresh?.runtime?.model) {
        setProviderSel(fresh.runtime.provider);
        setModelSel(fresh.runtime.model);
      }
      setApplyMsg(
        d.runtime?.provider
          ? `Applied: ${d.runtime.provider} — ${d.runtime.model ?? "default model"}.`
          : "Reset to the .env.local configuration.",
      );
      return true;
    } catch {
      setApplyErr("Network error — could not save.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const applyProvider = () =>
    persistProvider(effectiveProvider || null, effectiveModel || null);
  const resetProvider = () => {
    setProviderSel("");
    setModelSel("");
    return persistProvider(null, null);
  };

  // Labelled options keep the <value> as the bare provider id.
  const selectOptions =
    status?.textOptions?.map((o) => ({
      value: o.id,
      label: o.configured ? o.label : `${o.label} (no key set)`,
    })) ?? [];
  const providerHint = status?.textOptions?.find(
    (o) => o.id === effectiveProvider,
  )?.configured
    ? "Configured — keys are set in .env.local."
    : "No key set for this provider — generation falls back to the free template engine.";

  const statusPill = (configured: boolean) => (
    <Badge variant={configured ? "success" : "secondary"}>
      {configured ? "Configured" : "Not configured"}
    </Badge>
  );

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="See which AI providers are active, and switch provider & model at runtime — keys still live only in environment variables."
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
          <Row
            icon={<Download className="size-5" />}
            title="yt-dlp (YouTube → SRT)"
            status={status.ytDlp?.found ? "ok" : "no"}
            detail={
              status.ytDlp?.found
                ? "Found — transcribe videos straight from a YouTube URL."
                : "Not found — install with `pip install yt-dlp` to enable YouTube URL transcription."
            }
          />
          <Row
            icon={<MicVocal className="size-5" />}
            title="Speaker diarization"
            status={status.diarization?.ready ? "ok" : "no"}
            detail={
              status.diarization?.ready
                ? "Ready — subtitle lines can be labelled Speaker 1 / 2 / …"
                : status.diarization?.installed
                  ? "pyannote installed but no HF token — set PYANNOTE_AUTH_TOKEN."
                  : "Optional — install `pip install pyannote.audio` and set PYANNOTE_AUTH_TOKEN to label speakers."
            }
          />
          <Row
            icon={<Languages className="size-5" />}
            title="Bilingual subtitles"
            status={status.translation?.configured ? "ok" : "no"}
            detail={
              status.translation?.configured
                ? `${status.translation.provider ?? "AI provider"} ready — translate subtitles into another language.`
                : "Add a text AI provider (OpenAI-compatible or Gemini) to get dual-line translated subtitles."
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
            <div>
              When a provider is configured, generated content is labelled{" "}
              <Badge variant="success" className="align-middle">AI provider</Badge>. If the
              provider fails it falls back to the template.
            </div>
          </CardContent>
        </Card>

        {showPicker ? (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">
              Switch provider &amp; model (runtime)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Pick which configured provider is active and which model it uses —
              no editing files, works here in the browser. Keys stay in{" "}
              <code className={CODE}>.env.local</code> only.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="st-provider" label="Provider" hint={providerHint}>
                <Select
                  id="st-provider"
                  value={effectiveProvider}
                  onChange={(e) => switchProvider(e.target.value)}
                  options={selectOptions}
                />
              </Field>
              <Field
                id="st-model"
                label="Model"
                hint="Model name on that provider, e.g. gemini-3.6-flash or gpt-4o-mini."
              >
                <Input
                  id="st-model"
                  value={effectiveModel}
                  onChange={(e) => setModelSel(e.target.value)}
                  placeholder="e.g. gemini-3.6-flash"
                  maxLength={200}
                />
              </Field>
            </div>
            {applyErr ? (
              <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {applyErr}
              </p>
            ) : null}
            {applyMsg ? (
              <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                {applyMsg}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button onClick={applyProvider} loading={saving} size="sm">
                Apply
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetProvider}
                disabled={saving || !status?.runtime?.provider}
              >
                Reset to .env.local
              </Button>
            </div>
            <p className="text-xs">
              The choice is kept on the server in memory — it survives page
              refreshes on a single always-on host, resets when the server
              restarts, and on serverless hosting (Vercel) it is per-instance,
              so set the env vars there too.
            </p>
          </CardContent>
        </Card>
        ) : null}

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Image provider</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Default is <b className="text-foreground">Pollinations.ai</b> — free, needs
              internet. Works keyless; if the free tier is busy, add a free key
              (Quest Pollen — no card) at{" "}
              <a className="underline" href="https://enter.pollinations.ai/keys" target="_blank" rel="noreferrer">
                enter.pollinations.ai
              </a>{" "}
              and set <code>POLLINATIONS_API_KEY</code>. Hit “New variation” to retry.
            </p>
            <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 text-xs leading-5">
              {`IMAGE_PROVIDER=pollinations   # free, keyless (default)\n# POLLINATIONS_API_KEY=sk_...  # free quest key -> reliable gen endpoint\n# IMAGE_PROVIDER=local        # local Stable Diffusion\n# LOCAL_SD_URL=http://127.0.0.1:7860\n# IMAGE_PROVIDER=none         # disable`}
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
                <b className="text-foreground">YouTube URLs</b> (optional): install{" "}
                <code className={CODE}>pip install yt-dlp</code> to transcribe videos
                from a link instead of uploading a file.
              </li>
              <li>
                <b className="text-foreground">Speaker labels</b> (optional): install{" "}
                <code className={CODE}>pip install pyannote.audio</code> and set{" "}
                <code className={CODE}>PYANNOTE_AUTH_TOKEN</code> (Hugging Face token;
                accept the pyannote/speaker-diarization-3.1 model terms first).
              </li>
              <li>
                <b className="text-foreground">Bilingual subtitles</b> (optional):
                configure a text AI provider to auto-translate subtitle lines.
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
              {`MAX_AUDIO_MB=200\nAUDIO_WORK_DIR=./tmp-audio\nAUDIO_RETENTION_HOURS=0\nFFMPEG_PATH=\nYTDLP_PATH=\nPYANNOTE_AUTH_TOKEN=\nRATE_LIMIT_MAX=40\nRATE_LIMIT_WINDOW_MS=60000`}
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