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

/** Per-variant composition angle, so A/B thumbnails differ beyond the seed. */
const TWISTS = [
  "dramatic rim lighting, cinematic depth",
  "vibrant saturated colors, bold punchy contrast",
  "soft diffused light, clean premium look",
  "high-contrast spotlight, editorial style",
];

interface ImageResult {
  ok: boolean;
  url?: string;
  dataUrl?: string;
  seed?: number;
  error?: string;
  /** True when the selected-language text was drawn on top with a real font. */
  composed?: boolean;
}

interface ThumbVariant {
  ok: boolean;
  seed?: number;
  url?: string;
  dataUrl?: string;
  composed?: boolean;
  /** Honest per-variant note (e.g. text could not be drawn — raw shown). */
  error?: string;
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
 * Dominant colors of an image (quantized bucket counts). Used to steer the
 * image prompt toward a reference thumbnail's palette — an honest, prompt-level
 * "style clone" (the provider is text-to-image only).
 */
function extractPalette(img: HTMLImageElement, maxColors = 4): string[] {
  const cv = document.createElement("canvas");
  const S = 48;
  cv.width = S;
  cv.height = S;
  const ctx = cv.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  const scale = Math.max(S / img.width, S / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, (S - dw) / 2, (S - dh) / 2, dw, dh);
  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, S, S).data;
  } catch {
    return [];
  }
  const buckets = new Map<number, number>();
  for (let i = 0; i < data.length; i += 4) {
    const key = ((data[i] >> 6) << 4) | ((data[i + 1] >> 6) << 2) | (data[i + 2] >> 6);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  const sorted = [...buckets.entries()].sort((a, b) => b[1] - a[1]);
  const out: string[] = [];
  for (const [key] of sorted) {
    const r = ((key >> 4) & 3) * 64 + 32;
    const g = ((key >> 2) & 3) * 64 + 32;
    const b = (key & 3) * 64 + 32;
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    // Near-white / near-black chips say nothing useful to the image model.
    if (luminance > 235 || luminance < 25) continue;
    const hex =
      "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
    if (!out.includes(hex)) out.push(hex);
    if (out.length >= maxColors) break;
  }
  return out;
}

/**
 * Draw the selected-language text over the generated background with a REAL
 * font (Nirmala UI etc.), then finish the optional portrait into a circular
 * face chip (top-left, outside the text band). Returns a composited PNG data
 * URL, or null on failure (caller then shows the raw image — honest fallback).
 */
