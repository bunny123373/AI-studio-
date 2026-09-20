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

interface ImageResult {
  ok: boolean;
  url?: string;
  dataUrl?: string;
  seed?: number;
  error?: string;
}

export function ThumbnailClient() {
  const prefill = useQueryPrefill();
  const [videoTitle, setVideoTitle] = React.useState("");
  const [mainTopic, setMainTopic] = React.useState("");
  const [emotion, setEmotion] = React.useState(prefill.emotion ?? "powerful");
  const [style, setStyle] = React.useState(prefill.style ?? "christian");
  const [character, setCharacter] = React.useState("");
  const [background, setBackground] = React.useState("");
  const [language, setLanguage] = React.useState("en");

  const concept = useGenerator("/api/thumbnail");

  const [imageLoading, setImageLoading] = React.useState(false);
  const [image, setImage] = React.useState<ImageResult | null>(null);
  const [imageError, setImageError] = React.useState<string | null>(null);
  const [downloading, setDownloading] = React.useState(false);

  const conceptResult = concept.result as GeneratorResult | null;
  const imagePromptBlock: OutputBlock | undefined = conceptResult?.blocks?.find(
    (b) => b.title.toLowerCase().includes("image generation prompt"),
  );

  const generateConcept = async () => {
    setImage(null);
    setImageError(null);
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
      getHistoryStore().add({
        id: uid("h"),
        tool: "thumbnail",
        toolLabel: "Thumbnail",
        prompt: [videoTitle, mainTopic, style].filter(Boolean).join(" · "),
        resultText: data.raw ?? "",
        createdAt: Date.now(),
        status: "success",
        mode: data.mode,
      });
    }
  };

  const generateImage = async () => {
    if (!imagePromptBlock?.text) return;
    setImageLoading(true);
    setImageError(null);
    try {
      const res = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imagePromptBlock.text,
          style: "thumbnail",
          ratio: "16:9",
        }),
      });
      const data = (await res.json()) as ImageResult;
      if (!data.ok) {
        setImageError(data.error ?? "Image generation failed.");
        setImage(null);
      } else {
        setImage(data);
      }
    } catch {
      setImageError("Something went wrong. Please try again.");
    } finally {
      setImageLoading(false);
    }
  };

  const imgUrl = image?.url ?? image?.dataUrl ?? null;

  const download = async () => {
    if (!imgUrl || !image) return;
    try {
      setDownloading(true);
      if (image.url) {
        const res = await fetch(image.url);
        const blob = await res.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `balu-thumbnail-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      } else if (image.dataUrl) {
        const a = document.createElement("a");
        a.href = image.dataUrl;
        a.download = `balu-thumbnail-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch {
      window.open(imgUrl, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  const missingConcept = !mainTopic.trim() && !videoTitle.trim();

  return (
    <div>
      <PageHeader
        title="Thumbnail Generator"
        subtitle="Get a pro thumbnail concept — layout, colors, text rules — then generate the 16:9 image."
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
                options={["en", "te", "hi", "ta", "kn", "ml"]}
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
      {concept.loading ? <LoadingState /> : null}

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
                Free image generation (Pollinations.ai) — needs internet. The
                result is a starting point; polish it in Photoshop / Canva before
                uploading.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {imageError ? <ErrorState message={imageError} /> : null}
      {imageLoading ? <LoadingState message="Creating thumbnail image..." /> : null}

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