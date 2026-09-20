"use client";

import * as React from "react";
import {
  AudioLines,
  Download,
  FileAudio,
  ListPlus,
  Loader2,
  Merge,
  Pause,
  Play,
  Scissors,
  Trash2,
  UploadCloud,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/common/field";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/common/error-state";
import { CopyButton } from "@/components/common/copy-button";
import { downloadTextFile, fmtBytes, fmtClock, toSrtTime, uid } from "@/lib/utils";
import { getHistoryStore } from "@/lib/storage/history";

const LANGS = [
  { value: "auto", label: "Auto-detect" },
  { value: "te", label: "Telugu" },
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "ta", label: "Tamil" },
  { value: "kn", label: "Kannada" },
  { value: "ml", label: "Malayalam" },
];

const MODELS = ["tiny", "base", "small", "medium", "large-v3"];

const SEGMENTATION = [
  { value: "short", label: "Short (≈30 chars/line)", chars: 30 },
  { value: "medium", label: "Medium (≈60 chars/line)", chars: 60 },
  { value: "long", label: "Long (≈100 chars/line)", chars: 100 },
];

interface Health {
  ffmpeg?: { found: boolean };
  python?: { found: boolean };
  fasterWhisper?: { found: boolean };
  whisperModel?: string;
  maxAudioMb?: number;
}

interface JobStatus {
  ok: boolean;
  stage: string;
  progress: number;
  message: string;
  error?: string | null;
  result?: {
    language: string;
    duration: number;
    model: string;
    segments: { start: number; end: number; text: string }[];
  } | null;
}

interface Seg {
  id: string;
  start: number;
  end: number;
  text: string;
}

function buildSrt(segs: { start: number; end: number; text: string }[]): string {
  const clean: { start: number; end: number; text: string }[] = [];
  for (const s of segs) {
    let start = Number(s.start) || 0;
    let end = Number(s.end) || 0;
    const text = (s.text ?? "").replace(/\r/g, "").trim();
    if (!text) continue;
    if (end <= start) end = start + 0.5;
    const prev = clean[clean.length - 1];
    if (prev && start < prev.end) {
      start = Math.round((prev.end + 0.001) * 1000) / 1000;
      if (end <= start) end = start + 0.5;
    }
    clean.push({ start: Math.round(start * 1000) / 1000, end: Math.round(end * 1000) / 1000, text });
  }
  return clean
    .map((s, i) => `${i + 1}\n${toSrtTime(s.start)} --> ${toSrtTime(s.end)}\n${s.text}`)
    .join("\n\n");
}

