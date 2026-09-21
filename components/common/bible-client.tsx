"use client";

import * as React from "react";
import { BookOpenText, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/common/field";
import { OutputCard } from "@/components/common/output-card";
import { LoadingState } from "@/components/common/loading-state";
import { ErrorState } from "@/components/common/error-state";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useGenerator } from "@/lib/use-generator";
import { getHistoryStore } from "@/lib/storage/history";
import { uid } from "@/lib/utils";

interface BibleTab {
  id: string;
  label: string;
  fields: {
    name: string;
    label: string;
    kind: "text" | "textarea" | "select";
    options?: string[];
    required?: boolean;
    placeholder?: string;
  }[];
}

const TABS: BibleTab[] = [
  {
    id: "story",
    label: "Bible Story",
    fields: [
      { name: "topic", label: "Story / Character", kind: "text", required: true, placeholder: "e.g. David and Goliath" },
    ],
  },
  {
    id: "verse",
    label: "Verse Explanation",
    fields: [
      { name: "verse", label: "Paste the exact verse", kind: "textarea", required: true, placeholder: "John 3:16 (KJV) — For God so loved the world... (quote your Bible exactly)" },
      { name: "translation", label: "Translation used", kind: "select", options: ["KJV", "NKJV", "ESV", "NIV", "ASV", "Telugu IRV", "Other"] },
    ],
  },
  {
    id: "song",
    label: "Christian Song",
    fields: [
      { name: "topic", label: "Song Topic", kind: "text", required: true, placeholder: "e.g. స్తుతి / His grace" },
      { name: "mood", label: "Mood", kind: "select", options: ["peaceful", "emotional", "hopeful", "powerful", "joyful", "sad"] },
    ],
  },
  {
    id: "prayer",
    label: "Prayer",
    fields: [
      { name: "topic", label: "Prayer Topic", kind: "text", required: true, placeholder: "e.g. peace, healing, guidance" },
    ],
  },
  {
    id: "sermon",
    label: "Sermon Outline",
    fields: [
      { name: "topic", label: "Sermon Theme", kind: "text", required: true, placeholder: "e.g. Grace" },
    ],
  },
  {
    id: "script",
    label: "Christian YouTube Script",
    fields: [
      { name: "topic", label: "Topic", kind: "text", required: true, placeholder: "e.g. 5 lessons from the Psalms" },
      { name: "duration", label: "Duration", kind: "select", options: ["30", "60", "180", "300", "600"] },
    ],
  },
  {
    id: "thumbnail",
    label: "Christian Thumbnail",
    fields: [
      { name: "topic", label: "Thumbnail Topic", kind: "text", required: true, placeholder: "e.g. God's love" },
    ],
  },
];

const LANG_OPTIONS = ["te", "en", "hi", "ta", "kn", "ml"];

export function BibleClient() {
  const [tab, setTab] = React.useState("story");
  const [lang, setLang] = React.useState("te");
  const [values, setValues] = React.useState<Record<string, string>>({});
  const { result, loading, error, run } = useGenerator("/api/bible");

  const active = TABS.find((t) => t.id === tab) ?? TABS[0];

  const generate = async () => {
    const input: Record<string, unknown> = { bibleTool: tab, ...values };
    const data = await run({ language: lang, input });
    if (data.ok) {
      getHistoryStore().add({
        id: uid("h"),
        tool: `bible-${tab}`,
        toolLabel: `Bible · ${active.label}`,
        prompt: Object.values(values).filter(Boolean).join(" · ") || active.label,
        resultText: data.raw ?? "",
        status: "success",
        mode: data.mode,
      });
    }
  };

  const missingRequired = active.fields.some(
    (f) => f.required && !values[f.name]?.trim(),
  );

  return (
    <div>
      <PageHeader
        title="Bible Content Generator"
        subtitle="Stories, verse explanations, Christian songs, prayers, sermons, scripts and thumbnails."
        badge={<Badge variant="secondary">Never invents Bible quotes</Badge>}
      />

      <Card className="mb-6 border-border">
        <CardContent className="p-5">
          <div className="mb-5 flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id);
                  setValues({});
                }}
                className={cn(
                  "rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground",
                  tab === t.id && "border-primary/50 bg-primary/10 text-primary",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mb-4">
            <Field id="bible-lang" label="Content language">
              <Select
                id="bible-lang"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                options={LANG_OPTIONS}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {active.fields.map((f) => {
              const id = `bible-${f.name}`;
              return (
                <Field
                  key={f.name}
                  id={id}
                  label={f.label}
                  required={f.required}
                  className={f.kind === "textarea" ? "sm:col-span-2" : ""}
                >
                  {f.kind === "select" ? (
                    <Select
                      id={id}
                      value={values[f.name] ?? ""}
                      onChange={(e) =>
                        setValues((p) => ({ ...p, [f.name]: e.target.value }))
                      }
                      options={f.options ?? []}
                    />
                  ) : f.kind === "textarea" ? (
                    <Textarea
                      id={id}
                      value={values[f.name] ?? ""}
                      onChange={(e) =>
                        setValues((p) => ({ ...p, [f.name]: e.target.value }))
                      }
                      placeholder={f.placeholder}
                      rows={4}
                    />
                  ) : (
                    <Input
                      id={id}
                      value={values[f.name] ?? ""}
                      onChange={(e) =>
                        setValues((p) => ({ ...p, [f.name]: e.target.value }))
                      }
                      placeholder={f.placeholder}
                    />
                  )}
                </Field>
              );
            })}
          </div>

          {tab === "verse" ? (
            <p className="mt-4 flex items-start gap-2 rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              <BookOpenText className="mt-0.5 size-4 shrink-0 text-primary" />
              We explain exactly the verse you paste and always label the
              translation. We never invent Bible quotations — verify against
              your printed Bible.
            </p>
          ) : null}

          <div className="mt-5 flex gap-2">
            <Button onClick={generate} loading={loading} disabled={missingRequired}>
              <Sparkles /> Generate
            </Button>
          </div>
        </CardContent>
      </Card>

      {error ? <ErrorState message={error} /> : null}
      {loading ? <LoadingState /> : null}
      {!loading && !error ? (
        <OutputCard result={result} fileName="bible-content.txt" />
      ) : null}
    </div>
  );
}