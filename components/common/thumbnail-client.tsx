"use client";

import * as React from "react";
import { Clapperboard, Download, ImagePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/common/field";
import { PageHeader } from "@/components/common/page-header";
import { OutputCard, type OutputBlock } from "@/components/common/output-card";
import { LoadingState } from "@/components/common/loading-state";
import { ErrorState } from "@/components/common/error-state";
import { Badge } from "@/components/ui/badge";
import { useQueryPrefill, useGenerator, type GeneratorResult } from "@/lib/use-generator";
import { getHistoryStore } from "@/lib/storage/history";
import { uid } from "@/lib/utils";

const EMOTIONS = ["powerful", "joyful", "emotional", "hopeful", "serious", "calm"];
const STYLES = [
  "christian",
  "cinematic",
  "gaming",
  "tech",
  "vlog",
  "music",
  "education",
  "news",
  "emotional",
  "business",
];

const THUMB_LANGS = [
  { value: "en", label: "English" },
  { value: "te", label: "తెలుగు (Telugu)" },
  { value: "hi", label: "हिन्दी (Hindi)" },
  { value: "ta", label: "தமிழ் (Tamil)" },
  { value: "kn", label: "ಕನ್ನಡ (Kannada)" },
  { value: "ml", label: "മലയാളം (Malayalam)" },
];

/**
 * Real fonts per script — the selected language's text is DRAWN onto the
 * thumbnail with these (not asked from the AI). Nirmala UI ships with
 * Windows and covers every Indian script; the rest are safe fallbacks.
 */
const FONT_STACKS: Record<string, string> = {
  en: 'Arial Black, "Segoe UI", Arial, sans-serif',
  te: '"Nirmala UI", "Noto Sans Telugu", Gautami, Vani, sans-serif',
  hi: '"Nirmala UI", "Noto Sans Devanagari", Mangal, sans-serif',
  ta: '"Nirmala UI", "Noto Sans Tamil", Latha, sans-serif',
  kn: '"Nirmala UI", "Noto Sans Kannada", Tunga, sans-serif',
  ml: '"Nirmala UI", "Noto Sans Malayalam", Kartika, sans-serif',
};

const THUMB_W = 1280;
const THUMB_H = 720;

interface ImageResult {
  ok: boolean;
  url?: string;
  dataUrl?: string;
  seed?: number;
  error?: string;
  /** True when the selected-language text was drawn on top with a real font. */
  composed?: boolean;
}

/** First short "Main:" line from the concept's Thumbnail Text Suggestions. */
function suggestedHeadline(blocks: OutputBlock[] | undefined): string {
  const sugg = blocks?.find((b) => b.title.toLowerCase().includes("thumbnail text"));
  if (!sugg) return "";
  const mainLine = sugg.text
    .split("\n")
    .map((l) => l.trim())
    .find((l) => /^main:?/i.test(l));
  return mainLine ? mainLine.replace(/^main:?\s*/i, "").slice(0, 80) : "";
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  const attempt = (imgSrc: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("image load failed"));
      img.src = imgSrc;
    });
  return attempt(src).catch(async () => {
    // CORS/taint fallback: fetch (the app already fetches these URLs
    // cross-origin for downloads) and load from a same-origin blob.
    const res = await fetch(src);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    try {
      return await attempt(url);
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }
  });
}

/** Biggest font size where the text wraps to ≤ 2 lines inside maxWidth. */
function fitOverlayFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  family: string,
): { font: string; lines: string[]; lineHeight: number } {
  const words = text.split(/\s+/).filter(Boolean);
  for (let size = 108; size >= 44; size -= 4) {
    const font = `900 ${size}px ${family}`;
    ctx.font = font;
    const lines: string[] = [];
    let line = "";
    let fits = true;
    for (const w of words) {
      const candidate = line ? `${line} ${w}` : w;
      if (!line || ctx.measureText(candidate).width <= maxWidth) {
        line = candidate;
      } else {
        if (lines.length >= 1) {
          fits = false;
          break;
        }
        lines.push(line);
        line = w;
      }
      if (ctx.measureText(line).width > maxWidth) {
        fits = false;
        break;
      }
    }
    if (!fits) continue;
    if (line) lines.push(line);
    if (lines.length > 2) continue;
    return { font, lines, lineHeight: Math.round(size * 1.18) };
  }
  const font = `900 44px ${family}`;
  ctx.font = font;
  return { font, lines: words.slice(0, 2), lineHeight: 52 };
}