async function composeThumbnail(
  src: string,
  text: string,
  lang: string,
  portraitUrl?: string | null,
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
    if (lines.length) {
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
      ctx.shadowColor = "transparent";
    }

    // Portrait → circular face chip in the top-left corner.
    if (portraitUrl) {
      const p = await loadImageElement(portraitUrl);
      const radius = Math.round(THUMB_H * 0.2);
      const pad = Math.round(THUMB_H * 0.05);
      const cx = pad + radius;
      const cy = pad + radius;
      // Soft shadow under the chip.
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 5;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fill();
      ctx.restore();
      // Circular crop of the portrait (cover-fit inside the circle).
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();
      const ps = Math.max((radius * 2) / p.width, (radius * 2) / p.height);
      const pw = p.width * ps;
      const ph = p.height * ps;
      ctx.drawImage(p, cx - pw / 2, cy - ph / 2, pw, ph);
      ctx.restore();
      // Dark ring so the chip pops at small preview sizes.
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(4, Math.round(THUMB_H * 0.012));
      ctx.strokeStyle = "rgba(0,0,0,0.85)";
      ctx.stroke();
    }

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

  const [variations, setVariations] = React.useState(3);
  const [referenceUrl, setReferenceUrl] = React.useState<string | null>(null);
  const [referenceName, setReferenceName] = React.useState("");
  const [palette, setPalette] = React.useState<string[]>([]);
  const [paletteNote, setPaletteNote] = React.useState<string | null>(null);
  const [portraitUrl, setPortraitUrl] = React.useState<string | null>(null);
  const [portraitName, setPortraitName] = React.useState("");

  const [variantsLoading, setVariantsLoading] = React.useState(false);
  const [retrying, setRetrying] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const [conceptElapsed, setConceptElapsed] = React.useState(0);
  const [variants, setVariants] = React.useState<ThumbVariant[]>([]);
  const [downloadingIdx, setDownloadingIdx] = React.useState<number | null>(null);

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

  // Live elapsed-seconds clock while the variants generate.
  React.useEffect(() => {
    if (!variantsLoading) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [variantsLoading]);

  // Auto-fill the on-image headline from the concept's text suggestion.
  // Done in the event handler (not an effect) to respect the purity rules —
  // the user's own edits are never overwritten because we only fill when empty.
  const generateConcept = async () => {
    setVariants([]);
    setPalette([]);
    setVariantsLoading(false);
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

  const pickReference = (file: File | null) => {
    setReferenceUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    setReferenceName(file?.name ?? "");
    setPalette([]);
    setPaletteNote(null);
    if (!file) return;
    const url = URL.createObjectURL(file);
    setReferenceUrl(url);
    loadImageElement(url)
      .then((img) => {
        const colors = extractPalette(img);
        if (colors.length) setPalette(colors);
        else setPaletteNote("Could not pick dominant colors from that image — generated freely.");
      })
      .catch(() => {
        setPaletteNote("Could not read that image — generated freely.");
      });
  };

  const pickPortrait = (file: File | null) => {
    setPortraitUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    setPortraitName(file?.name ?? "");
    if (!file) return;
    setPortraitUrl(URL.createObjectURL(file));
  };

  /** One thumbnail variant: new seed + composition angle, then text/portrait. */
  const fetchVariant = async (
    prompt: string,
    overlay: string,
    portrait: string | null,
    seed: number,
  ): Promise<ThumbVariant> => {
    let lastError = "Image generation failed. Please try again.";
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await fetch("/api/ai/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            style: "thumbnail",
            ratio: "16:9",
            seed,
          }),
        });
        const data = (await res.json()) as ImageResult;
        if (data.ok && (data.url ?? data.dataUrl)) {
          const src = (data.url ?? data.dataUrl) as string;
          if (overlay || portrait) {
            const composed = await composeThumbnail(
              src,
              overlay,
              language,
              portrait,
            );
            if (composed) {
              return {
                ok: true,
                seed: data.seed ?? seed,
                url: data.url,
                dataUrl: composed,
                composed: true,
              };
            }
            return {
              ok: true,
              seed: data.seed ?? seed,
              url: data.url,
              error:
                "Text / portrait could not be drawn over this image — showing the raw version.",
            };
          }
          return {
            ok: true,
            seed: data.seed ?? seed,
            url: data.url,
            dataUrl: data.dataUrl,
            composed: false,
          };
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
    return { ok: false, seed, error: lastError };
  };

  const generateVariants = async () => {
    if (!imagePromptBlock?.text) return;
    setVariantsLoading(true);
    setVariants([]);
    setRetrying(false);
    setElapsed(0);
    const startedAt = Date.now();
    const overlay = thumbText.trim();
    const portrait = portraitUrl;

    // The AI paints ONLY the background — asking image models to draw Indian
    // scripts gives English or gibberish, so we never let it write the text.
    const basePrompt = overlay
      ? `${imagePromptBlock.text}, no text, no words, no letters, clean empty space at the bottom for a headline`
      : imagePromptBlock.text;

    // Reference style → palette steering (prompt-level, honest).
    const colorSuffix = palette.length
      ? ` Dominant color palette: ${palette.join(", ")} — use exactly these colors as the main palette.`
      : "";

    const jobs = Array.from({ length: variations }, (_, i) => {
      const seed = Math.floor(Math.random() * 2 ** 31);
      const twist = TWISTS[i % TWISTS.length] ?? "";
      const prompt = `${basePrompt}${colorSuffix}, ${twist}`.slice(0, 1000);
      return fetchVariant(prompt, overlay, portrait, seed);
    });

    const results = await Promise.all(jobs);
    setElapsed(Math.max(1, Math.round((Date.now() - startedAt) / 1000)));
    setVariants(results);
    setVariantsLoading(false);
    setRetrying(false);
  };

  const downloadVariant = async (v: ThumbVariant, idx: number) => {
    const src = v.dataUrl ?? v.url;
    if (!src) return;
    try {
      setDownloadingIdx(idx);
      if (v.dataUrl) {
        const a = document.createElement("a");
        a.href = v.dataUrl;
        a.download = `balu-thumbnail-${v.seed ?? `v${idx + 1}`}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else if (v.url) {
        const res = await fetch(v.url);
        const blob = await res.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `balu-thumbnail-${v.seed ?? `v${idx + 1}`}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      }
    } catch {
      window.open(src, "_blank");
    } finally {
      setDownloadingIdx(null);
    }
  };

  const missingConcept = !mainTopic.trim() && !videoTitle.trim();
  const langLabel =
    THUMB_LANGS.find((l) => l.value === language)?.label ?? "English";

  return (
    <div>
      <PageHeader
        title="Thumbnail Generator"
        subtitle="Get a pro thumbnail concept — layout, colors, text rules — then generate A/B variations with real text in your language, your portrait, and a reference palette."
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
            <h2 className="text-lg font-semibold">Generate thumbnail variations</h2>
          </div>
          <Card className="border-border">
            <CardContent className="p-5">
              <p className="mb-4 rounded-md border border-border bg-muted/30 p-3 text-xs leading-5 text-muted-foreground">
                <span className="font-semibold text-foreground">Image prompt: </span>
                {imagePromptBlock.text}
                {palette.length
                  ? ` Dominant color palette: ${palette.join(", ")}.`
                  : ""}
              </p>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field id="th-variations" label="Variations (A/B test)">
                  <Select
                    id="th-variations"
                    value={String(variations)}
                    onChange={(e) => setVariations(Number(e.target.value))}
                    options={["2", "3", "4"]}
                  />
                </Field>
                <Field
                  id="th-ref"
                  label="Reference style (optional)"
                  hint="Its dominant colors steer the prompt — palette cloning, not a 1:1 copy."
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => document.getElementById("th-ref-input")?.click()}
                  >
                    {referenceName ? "Replace reference" : "Choose reference image"}
                  </Button>
                  <input
                    id="th-ref-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => pickReference(e.target.files?.[0] ?? null)}
                  />
                </Field>
                <Field
                  id="th-portrait"
                  label="Your portrait (optional)"
                  hint="Finished into a circular face chip in the top-left corner — best as a close-up headshot."
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => document.getElementById("th-portrait-input")?.click()}
                  >
                    {portraitName ? "Replace portrait" : "Choose your photo"}
                  </Button>
                  <input
                    id="th-portrait-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => pickPortrait(e.target.files?.[0] ?? null)}
                  />
                </Field>
              </div>

              {(referenceUrl || portraitUrl) && !variantsLoading ? (
                <div className="mt-4 flex flex-wrap items-end gap-4">
                  {referenceUrl ? (
                    <div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={referenceUrl}
                        alt="Reference style"
                        className="h-16 w-28 rounded-md border border-border object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => pickReference(null)}
                        className="mt-1 block text-[11px] text-muted-foreground underline hover:text-foreground"
                      >
                        remove reference
                      </button>
                    </div>
                  ) : null}
                  {portraitUrl ? (
                    <div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={portraitUrl}
                        alt="Portrait"
                        className="size-16 rounded-full border border-border object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => pickPortrait(null)}
                        className="mt-1 block text-[11px] text-muted-foreground underline hover:text-foreground"
                      >
                        remove portrait
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {palette.length ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">Palette:</span>
                  {palette.map((hex) => (
                    <span
                      key={hex}
                      className="flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
                    >
                      <span
                        className="size-3 rounded-full"
                        style={{ backgroundColor: hex }}
                      />
                      {hex}
                    </span>
                  ))}
                  <span className="text-[11px] text-muted-foreground">
                    — added to every variant prompt.
                  </span>
                </div>
              ) : null}

              {paletteNote ? (
                <p className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                  {paletteNote}
                </p>
              ) : null}

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Button onClick={generateVariants} loading={variantsLoading}>
                  <ImagePlus />
                  {variantsLoading
                    ? `Creating ${variations} thumbnails…`
                    : `Generate ${variations} thumbnail${variations > 1 ? "s" : ""}`}
                </Button>
                {variantsLoading ? (
                  <span className="text-xs text-muted-foreground">
                    {retrying
                      ? "image service busy — retrying… "
                      : `… ${elapsed}s — the free image service can be slow with several variants.`}
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Each variant uses a different seed and composition angle, so you
                can A/B test styles. {thumbText.trim()
                  ? `The AI paints only the background; your "${thumbText.trim()}" is drawn on top with a real font in ${langLabel}, and your portrait is cut into a circular chip — all done in the browser.`
                  : "The AI paints only the background; add text or a portrait for the finished look, and polish in Photoshop / Canva before uploading."}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {variantsLoading ? <LoadingState message="Creating thumbnail variations…" /> : null}

      {variants.length ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          {variants.map((v, i) => {
            const src = v.dataUrl ?? v.url;
            return (
              <Card key={v.seed ?? i} className="overflow-hidden border-border">
                <CardContent className="p-0">
                  {v.ok && src ? (
                    <>
                      <div className="bg-muted/40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt={`Thumbnail variant ${i + 1}`}
                          className="aspect-video w-full object-contain"
                        />
                      </div>
                      <div className="p-4">
                        {v.error ? (
                          <p className="mb-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                            {v.error}
                          </p>
                        ) : null}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground">
                            Variant {i + 1}
                            {v.seed !== undefined ? ` · Seed ${v.seed}` : ""} ·
                            16:9
                            {v.composed
                              ? ` · ${langLabel} text${portraitUrl ? " + portrait" : ""}`
                              : ""}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadVariant(v, i)}
                            disabled={downloadingIdx === i}
                          >
                            <Download />
                            {downloadingIdx === i ? "Downloading…" : "Download image"}
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-4">
                      <p className="text-xs text-destructive">
                        {v.error ?? "This variant failed. Try again."}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}