"use client";

import * as React from "react";
import { Bot, Eraser, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/common/error-state";
import { CopyButton } from "@/components/common/copy-button";
import { getHistoryStore } from "@/lib/storage/history";
import { uid } from "@/lib/utils";

interface ChatMessageUI {
  role: "user" | "assistant";
  content: string;
  mode?: "template" | "ai";
  notice?: string;
}

interface ChatApiResult {
  ok: boolean;
  mode?: "template" | "ai";
  reply?: string;
  notice?: string;
  error?: string;
}

const SUGGESTIONS = [
  "What tools are available?",
  "Write a 60-second YouTube script about building morning habits",
  "Give me YouTube title ideas for a cooking channel",
  "Translate \"Good morning, friends\" to Telugu",
  "How do I add a free AI provider?",
  "Give me a thumbnail concept for a phone review video",
];

const REF = `flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold`;

export function ChatClient() {
  const [messages, setMessages] = React.useState<ChatMessageUI[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const endRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const lastMode = React.useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") return messages[i].mode;
    }
    return undefined;
  }, [messages]);

  const send = async (raw?: string) => {
    const content = (raw ?? input).trim();
    if (!content || loading) return;
    const history = messages.slice(-30).map((m) => ({
      role: m.role,
      content: m.content,
    }));
    setMessages((prev) => [...prev, { role: "user", content }]);
    if (!raw) setInput("");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, history }),
      });
      let data: ChatApiResult;
      try {
        data = (await res.json()) as ChatApiResult;
      } catch {
        data = { ok: false, error: "The server returned an invalid response." };
      }
      if (!data.ok) {
        setError(data.error ?? `Request failed (${res.status}).`);
        return;
      }
      const reply = data.reply ?? "";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply, mode: data.mode, notice: data.notice },
      ]);
      getHistoryStore().add({
        id: uid("h"),
        tool: "chat",
        toolLabel: "Agent Chat",
        prompt: content.slice(0, 120),
        resultText: reply,
        status: "success",
        mode: data.mode,
      });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const newChat = () => {
    setMessages([]);
    setInput("");
    setError(null);
  };

  return (
    <div>
      <PageHeader
        title="Agent Chat"
        subtitle="A real multi-turn conversation with your configured AI provider — or the honest built-in offline assistant when none is set (free-first, always works)."
        badge={
          lastMode === "ai" ? (
            <Badge variant="success">AI provider</Badge>
          ) : lastMode === "template" ? (
            <Badge variant="secondary">Free template · offline assistant</Badge>
          ) : (
            <Badge variant="secondary">Free-first · AI-ready</Badge>
          )
        }
      />

      <Card className="mb-4 border-border">
        <CardContent className="flex h-[60vh] min-h-[420px] flex-col p-4">
          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-muted text-primary">
                  <Bot className="size-7" />
                </div>
                <div className="max-w-md">
                  <p className="text-sm font-medium text-foreground">
                    Ask me anything about creating with Balu AI Studio
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    With an AI provider configured I draft content for you —
                    scripts, lyrics, captions, titles, translations and more.
                    Without one, I&apos;m an honest offline assistant that knows
                    every tool and how the free setup works.
                  </p>
                </div>
                <div className="flex max-w-lg flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      disabled={loading}
                      className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" ? (
                    <div className={`${REF} border border-border bg-muted text-primary`}>
                      <Bot className="size-4" />
                    </div>
                  ) : null}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                      m.role === "user"
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm border border-border bg-muted/40 text-foreground/90"
                    }`}
                  >
                    {m.role === "user" ? (
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    ) : (
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => (
                            <p className="whitespace-pre-wrap break-words [&:not(:first-child)]:mt-2">
                              {children}
                            </p>
                          ),
                          ul: ({ children }) => (
                            <ul className="mt-2 list-disc space-y-1 pl-5">{children}</ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="mt-2 list-decimal space-y-1 pl-5">{children}</ol>
                          ),
                          li: ({ children }) => <li>{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                          code: ({ children }) => (
                            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] text-primary">
                              {children}
                            </code>
                          ),
                          pre: ({ children }) => (
                            <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-muted/50 p-3 text-xs leading-5">
                              {children}
                            </pre>
                          ),
                          a: ({ children, href }) => (
                            <a href={href} target="_blank" rel="noreferrer" className="text-primary underline">
                              {children}
                            </a>
                          ),
                          h1: ({ children }) => <h1 className="mt-2 text-base font-semibold">{children}</h1>,
                          h2: ({ children }) => <h2 className="mt-2 text-sm font-semibold">{children}</h2>,
                          h3: ({ children }) => <h3 className="mt-2 text-sm font-semibold">{children}</h3>,
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    )}
                    {m.role === "assistant" ? (
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {m.mode === "ai" ? "AI provider" : "Offline assistant"}
                        </span>
                        <CopyButton text={m.content} />
                      </div>
                    ) : null}
                    {m.notice ? (
                      <p className="mt-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] leading-4 text-amber-200">
                        {m.notice}
                      </p>
                    ) : null}
                  </div>
                  {m.role === "user" ? (
                    <div className={`${REF} bg-primary text-primary-foreground`}>You</div>
                  ) : null}
                </div>
              ))
            )}
            {loading ? (
              <div className="flex items-center gap-2">
                <div className={`${REF} border border-border bg-muted text-primary`}>
                  <Bot className="size-4" />
                </div>
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-border bg-muted/40 px-4 py-3">
                  <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
                  <span
                    className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
                    style={{ animationDelay: "120ms" }}
                  />
                  <span
                    className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
                    style={{ animationDelay: "240ms" }}
                  />
                </div>
              </div>
            ) : null}
            <div ref={endRef} />
          </div>

          {error ? (
            <div className="mt-3">
              <ErrorState message={error} />
            </div>
          ) : null}

          {/* Composer */}
          <form
            className="mt-4 flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask me anything…  (Enter to send, Shift+Enter for a new line)"
              rows={2}
              maxLength={4000}
              className="min-h-0 flex-1 resize-none"
            />
            <Button type="submit" loading={loading} disabled={!input.trim()}>
              <Send />
              Send
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={newChat}
              disabled={loading || messages.length === 0}
              title="Start a new chat"
            >
              <Eraser />
              <span className="hidden sm:inline">New</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Every reply is honest: it shows <b>AI provider</b> or{" "}
        <b>Offline assistant</b>. Conversations are not sent anywhere except your
        configured provider — keys stay server-side.
      </p>
    </div>
  );
}