export function AudioSrtClient() {
  const [health, setHealth] = React.useState<Health | null>(null);
  const [healthError, setHealthError] = React.useState<string | null>(null);

  const [file, setFile] = React.useState<File | null>(null);
  const [drag, setDrag] = React.useState(false);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);

  const [language, setLanguage] = React.useState("auto");
  const [mode, setMode] = React.useState<"speech" | "song">("speech");
  const [segmentation, setSegmentation] = React.useState("medium");
  const [model, setModel] = React.useState("small");

  const [jobId, setJobId] = React.useState<string | null>(null);
  const [job, setJob] = React.useState<JobStatus | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const [segs, setSegs] = React.useState<Seg[]>([]);
  const [srt, setSrt] = React.useState("");
  const [srtValid, setSrtValid] = React.useState(true);
  const [srtErrors, setSrtErrors] = React.useState<string[]>([]);

  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);

  const charsFor = SEGMENTATION.find((s) => s.value === segmentation)?.chars ?? 60;

  /* ------------------------------------------------ health check */
  React.useEffect(() => {
    let alive = true;
    fetch("/api/audio/health")
      .then((r) => r.json())
      .then((d: Health) => alive && setHealth(d))
      .catch(() => alive && setHealthError("Could not check the audio pipeline."));
    return () => {
      alive = false;
    };
  }, []);

  /* ------------------------------------------------ pick a file */
  const pickFile = (f: File | null) => {
    if (!f) return;
    setFile(f);
    setUploadError(null);
    setJobId(null);
    setJob(null);
    setSegs([]);
    setSrt("");
    setAudioUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(f);
    });
    // sensible model default from server
    if (health?.whisperModel) setModel(health.whisperModel);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0] ?? null;
    if (f) pickFile(f);
  };

  /* ------------------------------------------------ upload + poll */
  const start = async () => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    setJob(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("language", language);
      form.append("mode", mode);
      form.append("maxChars", String(charsFor));
      form.append("model", model);
      const res = await fetch("/api/audio/transcribe", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as { ok: boolean; jobId?: string; error?: string };
      if (!data.ok || !data.jobId) {
        setUploadError(data.error ?? "Upload failed.");
        setUploading(false);
        return;
      }
      setJobId(data.jobId);
    } catch {
      setUploadError("Upload failed. Check your connection and try again.");
      setUploading(false);
    }
  };

  React.useEffect(() => {
    if (!jobId) return;
    const timer = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/audio/status/${jobId}`);
        const data = (await res.json()) as JobStatus;
        if (!data.ok) {
          setUploadError(data.error ?? "Job not found.");
          window.clearInterval(timer);
          setUploading(false);
          return;
        }
        setJob(data);
        if (data.stage === "complete" && data.result) {
          window.clearInterval(timer);
          setUploading(false);
          const seeded: Seg[] = data.result.segments.map((s) => ({
            id: uid("s"),
            start: s.start,
            end: s.end,
            text: s.text,
          }));
          setSegs(seeded);
          rebuildSrt(seeded);
          getHistoryStore().add({
            id: uid("h"),
            tool: "audio-to-srt",
            toolLabel: "Audio → SRT",
            prompt: `${file?.name ?? "audio"} · ${data.result.language} · ${mode} mode`,
            resultText: buildSrt(seeded),
            createdAt: Date.now(),
            status: "success",
            mode: "ai",
          });
        } else if (data.stage === "error") {
          window.clearInterval(timer);
          setUploading(false);
          setUploadError(data.error ?? "Transcription failed.");
        }
      } catch {
        // transient network error — keep polling
      }
    }, 1500);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const rebuildSrt = (next: Seg[]) => {
    const built = buildSrt(next);
    setSrt(built);
    fetch("/api/audio/srt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        segments: next.map((s) => ({ start: s.start, end: s.end, text: s.text })),
      }),
    })
      .then((r) => r.json())
      .then((d: { ok: boolean; srt?: string; valid?: boolean; errors?: string[] }) => {
        if (d.ok && d.srt) setSrt(d.srt);
        setSrtValid(d.valid ?? true);
        setSrtErrors(d.errors ?? []);
      })
      .catch(() => setSrtValid(true));
  };

  const updateSeg = (id: string, patch: Partial<Omit<Seg, "id">>) => {
    setSegs((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, ...patch } : s));
      rebuildSrt(next);
      return next;
    });
  };

  /* ------------------------------------------------ editing ops */
  const activeIndex = Math.max(
    0,
    segs.findIndex((s) => currentTime >= s.start && currentTime < s.end),
  );

  const splitSeg = (id: string) => {
    setSegs((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const seg = prev[idx];
      const at = Math.min(
        seg.end - 0.35,
        Math.max(
          seg.start + 0.35,
          currentTime > seg.start && currentTime < seg.end ? currentTime : (seg.start + seg.end) / 2,
        ),
      );
      const a: Seg = { ...seg, end: Math.round(at * 1000) / 1000 };
      const b: Seg = {
        id: uid("s"),
        start: Math.round(at * 1000) / 1000,
        end: seg.end,
        text: seg.text,
      };
      const next = [...prev];
      next[idx] = a;
      next.splice(idx + 1, 0, b);
      rebuildSrt(next);
      return next;
    });
  };

  const mergeSeg = (id: string) => {
    setSegs((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        end: next[idx + 1].end,
        text: `${next[idx].text} ${next[idx + 1].text}`.trim(),
      };
      next.splice(idx + 1, 1);
      rebuildSrt(next);
      return next;
    });
  };

  const deleteSeg = (id: string) => {
    setSegs((prev) => {
      const next = prev.filter((s) => s.id !== id);
      rebuildSrt(next);
      return next;
    });
  };

  const addAfter = (id?: string) => {
    setSegs((prev) => {
      const idx = id ? prev.findIndex((s) => s.id === id) : prev.length - 1;
      const anchor = prev[idx] ?? prev[prev.length - 1];
      const startT = anchor ? anchor.end + 0.3 : 0;
      const row: Seg = { id: uid("s"), start: startT, end: startT + 2, text: "" };
      const next = [...prev];
      next.splice(idx + 1, 0, row);
      return next;
    });
  };

  const seek = (t: number) => {
    const a = audioRef.current;
    if (a) a.currentTime = t;
    setCurrentTime(t);
  };

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      void a.play();
    } else {
      a.pause();
    }
  };

  const transcript = segs.map((s) => s.text).join("\n");

  /* ------------------------------------------------ render: upload */
  const renderUpload = (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-14 text-center transition-colors ${
          drag ? "border-primary bg-primary/5" : "border-border bg-card/50 hover:border-primary/40"
        }`}
        onClick={() => document.getElementById("audio-file-input")?.click()}
      >
        <UploadCloud className="size-9 text-primary" />
        <div>
          <p className="font-semibold text-foreground">
            {file ? "Replace audio file" : "Drop an audio file here or click to browse"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            MP3 · WAV · M4A · MP4 · OGG · FLAC · AAC — up to{" "}
            {health?.maxAudioMb ?? 200} MB
          </p>
        </div>
        <input
          id="audio-file-input"
          type="file"
          accept="audio/*,video/mp4,.mp3,.wav,.m4a,.ogg,.flac,.aac,.webm"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {health?.ffmpeg?.found === false ? (
        <p className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          FFmpeg not found — WAV uploads still work. Install FFmpeg for MP3/M4A/MP4
          (see Settings).
        </p>
      ) : null}
      {health?.fasterWhisper?.found === false ? (
        <p className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          faster-whisper is not installed — run{" "}
          <code className="font-mono">pip install faster-whisper</code> (see Settings)
          before transcribing.
        </p>
      ) : null}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field id="srt-lang" label="Language">
          <Select
            id="srt-lang"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            options={LANGS}
          />
        </Field>
        <Field id="srt-mode" label="Mode">
          <Select
            id="srt-mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as "speech" | "song")}
            options={[
              { value: "speech", label: "Speech (podcast, sermon, talk)" },
              { value: "song", label: "Song / music (word-level timing)" },
            ]}
          />
        </Field>
        <Field id="srt-seg" label="Subtitle lines">
          <Select
            id="srt-seg"
            value={segmentation}
            onChange={(e) => setSegmentation(e.target.value)}
            options={SEGMENTATION}
          />
        </Field>
        <Field
          id="srt-model"
          label="Whisper model"
          hint="Larger = more accurate, slower, more RAM."
        >
          <Select
            id="srt-model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            options={MODELS}
          />
        </Field>
      </div>

      {file ? (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-md border border-border bg-muted/30 p-3">
          <FileAudio className="size-5 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{fmtBytes(file.size)}</p>
          </div>
          <Button onClick={start} loading={uploading} disabled={!file || uploading}>
            <AudioLines /> Transcribe
          </Button>
        </div>
      ) : null}
    </div>
  );

  /* ------------------------------------------------ render: progress */
  const renderProgress = job ? (
    <Card className="border-border">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="size-5 animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium">{job.message}</p>
            <p className="text-xs text-muted-foreground">
              Transcription runs locally with faster-whisper. Large models take
              longer on CPU.
            </p>
          </div>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${Math.max(4, Math.min(100, job.progress))}%` }}
          />
        </div>
        <p className="text-right text-xs text-muted-foreground">
          {Math.round(job.progress)}% · stage: {job.stage}
        </p>
      </CardContent>
    </Card>
  ) : null;

  /* ------------------------------------------------ render: editor */
  const renderEditor = segs.length > 0 ? (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">
              {segs.length} subtitles{" "}
              <span className="ml-1 font-normal text-muted-foreground">
                · {job?.result?.language ?? "auto"} · {mode} mode
              </span>
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => addAfter()}>
                <ListPlus /> Add line
              </Button>
              <CopyButton text={transcript} label="Copy text" />
            </div>
          </div>

          <div className="max-h-[500px] space-y-2 overflow-y-auto pr-1">
            {segs.map((s, i) => {
              const active = i === activeIndex;
              return (
                <div
                  key={s.id}
                  className={`group rounded-md border p-2 transition-colors ${
                    active ? "border-primary/50 bg-primary/5" : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <button
                      className="flex h-7 w-16 items-center justify-center rounded-md border border-border bg-muted text-[11px] font-medium text-muted-foreground hover:text-foreground"
                      onClick={() => seek(s.start)}
                      title={`Jump to ${fmtClock(s.start)}`}
                    >
                      {fmtClock(s.start)}
                    </button>
                    <Input
                      type="number"
                      step="0.1"
                      min={0}
                      value={Number(s.start.toFixed(2))}
                      onChange={(e) => updateSeg(s.id, { start: Number(e.target.value) || 0 })}
                      className="h-7 w-20 text-xs"
                      aria-label={`start time of line ${i + 1}`}
                    />
                    <span className="text-[11px] text-muted-foreground">→</span>
                    <Input
                      type="number"
                      step="0.1"
                      min={0}
                      value={Number(s.end.toFixed(2))}
                      onChange={(e) => updateSeg(s.id, { end: Number(e.target.value) || 0 })}
                      className="h-7 w-20 text-xs"
                      aria-label={`end time of line ${i + 1}`}
                    />
                    <div className="ml-auto flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                        onClick={() => splitSeg(s.id)}
                        title="Split at playhead/middle"
                      >
                        <Scissors className="size-3.5" />
                      </button>
                      <button
                        className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
                        onClick={() => mergeSeg(s.id)}
                        disabled={i >= segs.length - 1}
                        title="Merge with next"
                      >
                        <Merge className="size-3.5" />
                      </button>
                      <button
                        className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive"
                        onClick={() => deleteSeg(s.id)}
                        title="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={s.text}
                    onChange={(e) => updateSeg(s.id, { text: e.target.value })}
                    rows={Math.max(1, Math.min(3, Math.ceil(s.text.length / 70)))}
                    className="mt-1.5 w-full resize-y rounded-md border border-transparent bg-transparent px-2 py-1 text-sm leading-5 text-foreground/90 hover:border-border focus:border-primary focus:outline-none"
                    aria-label={`text of line ${i + 1}`}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <h2 className="mb-3 text-sm font-semibold">Synced preview</h2>
            <audio
              ref={audioRef}
              src={audioUrl ?? undefined}
              controls
              className="w-full"
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
            />
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={togglePlay} aria-label="Play/pause">
                  {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
                </Button>
                <span className="text-xs text-muted-foreground">
                  {fmtClock(currentTime)} /{" "}
                  {fmtClock(job?.result?.duration ?? (segs[segs.length - 1]?.end ?? 0))}
                </span>
              </div>
              <div
                className="cursor-pointer rounded-md border border-border bg-muted/30 p-3 text-sm text-foreground/90"
                onClick={() => seek(segs[activeIndex]?.start ?? 0)}
                title="Jump to the highlighted line"
              >
                {segs[activeIndex]?.text ?? "Waiting for playback…"}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Click a line to jump. Split uses the playhead when it is inside the line.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">SRT file</h2>
              <Badge variant={srtValid ? "success" : "destructive"}>
                {srtValid ? "Valid SRT" : "Needs attention"}
              </Badge>
            </div>
            {srtErrors.length > 0 ? (
              <ul className="list-inside list-disc text-xs text-destructive">
                {srtErrors.slice(0, 3).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">
                {segs.length} lines · UTF-8 · HH:MM:SS,mmm timestamps· no overlaps.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => downloadTextFile("subtitles.srt", srt, "application/x-subrip")}
                disabled={!srt}
              >
                <Download /> Download .srt
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadTextFile("transcript.txt", transcript)}
                disabled={!transcript}
              >
                <Download /> .txt transcript
              </Button>
            </div>
            <pre className="max-h-40 overflow-y-auto rounded-md border border-border bg-muted/30 p-3 text-[11px] leading-5 text-muted-foreground">
              {srt || "Build subtitles by editing lines above."}
            </pre>
          </CardContent>
        </Card>

        <p className="text-[11px] leading-5 text-muted-foreground">
          Privacy: audio is processed locally by this server — it is not sent to any
          third party. Uploaded temp files are deleted automatically.
        </p>
      </div>
    </div>
  ) : null;

  const processing =
    job && (job.stage === "complete" ? false : job.stage !== "error") && !uploadError;

  return (
    <div>
      <PageHeader
        title="Audio → SRT Subtitles"
        subtitle="Real, local transcription with faster-whisper. Upload speech or a song and get editable, synced subtitles you can export as .srt."
        badge={<Badge variant="success">100% local</Badge>}
      />

      {healthError ? (
        <p className="mb-4 text-sm text-destructive">
          {healthError} — checks will re-run when you reload this page.
        </p>
      ) : null}

      {!file || (uploadError && !segs.length) || !jobId ? (
        <Card className="mb-6 border-border">
          <CardContent className="p-5">{renderUpload}</CardContent>
        </Card>
      ) : null}

      {uploadError && !segs.length ? <ErrorState message={uploadError} /> : null}

      {(uploading || processing) && !segs.length ? (
        <div className="mb-6">{renderProgress}</div>
      ) : null}

      {!uploading && !processing && segs.length > 0 ? renderEditor : null}

      {!file ? (
        <p className="mt-4 text-xs text-muted-foreground">
          No upload needed for the rest of the studio — this tool is the only one that
          processes audio, and it keeps everything on this machine.
        </p>
      ) : null}
    </div>
  );
}