/**
 * Draw the selected-language text over the generated background with a REAL
 * font (Nirmala UI etc.). Returns a composited PNG data URL, or null on
 * failure (caller then shows the raw image — honest fallback).
 */
async function composeThumbnail(
  src: string,
  text: string,
  lang: string,
): Promise<string | null> {
  try {
    const img = await loadImageElement(src);
    const canvas = document.createElement("canvas");
    canvas.width = THUMB_W;
    canvas.height = THUMB_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Cover-fit the generated image onto the 16:9 canvas.
    const scale = Math.max(THUMB_W / img.width, THUMB_H / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, (THUMB_W - dw) / 2, (THUMB_H - dh) / 2, dw, dh);

    // Bottom band for the headline (gradient, so it never fights the art).
    const band = Math.round(THUMB_H * 0.34);
    const grad = ctx.createLinearGradient(0, THUMB_H - band * 1.6, 0, THUMB_H);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.78)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, THUMB_H - band * 1.6, THUMB_W, band * 1.6);

    // Real text in the selected language.
    const family = FONT_STACKS[lang] ?? FONT_STACKS.en;
    const { font, lines, lineHeight } = fitOverlayFont(
      ctx,
      text,
      THUMB_W * 0.9,
      family,
    );
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = "#ffffff";
    const centerY = THUMB_H - band * 0.62;
    const firstY = centerY - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((ln, i) => {
      ctx.fillText(ln, THUMB_W / 2, firstY + i * lineHeight);
    });

    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

