"use client";

import * as React from "react";
import { Download, ImagePlus, RefreshCw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/common/field";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { ErrorState } from "@/components/common/error-state";
import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { useQueryPrefill } from "@/lib/use-generator";
import { getHistoryStore } from "@/lib/storage/history";
import { promptAsksForText, describeTextAsk } from "@/lib/text-detection";
import { uid } from "@/lib/utils";

const STYLES = [
  "realistic",
  "cinematic",
  "anime",
  "3d",
  "pixar",
  "illustration",
  "digital-art",
  "fantasy",
  "christian",
  "nature",
  "product",
  "portrait",
  "thumbnail",
];

const RATIOS = ["1:1", "16:9", "9:16", "4:3"];

const IMAGE_ENGINES = [
  { value: "gemini", label: "Gemini (default)" },
  { value: "huggingface", label: "Hugging Face (needs token)" },
  { value: "pollinations", label: "Pollinations (free)" },
  { value: "openrouter", label: "OpenRouter — Ling VL prompt" },
];

interface ImageResult {
  ok: boolean;
  provider?: string;
  url?: string;
  dataUrl?: string;
  seed?: number;
  error?: string;
  notice?: string;
}

export function ImageClient() {
  const prefill = useQueryPrefill();
  const [prompt, setPrompt] = React.useState(prefill.prompt ?? "");
  const [style, setStyle] = React.useState("realistic");
  const [ratio, setRatio] = React.useState("1:1");
  const [imageEngine, setImageEngine] = React.useState("gemini");
  const [seed, setSeed] = React.useState("");
  const [negative, setNegative] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<ImageResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [downloading, setDownloading] = React.useState(false);

  const imgUrl = result?.url ?? result?.dataUrl ?? null;

  const generate = async (freshSeed?: boolean) => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style,
          ratio,
          seed: freshSeed ? undefined : seed ? Number(seed) : undefined,
          negative,
          provider: imageEngine,
        }),
      });
      const data = (await res.json()) as ImageResult;
      if (!data.ok) {
        setError(data.error ?? "Image generation failed. Please try again.");
        setResult(null);
      } else {
        setResult(data);
        getHistoryStore().add({
          id: uid("h"),
          tool: "image",
          toolLabel: "AI Image",
          prompt: prompt.trim(),
          resultText: data.url ?? data.dataUrl ?? "",
          status: "success",
          mode: "ai",
        });
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const download = async () => {
    if (!imgUrl) return;
    try {
      setDownloading(true);
      if (result?.url) {
        const res = await fetch(result.url);
        const blob = await res.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `balu-ai-studio-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      } else if (result?.dataUrl) {
        const a = document.createElement("a");
        a.href = result.dataUrl;
        a.download = `balu-ai-studio-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch {
      // fall back to opening the image in a new tab
      window.open(imgUrl, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="AI Image Generator"
        subtitle="Describe an image and generate it — Gemini by default, free Pollinations as the no-key fallback."
        badge={
          <Badge variant="secondary">
            {result?.provider
              ? `Powered by ${result.provider}`
              : imageEngine === "openrouter"
                ? "OpenRouter Ling + Pollinations"
                : imageEngine === "gemini"
                  ? "Gemini"
                  : "Free"}
          </Badge>
        }
      />

      <Card className="mb-6 border-border">
        <CardContent className="p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="img-prompt"
              label="Describe your image"
              required
              className="sm:col-span-2"
              hint="Detailed prompts give better results — subject, setting, lighting, style."
            >
              <Textarea
                id="img-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. worship guitarist silhouette at golden sunset, cinematic, vibrant colors"
                rows={3}
              />
            </Field>
            {promptAsksForText(prompt.trim()) ? (
              <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-200 sm:col-span-2">
                Your prompt asks the engine to draw {describeTextAsk(prompt)}.
                Free image engines (Hugging Face, Pollinations, Gemini free
                tier) can&apos;t reliably draw text — especially Indian
                scripts — and often paint letters in another language instead.
                For exact text on an image, use the Thumbnail tool: it draws
                the text over the picture with a real font.
              </p>
            ) : null}
            <Field id="img-style" label="Style">
              <Select
                id="img-style"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                options={STYLES}
              />
            </Field>
            <Field id="img-ratio" label="Aspect Ratio">
              <Select
                id="img-ratio"
                value={ratio}
                onChange={(e) => setRatio(e.target.value)}
                options={RATIOS}
              />
            </Field>
            <Field
              id="img-engine"
              label="Image engine"
              className="sm:col-span-2"
              hint="Gemini (Nano Banana) is the default. Hugging Face needs a free HUGGINGFACE_API_KEY token. OpenRouter uses the Ling 3.0 Flash VL model to refine your prompt, then paints with free Pollinations (Ling is a vision-language model — it can't generate images). Any engine that fails or isn't configured honestly falls back to free Pollinations (its free tier can be busy at peak times)."
            >
              <Select
                id="img-engine"
                value={imageEngine}
                onChange={(e) => setImageEngine(e.target.value)}
                options={IMAGE_ENGINES}
              />
            </Field>
            <Field
              id="img-seed"
              label="Seed (optional)"
              hint="Same seed + prompt = same image."
            >
              <Input
                id="img-seed"
                type="number"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder="random"
              />
            </Field>
            <Field id="img-neg" label="Negative prompt (optional)">
              <Input
                id="img-neg"
                type="text"
                value={negative}
                onChange={(e) => setNegative(e.target.value)}
                placeholder="text, watermark, logo, low quality"
              />
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={() => generate()} loading={loading} disabled={!prompt.trim()}>
              <Sparkles /> Generate image
            </Button>
            {result?.ok ? (
              <>
                <Button variant="secondary" onClick={() => generate(true)} loading={loading}>
                  <RefreshCw /> New variation
                </Button>
                <Button variant="outline" onClick={download} disabled={downloading}>
                  <Download /> {downloading ? "Downloading…" : "Download"}
                </Button>
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {error ? <ErrorState message={error} /> : null}
      {loading ? <LoadingState message="Creating your image — this can take up to a minute..." /> : null}

      {!loading && !error && !imgUrl ? (
        <EmptyState
          icon={ImagePlus}
          title="No image generated yet"
          message="Describe what you want to see and click Generate image."
        />
      ) : null}

      {imgUrl ? (
        <Card className="overflow-hidden border-border">
          <CardContent className="p-0">
            <div className="relative bg-muted/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgUrl}
                alt="AI generated"
                className="mx-auto max-h-[560px] w-full object-contain"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 p-4">
              <span className="text-xs text-muted-foreground">
                {result?.seed !== undefined ? `Seed: ${result.seed}` : ""} · generated by{" "}
                {result?.provider}
              </span>
              <p className="text-xs text-muted-foreground">
                Right-click the image to save it, or use Download.
              </p>
            </div>
            {result?.notice ? (
              <p className="border-t border-border bg-sky-500/10 px-4 py-2 text-xs leading-5 text-sky-200">
                {result.notice}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}