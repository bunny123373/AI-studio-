"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/common/field";
import { PageHeader } from "@/components/common/page-header";
import { OutputCard } from "@/components/common/output-card";
import { LoadingState } from "@/components/common/loading-state";
import { ErrorState } from "@/components/common/error-state";
import { Badge } from "@/components/ui/badge";
import { useGenerator, useQueryPrefill, type GeneratorResult } from "@/lib/use-generator";
import { getHistoryStore } from "@/lib/storage/history";
import { uid } from "@/lib/utils";

export interface GenField {
  name: string;
  label: string;
  kind: "text" | "textarea" | "select" | "number";
  options?: string[];
  placeholder?: string;
  hint?: string;
  required?: boolean;
  default?: string;
  /** map query param → initial value (Quick Create) */
  query?: string;
}

export interface GenPageProps {
  title: string;
  subtitle?: string;
  endpoint: string;
  tool: string; // history store id / api tool name
  toolLabel: string;
  fileName: string;
  fields: GenField[];
  language?: { default: string; options: string[]; title?: string };
  note?: string;
}

export function GenPage({
  title,
  subtitle,
  endpoint,
  tool,
  toolLabel,
  fileName,
  fields,
  language,
  note,
}: GenPageProps) {
  const prefill = useQueryPrefill();
  const [values, setValues] = React.useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of fields) {
      const fromQuery = f.query ? prefill[f.query] : undefined;
      init[f.name] = fromQuery ?? f.default ?? "";
    }
    return init;
  });
  const [lang, setLang] = React.useState(language?.default ?? "en");
  const { result, loading, error, run, reset } = useGenerator(endpoint);

  const set = (name: string, v: string) =>
    setValues((prev) => ({ ...prev, [name]: v }));

  const generate = async () => {
    const data = await run({
      language: lang,
      input: Object.fromEntries(
        Object.entries(values).filter(([, v]) => v !== undefined),
      ),
    });
    if (data.ok) {
      recordHistory(data);
    }
  };

  const recordHistory = (data: GeneratorResult) => {
    const promptSummary = fields
      .filter((f) => values[f.name]?.trim())
      .map((f) => `${f.label}: ${values[f.name].trim()}`)
      .join(" · ");
    const store = getHistoryStore();
    store.add({
      id: uid("h"),
      tool,
      toolLabel,
      prompt: promptSummary || title,
      resultText: data.raw ?? "",
      createdAt: Date.now(),
      status: "success",
      mode: data.mode,
    });
  };

  const missingRequired = fields.some(
    (f) => f.required && !values[f.name]?.trim(),
  );

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        badge={
          <Badge variant="secondary">
            {result?.mode === "ai" ? "AI provider" : "Free template"}
          </Badge>
        }
      />

      <Card className="mb-6 border-border">
        <CardContent className="p-5">
          {language ? (
            <div className="mb-4">
              <Field id="gen-language" label={language.title ?? "Language"}>
                <Select
                  id="gen-language"
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  options={language.options}
                />
              </Field>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => {
              const id = `gen-${f.name}`;
              return (
                <Field
                  key={f.name}
                  id={id}
                  label={f.label}
                  required={f.required}
                  hint={f.hint}
                  className={f.kind === "textarea" ? "sm:col-span-2" : ""}
                >
                  {f.kind === "select" ? (
                    <Select
                      id={id}
                      value={values[f.name] || f.default || ""}
                      onChange={(e) => set(f.name, e.target.value)}
                      options={f.options ?? []}
                    />
                  ) : f.kind === "textarea" ? (
                    <Textarea
                      id={id}
                      value={values[f.name] ?? ""}
                      onChange={(e) => set(f.name, e.target.value)}
                      placeholder={f.placeholder}
                      rows={f.name === "verse" || f.name === "text" ? 4 : 3}
                    />
                  ) : (
                    <Input
                      id={id}
                      type={f.kind === "number" ? "number" : "text"}
                      value={values[f.name] ?? ""}
                      onChange={(e) => set(f.name, e.target.value)}
                      placeholder={f.placeholder}
                    />
                  )}
                </Field>
              );
            })}
          </div>

          {note ? (
            <p className="mt-4 text-xs text-muted-foreground">{note}</p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={generate} loading={loading} disabled={missingRequired}>
              <Sparkles />
              Generate
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setValues(() => {
                  const init: Record<string, string> = {};
                  for (const f of fields) init[f.name] = f.default ?? "";
                  return init;
                });
                reset();
              }}
            >
              Clear
            </Button>
            {result && (
              <Button variant="secondary" onClick={generate} disabled={loading}>
                Regenerate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {error ? <ErrorState message={error} /> : null}

      {loading ? <LoadingState /> : null}

      {result?.notice ? (
        <div className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {result.notice}
        </div>
      ) : null}

      {!loading && !error ? (
        <OutputCard
          result={result}
          message={`No ${toolLabel.toLowerCase()} generated yet.`}
          onRegenerate={result ? generate : undefined}
          fileName={fileName}
        />
      ) : null}
    </div>
  );
}