export function ThumbnailClient() {
  const prefill = useQueryPrefill();
  const [videoTitle, setVideoTitle] = React.useState(prefill.title ?? "");
  const [mainTopic, setMainTopic] = React.useState(prefill.topic ?? "");
  const [emotion, setEmotion] = React.useState(prefill.emotion ?? "powerful");
  const [style, setStyle] = React.useState(prefill.style ?? "christian");
  const [character, setCharacter] = React.useState("");
  const [background, setBackground] = React.useState("");
  const [language, setLanguage] = React.useState(prefill.lang ?? "en");
  const [thumbText, setThumbText] = React.useState(prefill.text ?? "");

  const concept = useGenerator("/api/thumbnail");

  const [imageLoading, setImageLoading] = React.useState(false);
  const [retrying, setRetrying] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const [conceptElapsed, setConceptElapsed] = React.useState(0);
  const [image, setImage] = React.useState<ImageResult | null>(null);
  const [imageError, setImageError] = React.useState<string | null>(null);
  const [composeNote, setComposeNote] = React.useState<string | null>(null);
  const [downloading, setDownloading] = React.useState(false);

  const conceptResult = concept.result as GeneratorResult | null;
  const imagePromptBlock: OutputBlock | undefined = conceptResult?.blocks?.find(
    (b) => b.title.toLowerCase().includes("image generation prompt"),
  );

  // Live elapsed-seconds clock while the concept generates (Ollama on CPU
  // takes ~90s — a static spinner is a bad look).
  React.useEffect(() => {
    if (!concept.loading) return;
    const id = setInterval(() => setConceptElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [concept.loading]);

  // Live elapsed-seconds clock while the image generates.
  React.useEffect(() => {
    if (!imageLoading) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [imageLoading]);

  // Auto-fill the on-image headline from the concept's text suggestion.
  // Done in the event handler (not an effect) to respect the purity rules —
  // the user's own edits are never overwritten because we only fill when empty.
  const generateConcept = async () => {
    setImage(null);
    setImageError(null);
    setComposeNote(null);
    setConceptElapsed(0);
    const data = await concept.run({
      language,
      input: {
        videoTitle,
        mainTopic,
        emotion,
        style,
        character,
        background,
        language,
      },
    });
    if (data.ok) {
      if (!thumbText.trim()) {
        const headline = suggestedHeadline(data.blocks);
        if (headline) setThumbText(headline);
      }
      getHistoryStore().add({
        id: uid("h"),
        tool: "thumbnail",
        toolLabel: "Thumbnail",
        prompt: [videoTitle, mainTopic, style].filter(Boolean).join(" · "),
        resultText: data.raw ?? "",
        status: "success",
        mode: data.mode,
      });
    }
  };

  const generateImage = async () => {
    if (!imagePromptBlock?.text) return;
    setImageLoading(true);
    setImageError(null);
    setImage(null);
    setComposeNote(null);
    setRetrying(false);
    setElapsed(0);
    const startedAt = Date.now();
    const overlay = thumbText.trim();

    // The AI paints ONLY the background — asking image models to draw Indian
    // scripts gives English or gibberish, so we never let it write the text.
    const basePrompt = overlay
      ? `${imagePromptBlock.text}, no text, no words, no letters, clean empty space at the bottom for a headline`
      : imagePromptBlock.text;

    let lastError = "Image generation failed. Please try again.";

    // Reality check: generations can take 30s–90s and the free tier can hiccup,
    // so retry once on transient failures instead of dying on the first one.
    try {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const res = await fetch("/api/ai/image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: basePrompt,
              style: "thumbnail",
              ratio: "16:9",
            }),
          });
          const data = (await res.json()) as ImageResult;
          if (data.ok) {
            let display: ImageResult = data;
            if (overlay && (data.url ?? data.dataUrl)) {
              const composed = await composeThumbnail(
                (data.url ?? data.dataUrl) as string,
                overlay,
                language,
              );
              if (composed) {
                display = { ...data, dataUrl: composed, composed: true };
              } else {
                setComposeNote(
                  "Could not draw the text over this image — showing the raw image instead.",
                );
              }
            }
            setElapsed(Math.max(1, Math.round((Date.now() - startedAt) / 1000)));
            setImage(display);
            return;
          }
          lastError = data.error ?? lastError;
          const transient =
            /busy|too many|429|503|5\d\d|empty result|try again|timed out/i.test(
              lastError,
            );
          if (!transient || attempt === 2) break;
          setRetrying(true);
          await new Promise((r) => setTimeout(r, 1500));
        } catch {
          break;
        }
      }
      setImageError(lastError);
    } finally {
      setRetrying(false);
      setImageLoading(false);
    }
  };

  const imgUrl = image?.dataUrl ?? image?.url ?? null;

  const download = async () => {
    if (!imgUrl || !image) return;
    try {
      setDownloading(true);
      if (image.dataUrl) {
        const a = document.createElement("a");
        a.href = image.dataUrl;
        a.download = `balu-thumbnail-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else if (image.url) {
        const res = await fetch(image.url);
        const blob = await res.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `balu-thumbnail-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      }
    } catch {
      window.open(imgUrl, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  const missingConcept = !mainTopic.trim() && !videoTitle.trim();
  const langLabel =
    THUMB_LANGS.find((l) => l.value === language)?.label ?? "English";

  return (
    <div>
      <PageHeader
        title="Thumbnail Generator"
        subtitle="Get a pro thumbnail concept — layout, colors, text rules — then generate the 16:9 image with real text drawn in your language."
        badge={<Badge variant="secondary">1280×720 · 16:9</Badge>}
      />

      <Card className="mb-6 border-border">
        <CardContent className="p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="th-video" label="Video Title" className="sm:col-span-2">
              <Input
                id="th-video"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="e.g. 10 Signs God Is Preparing You"
              />
            </Field>
            <Field id="th-topic" label="Main Subject" className="sm:col-span-2">
              <Input
                id="th-topic"
                value={mainTopic}
                onChange={(e) => setMainTopic(e.target.value)}
                placeholder="e.g. preacher silhouette, worship, sunset"
              />
            </Field>
            <Field id="th-emotion" label="Emotion">
              <Select
                id="th-emotion"
                value={emotion}
                onChange={(e) => setEmotion(e.target.value)}
                options={EMOTIONS}
              />
            </Field>
            <Field id="th-style" label="Channel Vibe">
              <Select
                id="th-style"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                options={STYLES}
              />
            </Field>
            <Field id="th-lang" label="Text language">
              <Select
                id="th-lang"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                options={THUMB_LANGS}
              />
            </Field>
            <Field
              id="th-text"
              label="Text on the image (optional)"
              hint="Short headline — the concept auto-fills it. Drawn with a real font in the selected language; any script renders correctly."
            >
              <Input
                id="th-text"
                value={thumbText}
                onChange={(e) => setThumbText(e.target.value)}
                placeholder="e.g. MUST WATCH or 3 రోజులు"
                maxLength={120}
              />
            </Field>
            <Field id="th-char" label="Character (optional)">
              <Input
                id="th-char"
                value={character}
                onChange={(e) => setCharacter(e.target.value)}
                placeholder="e.g. bearded pastor in dark suit"
              />
            </Field>
            <Field id="th-bg" label="Background (optional)">
              <Input
                id="th-bg"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                placeholder="e.g. sunrise over mountains, dramatic clouds"
              />
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              onClick={generateConcept}
              loading={concept.loading}
              disabled={missingConcept}
            >
              <Clapperboard /> Generate thumbnail concept
            </Button>
          </div>
        </CardContent>
      </Card>

      {concept.error ? <ErrorState message={concept.error} /> : null}
      {concept.loading ? (
        <LoadingState message={`Generating thumbnail concept… ${conceptElapsed}s`} />
      ) : null}

      {!concept.loading && !concept.error ? (
        <OutputCard
          result={conceptResult}
          message="No thumbnail concept generated yet."
          onRegenerate={conceptResult ? generateConcept : undefined}
          fileName="thumbnail-concept.txt"
          className="mb-6"
        />
      ) : null}

      {imagePromptBlock ? (
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <ImagePlus className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">Generate the thumbnail image</h2>
          </div>
          <Card className="border-border">
            <CardContent className="p-5">
              <p className="mb-4 rounded-md border border-border bg-muted/30 p-3 text-xs leading-5 text-muted-foreground">
                <span className="font-semibold text-foreground">Image prompt: </span>
                {imagePromptBlock.text}
              </p>
              <Button onClick={generateImage} loading={imageLoading}>
                <ImagePlus /> Generate 16:9 thumbnail image
              </Button>
              <p className="mt-3 text-xs text-muted-foreground">
                Free image generation (Pollinations.ai) — needs internet.{" "}
                {thumbText.trim()
                  ? `The AI paints only the background; your "${thumbText.trim()}" is then drawn on top with a real font in ${langLabel} — crisp in every script.`
                  : "The result is a starting point; polish it in Photoshop / Canva before uploading."}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {imageError ? <ErrorState message={imageError} /> : null}
      {composeNote ? (
        <p className="mb-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {composeNote}
        </p>
      ) : null}
      {imageLoading ? (
        <LoadingState
          message={
            retrying
              ? "The image service was busy — retrying…"
              : `Creating thumbnail image… ${elapsed}s`
          }
        />
      ) : null}

      {imgUrl ? (
        <Card className="overflow-hidden border-border">
          <CardContent className="p-0">
            <div className="bg-muted/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgUrl}
                alt="Thumbnail preview"
                className="aspect-video w-full object-contain"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 p-4">
              <span className="text-xs text-muted-foreground">
                {image?.seed !== undefined ? `Seed: ${image.seed}` : ""} · 16:9
                {image?.composed ? ` · text in ${langLabel}` : ""}
                {elapsed > 0 ? ` · generated in ${elapsed}s` : ""}
              </span>
              <Button variant="outline" size="sm" onClick={download} disabled={downloading}>
                <Download /> {downloading ? "Downloading…" : "Download image"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}