"use client";

import * as React from "react";
import { ArrowRightLeft, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/common/field";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { ErrorState } from "@/components/common/error-state";
import { CopyButton } from "@/components/common/copy-button";
import { DownloadButton } from "@/components/common/download-button";
import { Badge } from "@/components/ui/badge";
import { getHistoryStore } from "@/lib/storage/history";
import { uid } from "@/lib/utils";

const LANGS = [
  { value: "en", label: "English" },
  { value: "te", label: "Telugu (తెలుగు)" },
  { value: "hi", label: "Hindi (हिन्दी)" },
  { value: "ta", label: "Tamil (தமிழ்)" },
  { value: "kn", label: "Kannada (ಕನ್ನಡ)" },
  { value: "ml", label: "Malayalam (മലയാളം)" },
];

interface TranslateResult {
  ok: boolean;
  mode?: string;
  from?: string;
  to?: string;
  text?: string;
  error?: string;
}

export function TranslateClient() {
  const [text, setText] = React.useState("");
  const [from, setFrom] = React.useState("auto");
  const [to, setTo] = React.useState("te");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<TranslateResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const swap = () => {
    setFrom(to === "auto" ? "en" : to);
    setTo(from === "auto" ? "en" : from);
  };

  const translate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), from, to }),
      });
      const data = (await res.json()) as TranslateResult;
      if (!data.ok) {
        setError(data.error ?? "Translation failed.");
        setResult(null);
      } else {
        setResult(data);
        getHistoryStore().add({
          id: uid("h"),
          tool: "translate",
          toolLabel: "Translator",
          prompt: `${to} · ${text.trim().slice(0, 120)}`,
          resultText: data.text ?? "",
          createdAt: Date.now(),
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

  const toLabel = LANGS.find((l) => l.value === to)?.label ?? to;

  return (
    <div>
      <PageHeader
        title="Translator"
        subtitle="Translate across English, Telugu, Hindi, Tamil, Kannada and Malayalam."
        badge={<Badge variant="secondary">Needs an AI provider</Badge>}
      />

      <Card className="mb-6 border-border">
        <CardContent className="p-5">
          <Field id="tr-to" label="Target language" required>
            <div className="flex items-center gap-3">
              <Select
                id="tr-to"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                options={LANGS}
              />
              <Button variant="outline" type="button" onClick={swap} aria-label="Swap languages">
                <ArrowRightLeft />
              </Button>
            </div>
          </Field>
          <div className="mt-4 grid gap-4">
            <Field id="tr-from-sel" label="Source language">
              <Select
                id="tr-from-sel"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                options={[{ value: "auto", label: "Auto-detect" }, ...LANGS]}
              />
            </Field>
            <Field
              id="tr-text"
              label={`Text (to ${toLabel})`}
              required
              hint="For the best quality Telugu, we ask the model to use conversational Telugu, not a literal machine translation."
            >
              <Textarea
                id="tr-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your text here..."
                rows={6}
              />
            </Field>
          </div>
          <div className="mt-5">
            <Button onClick={translate} loading={loading} disabled={!text.trim()}>
              <Sparkles /> Translate
            </Button>
          </div>
        </CardContent>
      </Card>

      {error ? <ErrorState message={error} /> : null}
      {loading ? <LoadingState message="Translating..." /> : null}

      {result?.ok && result.text ? (
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">Translation</span>
              <div className="flex gap-2">
                <CopyButton text={result.text} />
                <DownloadButton filename="translation.txt" text={result.text} />
              </div>
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-foreground/90">
              {result.text}
            </pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}