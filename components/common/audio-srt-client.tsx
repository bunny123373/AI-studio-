"use client";

import * as React from "react";
import {
  AudioLines,
  Download,
  FileAudio,
  Languages,
  ListPlus,
  Loader2,
  Merge,
  Pause,
  Play,
  Scissors,
  Trash2,
  UploadCloud,
  Youtube,
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

/**
 * Languages faster-whisper supports (99, minus auto-detect). Core first,
 * then the rest alphabetically — everything outputs in its native script.
 */
const LANGS = [
  { value: "auto", label: "Auto-detect" },
  { value: "te", label: "Telugu" },
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "ta", label: "Tamil" },
  { value: "kn", label: "Kannada" },
  { value: "ml", label: "Malayalam" },
  { value: "af", label: "Afrikaans" },
  { value: "am", label: "Amharic" },
  { value: "ar", label: "Arabic" },
  { value: "as", label: "Assamese" },
  { value: "az", label: "Azerbaijani" },
  { value: "ba", label: "Bashkir" },
  { value: "be", label: "Belarusian" },
  { value: "bg", label: "Bulgarian" },
  { value: "bn", label: "Bengali" },
  { value: "bo", label: "Tibetan" },
  { value: "br", label: "Breton" },
  { value: "bs", label: "Bosnian" },
  { value: "ca", label: "Catalan" },
  { value: "cs", label: "Czech" },
  { value: "cy", label: "Welsh" },
  { value: "da", label: "Danish" },
  { value: "de", label: "German" },
  { value: "el", label: "Greek" },
  { value: "es", label: "Spanish" },
  { value: "et", label: "Estonian" },
  { value: "eu", label: "Basque" },
  { value: "fa", label: "Persian" },
  { value: "fi", label: "Finnish" },
  { value: "fo", label: "Faroese" },
  { value: "fr", label: "French" },
  { value: "gl", label: "Galician" },
  { value: "gu", label: "Gujarati" },
  { value: "ha", label: "Hausa" },
  { value: "haw", label: "Hawaiian" },
  { value: "he", label: "Hebrew" },
  { value: "hr", label: "Croatian" },
  { value: "ht", label: "Haitian Creole" },
  { value: "hu", label: "Hungarian" },
  { value: "hy", label: "Armenian" },
  { value: "id", label: "Indonesian" },
  { value: "is", label: "Icelandic" },
  { value: "it", label: "Italian" },
  { value: "ja", label: "Japanese" },
  { value: "jv", label: "Javanese" },
  { value: "ka", label: "Georgian" },
  { value: "kk", label: "Kazakh" },
  { value: "km", label: "Khmer" },
  { value: "ko", label: "Korean" },
  { value: "la", label: "Latin" },
  { value: "lb", label: "Luxembourgish" },
  { value: "ln", label: "Lingala" },
  { value: "lo", label: "Lao" },
  { value: "lt", label: "Lithuanian" },
  { value: "lv", label: "Latvian" },
  { value: "mg", label: "Malagasy" },
  { value: "mi", label: "Maori" },
  { value: "mk", label: "Macedonian" },
  { value: "mn", label: "Mongolian" },
  { value: "mr", label: "Marathi" },
  { value: "ms", label: "Malay" },
  { value: "mt", label: "Maltese" },
  { value: "my", label: "Burmese" },
  { value: "ne", label: "Nepali" },
  { value: "nl", label: "Dutch" },
  { value: "nn", label: "Norwegian Nynorsk" },
  { value: "no", label: "Norwegian" },
  { value: "oc", label: "Occitan" },
  { value: "pa", label: "Punjabi" },
  { value: "pl", label: "Polish" },
  { value: "ps", label: "Pashto" },
  { value: "pt", label: "Portuguese" },
  { value: "ro", label: "Romanian" },
  { value: "ru", label: "Russian" },
  { value: "sa", label: "Sanskrit" },
  { value: "sd", label: "Sindhi" },
  { value: "si", label: "Sinhala" },
  { value: "sk", label: "Slovak" },
  { value: "sl", label: "Slovenian" },
  { value: "sn", label: "Shona" },
  { value: "so", label: "Somali" },
  { value: "sq", label: "Albanian" },
  { value: "sr", label: "Serbian" },
  { value: "su", label: "Sundanese" },
  { value: "sv", label: "Swedish" },
  { value: "sw", label: "Swahili" },
  { value: "tg", label: "Tajik" },
  { value: "th", label: "Thai" },
  { value: "tk", label: "Turkmen" },
  { value: "tl", label: "Tagalog" },
  { value: "tr", label: "Turkish" },
  { value: "tt", label: "Tatar" },
  { value: "uk", label: "Ukrainian" },
  { value: "ur", label: "Urdu" },
  { value: "uz", label: "Uzbek" },
  { value: "vi", label: "Vietnamese" },
  { value: "yi", label: "Yiddish" },
  { value: "yo", label: "Yoruba" },
  { value: "zh", label: "Chinese" },
];

/** 2-letter code → display label (falls back to uppercased code). */
const langLabel = (code: string) =>
  LANGS.find((l) => l.value === code)?.label ?? code.toUpperCase();

/** Target languages for bilingual subtitles (needs an AI text provider). */
const TARGET_LANGS = LANGS.filter((l) => l.value !== "auto");

const MODELS = ["tiny", "base", "small", "medium", "large-v3"];

const SEGMENTATION = [
  { value: "short", label: "Short (≈30 chars/line)", chars: 30 },
  { value: "medium", label: "Medium (≈60 chars/line)", chars: 60 },
  { value: "long", label: "Long (≈100 chars/line)", chars: 100 },
];

const FORMATS = [
  { value: "srt", label: "SRT (.srt)" },
  { value: "vtt", label: "WebVTT (.vtt)" },
  { value: "txt", label: "Plain text (.txt)" },
] as const;

const LAYOUTS = [
  { value: "original", label: "Original only" },
  { value: "translation", label: "Translation only" },
  { value: "dual", label: "Original + translation" },
] as const;

/* ------------------------------------------------ caption styling (CaptionX-style) */

type CapSize = "small" | "medium" | "large";
type CapPosition = "bottom" | "top" | "middle";
type CapThemeId = "clean" | "boldpop" | "neon" | "studio" | "yt" | "custom";

/** Style object also sent to /api/audio/srt and embedded in exports. */
interface CaptionStyle {
  textColor?: string;
  background?: string;
  size?: CapSize;
  position?: CapPosition;
}

interface CapTheme extends CaptionStyle {
  id: CapThemeId;
  label: string;
  /** Always set for presets (unlike generic CaptionStyle). */
  textColor: string;
  background: string;
  size: CapSize;
  position: CapPosition;
  /** Word-pop animation in the preview only (never in exported files). */
  pop: boolean;
  /** Color of the actively spoken word in pop mode. */
  accent: string;
}

const CAP_THEMES: CapTheme[] = [
  { id: "clean", label: "Clean", textColor: "#ffffff", background: "rgba(0,0,0,0.75)", size: "medium", position: "bottom", pop: false, accent: "#ffffff" },
  { id: "boldpop", label: "Bold pop", textColor: "#ffe14d", background: "rgba(0,0,0,0.85)", size: "large", position: "bottom", pop: true, accent: "#ffffff" },
  { id: "neon", label: "Neon", textColor: "#4df3ff", background: "rgba(0,0,0,0.6)", size: "large", position: "middle", pop: true, accent: "#ffffff" },
  { id: "studio", label: "Studio", textColor: "#ffffff", background: "rgba(0,0,0,0.7)", size: "medium", position: "middle", pop: false, accent: "#ffe14d" },
  { id: "yt", label: "YouTube", textColor: "#ffffff", background: "#000000", size: "small", position: "bottom", pop: false, accent: "#ffffff" },
];

const CAP_SIZE_OPTIONS = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
] as const;

const CAP_POSITION_OPTIONS = [
  { value: "bottom", label: "Bottom" },
  { value: "middle", label: "Middle" },
  { value: "top", label: "Top" },
] as const;

const CAP_BACKGROUND_OPTIONS = [
  { value: "rgba(0,0,0,0.75)", label: "Semi-transparent black" },
  { value: "#000000", label: "Solid black" },
  { value: "rgba(255,255,255,0.85)", label: "Semi-transparent white" },
  { value: "", label: "None" },
] as const;

const CAP_TEXT_SWATCHES = ["#ffffff", "#ffe14d", "#4df3ff", "#ff5a9e", "#7dff8a"];

type Format = (typeof FORMATS)[number]["value"];
type Layout = (typeof LAYOUTS)[number]["value"];

interface Health {
  localReady?: boolean;
  serverless?: boolean;
  ffmpeg?: { found: boolean };
  python?: { found: boolean };
  fasterWhisper?: { found: boolean };
  ytDlp?: { found: boolean };
  diarization?: { installed: boolean; tokenConfigured: boolean; ready: boolean };
  translation?: { configured: boolean; provider?: string };
  whisperModel?: string;
  maxAudioMb?: number;
}

interface Word {
  text: string;
  start: number;
  end: number;
}

interface Seg {
  id: string;
  start: number;
  end: number;
  text: string;
  speaker: string;
  translation: string;
  words: Word[];
}

interface JobStatus {
  ok: boolean;
  stage: string;
  progress: number;
  message: string;
  error?: string | null;
  result?: {
    language: string;
    detectedLanguage?: string;
    languageConfidence?: number;
    duration: number;
    model: string;
    source: "upload" | "url";
    url?: string;
    diarizeApplied?: boolean;
    translatedTo?: string;
    notice?: string;
    segments: {
      start: number;
      end: number;
      text: string;
      speaker?: string;
      translation?: string;
      words?: Word[];
    }[];
  } | null;
}

function seedSegments(
  list: {
    start: number;
    end: number;
    text: string;
    speaker?: string;
    translation?: string;
    words?: Word[];
  }[],
): Seg[] {
  return list.map((s) => ({
    id: uid("s"),
    start: s.start,
    end: s.end,
    text: s.text,
    speaker: s.speaker ?? "",
    translation: s.translation ?? "",
    words: s.words ?? [],
  }));
}

export function AudioSrtClient() {
  const [health, setHealth] = React.useState<Health | null>(null);
  const [healthError, setHealthError] = React.useState<string | null>(null);

  const [sourceMode, setSourceMode] = React.useState<"upload" | "url">("upload");
  const [file, setFile] = React.useState<File | null>(null);
  const [drag, setDrag] = React.useState(false);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
  const [urlInput, setUrlInput] = React.useState("");
  const [urlError, setUrlError] = React.useState<string | null>(null);

  const [language, setLanguage] = React.useState("auto");
  const [mode, setMode] = React.useState<"speech" | "song">("speech");
  const [segmentation, setSegmentation] = React.useState("medium");
  const [model, setModel] = React.useState("small");
  const [diarize, setDiarize] = React.useState(false);
  const [translateTo, setTranslateTo] = React.useState("");

  const [jobId, setJobId] = React.useState<string | null>(null);
  const [job, setJob] = React.useState<JobStatus | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const [segs, setSegs] = React.useState<Seg[]>([]);
  const [srt, setSrt] = React.useState("");
  const [srtValid, setSrtValid] = React.useState(true);
  const [srtErrors, setSrtErrors] = React.useState<string[]>([]);

  const [format, setFormat] = React.useState<Format>("srt");
  const [layout, setLayout] = React.useState<Layout>("original");
  const [speakersOn, setSpeakersOn] = React.useState(false);
  const [bom, setBom] = React.useState(true);

  /* caption styling — theme presets + custom controls */
  const [capTheme, setCapTheme] = React.useState<CapThemeId>("clean");
  const [capTextColor, setCapTextColor] = React.useState("#ffffff");
  const [capBackground, setCapBackground] = React.useState("rgba(0,0,0,0.75)");
  const [capSize, setCapSize] = React.useState<CapSize>("medium");
  const [capPosition, setCapPosition] = React.useState<CapPosition>("bottom");
  const [capPop, setCapPop] = React.useState(false);

  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);

  const charsFor = SEGMENTATION.find((s) => s.value === segmentation)?.chars ?? 60;

  const diarizationReady = Boolean(health?.diarization?.ready);
  const translationConfigured = Boolean(health?.translation?.configured);
  /** The local engine (Python + faster-whisper) can actually run on this host. */
  const localReady = Boolean(
    health?.localReady ?? (health?.python?.found && health?.fasterWhisper?.found),
  );
  /** Vercel/Netlify/Lambda — a host where Python can never be installed. */
  const serverless = Boolean(health?.serverless);

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
    setSourceMode("upload");
    setFile(f);
    setUploadError(null);
    setUrlError(null);
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
  const startUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    setUrlError(null);
    setJob(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("language", language);
      form.append("mode", mode);
      form.append("maxChars", String(charsFor));
      form.append("model", model);
      form.append("translateTo", translateTo);
      form.append("diarize", diarize ? "1" : "0");
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

  const startUrl = async () => {
    const url = urlInput.trim();
    if (!url) return;
    setUploading(true);
    setUrlError(null);
    setUploadError(null);
    setJob(null);
    try {
      const res = await fetch("/api/audio/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          language,
          mode,
          maxChars: charsFor,
          model,
          translateTo,
          diarize,
        }),
      });
      const data = (await res.json()) as { ok: boolean; jobId?: string; error?: string };
      if (!data.ok || !data.jobId) {
        setUrlError(data.error ?? "Could not start the job.");
        setUploading(false);
        return;
      }
      setFile(null);
      setJobId(data.jobId);
    } catch {
      setUrlError("Could not reach the YouTube downloader. Try again.");
      setUploading(false);
    }
  };

  const resetAll = () => {
    setJobId(null);
    setJob(null);
    setUploading(false);
    setUploadError(null);
    setUrlError(null);
    setSegs([]);
    setSrt("");
    setFile(null);
    setAudioUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    setSourceMode("upload");
    setUrlInput("");
  };

  const hasTranslation = segs.some((s) => s.translation);
  const hasSpeaker = segs.some((s) => s.speaker);

  /** Current caption style from the 4 state vars (theme-synced). */
  const styleOf = (): CaptionStyle => ({
    textColor: capTextColor,
    background: capBackground || undefined,
    size: capSize,
    position: capPosition,
  });

  const applyCapTheme = (id: CapThemeId) => {
    if (id === "custom") {
      setCapTheme("custom");
      return;
    }
    const t = CAP_THEMES.find((x) => x.id === id);
    if (!t) return;
    setCapTheme(id);
    setCapTextColor(t.textColor);
    setCapBackground(t.background);
    setCapSize(t.size);
    setCapPosition(t.position);
    setCapPop(t.pop);
    if (segs.length) {
      rebuildSrt(segs, {
        style: {
          textColor: t.textColor,
          background: t.background || undefined,
          size: t.size,
          position: t.position,
        },
      });
    }
  };

  const applyCapStyle = (
    patch: Partial<Pick<CaptionStyle, "textColor" | "background" | "size" | "position">>,
  ) => {
    const merged = {
      textColor: capTextColor,
      background: capBackground,
      size: capSize,
      position: capPosition,
      ...patch,
    };
    setCapTheme("custom");
    setCapTextColor(merged.textColor);
    setCapBackground(merged.background);
    setCapSize(merged.size);
    setCapPosition(merged.position);
    if (segs.length) {
      rebuildSrt(segs, {
        style: {
          textColor: merged.textColor,
          background: merged.background || undefined,
          size: merged.size,
          position: merged.position,
        },
      });
    }
  };

  const rebuildSrt = (
    next: Seg[],
    overrides?: {
      format?: Format;
      layout?: Layout;
      speakers?: boolean;
      style?: CaptionStyle;
    },
  ) => {
    const f = overrides?.format ?? format;
    const l = overrides?.layout ?? (next.some((s) => s.translation) ? layout : "original");
    const sp = overrides?.speakers ?? (next.some((s) => s.speaker) ? speakersOn : false);
    const st = overrides?.style ?? styleOf();
    // optimistically show locally-built text, then replace with the server's
    const local =
      f === "vtt"
        ? buildVttClient(next, l, sp, st)
        : f === "txt"
          ? buildTxtClient(next, l, sp)
          : buildSrtClient(next, l, sp, st);
    setSrt(local);
    fetch("/api/audio/srt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        segments: next.map((s) => ({
          start: s.start,
          end: s.end,
          text: s.text,
          speaker: s.speaker.trim() || undefined,
          translation: s.translation.trim() || undefined,
        })),
        format: f,
        layout: l,
        speakers: sp,
        style: st,
      }),
    })
      .then((r) => r.json())
      .then(
        (d: { ok: boolean; subtitles?: string; srt?: string; valid?: boolean; errors?: string[] }) => {
          if (d.ok) {
            setSrt(d.subtitles ?? d.srt ?? local);
            setSrtValid(d.valid ?? true);
            setSrtErrors(d.errors ?? []);
          }
        },
      )
      .catch(() => setSrtValid(true));
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
          const seeded = seedSegments(data.result.segments);
          setSegs(seeded);
          rebuildSrt(seeded);
          setLayout("original");
          setSpeakersOn(false);
          getHistoryStore().add({
            id: uid("h"),
            tool: "audio-to-srt",
            toolLabel: "Audio → SRT",
            prompt: `${data.result.source === "url" ? (data.result.url ?? "YouTube") : (file?.name ?? "audio")} · ${data.result.language} · ${mode} mode${data.result.translatedTo ? ` → ${data.result.translatedTo}` : ""}`,
            resultText: buildSrtClient(seeded),
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

  const updateSeg = (id: string, patch: Partial<Omit<Seg, "id" | "words">>) => {
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

  const joinWords = (ws: Word[]) => ws.map((w) => w.text).join(" ").replace(/\s+/g, " ").trim();

  const splitTranslation = (text: string | undefined, wordCount: number, total: number) => {
    if (!text) return { a: "", b: "" };
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length <= 1) return { a: text, b: text };
    const ratio = total > 0 ? wordCount / total : 0.5;
    const count = Math.max(1, Math.min(words.length - 1, Math.round(words.length * ratio)));
    return { a: words.slice(0, count).join(" "), b: words.slice(count).join(" ") };
  };

  const splitSeg = (id: string) => {
    setSegs((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const seg = prev[idx];
      const at = Math.min(
        seg.end - 0.35,
        Math.max(
          seg.start + 0.35,
          currentTime > seg.start && currentTime < seg.end
            ? currentTime
            : (seg.start + seg.end) / 2,
        ),
      );
      let a: Seg = { ...seg, end: Math.round(at * 1000) / 1000 };
      let b: Seg = { ...seg, id: uid("s"), start: Math.round(at * 1000) / 1000 };
      const ws = seg.words;
      if (ws && ws.length >= 2) {
        let cut = ws.findIndex((w) => w.start >= at);
        if (cut <= 0) cut = Math.floor(ws.length / 2);
        const aWords = ws.slice(0, cut);
        const trans = splitTranslation(seg.translation, cut, ws.length);
        if (aWords.length) {
          a = {
            ...seg,
            end: Math.round(aWords[aWords.length - 1].end * 1000) / 1000,
            text: joinWords(aWords),
            words: aWords,
            translation: trans.a,
          };
        }
        b = {
          ...seg,
          id: uid("s"),
          start: ws[cut] ? Math.round(ws[cut].start * 1000) / 1000 : a.end,
          text: ws[cut] ? joinWords(ws.slice(cut)) : seg.text,
          words: ws.slice(cut),
          translation: trans.b,
        };
      }
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
      const cur = prev[idx];
      const nextSeg = prev[idx + 1];
      const next = [...prev];
      next[idx] = {
        ...cur,
        end: nextSeg.end,
        text: `${cur.text} ${nextSeg.text}`.trim(),
        translation: `${cur.translation} ${nextSeg.translation}`.trim(),
        words: [...(cur.words ?? []), ...(nextSeg.words ?? [])],
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
      const row: Seg = { id: uid("s"), start: startT, end: startT + 2, text: "", speaker: "", translation: "", words: [] };
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

  const downloadNow = () => {
    const ext = format === "vtt" ? "vtt" : format === "txt" ? "txt" : "srt";
    const mime =
      format === "vtt"
        ? "text/vtt;charset=utf-8"
        : format === "txt"
          ? "text/plain;charset=utf-8"
          : "application/x-subrip";
    downloadTextFile(`subtitles.${ext}`, srt, mime, bom);
  };

  const words = segs[activeIndex]?.words ?? [];
  const activeWord = words.findIndex((w) => currentTime >= w.start && currentTime < w.end);

  /** Accent color for the actively spoken word when pop mode is on. */
  const popAccent = CAP_THEMES.find((t) => t.id === capTheme)?.accent ?? "#ffffff";

  /** Per-word preview styling: pop mode dims the rest + jumps the active word. */
  const wordStyle = (i: number): React.CSSProperties | undefined => {
    if (capPop) {
      return i === activeWord
        ? {
            color: popAccent,
            transform: "scale(1.16)",
            fontWeight: 800,
            transition: "transform 120ms, color 120ms",
          }
        : { opacity: 0.45, transition: "opacity 120ms, transform 120ms" };
    }
    return i === activeWord
      ? { fontWeight: 800, textDecoration: "underline", textDecorationThickness: 2 }
      : undefined;
  };

  /* ------------------------------------------------ render: source */
  const renderSource = (
    <div>
      <div className="mb-4 flex w-full rounded-lg border border-border bg-muted/20 p-1">
        <button
          onClick={() => setSourceMode("upload")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            sourceMode === "upload" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <UploadCloud className="size-4" /> Upload audio file
        </button>
        <button
          onClick={() => setSourceMode("url")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            sourceMode === "url" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Youtube className="size-4" /> YouTube URL
        </button>
      </div>

      {sourceMode === "upload" ? (
        <>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors ${
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
                MP3 · WAV · M4A · MP4 · OGG · FLAC · AAC — up to {health?.maxAudioMb ?? 200} MB
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

          {health && !localReady ? (
            <p className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              {serverless ? (
                <>
                  This deployment is serverless, which cannot run the local Whisper engine (no
                  Python). Deploy the same repo on <b>Render</b> with the included{" "}
                  <code className="font-mono">Dockerfile</code> to transcribe here — the steps are
                  in Settings.
                </>
              ) : (
                <>
                  The local engine is not ready. Install Python and run{" "}
                  <code className="font-mono">pip install faster-whisper</code> (see Settings)
                  before transcribing.
                </>
              )}
            </p>
          ) : null}
          {localReady && health?.ffmpeg?.found === false ? (
            <p className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              FFmpeg not found — WAV uploads still work. Install FFmpeg for MP3/M4A/MP4 (see
              Settings).
            </p>
          ) : null}
        </>
      ) : (
        <div>
          <Field id="yt-url" label="YouTube link">
            <Input
              id="yt-url"
              type="text"
              placeholder="https://www.youtube.com/watch?v=…"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />
          </Field>
          {localReady && health?.ytDlp?.found === false ? (
            <p className="mt-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              yt-dlp not found on this server — install{" "}
              <code className="font-mono">pip install yt-dlp</code> and restart to transcribe from
              YouTube links.
            </p>
          ) : null}
          {health && serverless && !localReady ? (
            <p className="mt-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              YouTube links need the local engine (yt-dlp + Whisper), which this serverless host
              cannot run — deploy on <b>Render</b> to use them.
            </p>
          ) : null}
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <Field
          id="srt-speakers"
          label="Speaker labels"
          hint={
            diarizationReady
              ? undefined
              : "Needs pyannote.audio + a Hugging Face token — pip install pyannote.audio and set PYANNOTE_AUTH_TOKEN (see Settings). Subtitles still work without it."
          }
        >
          <Select
            id="srt-speakers"
            value={diarize ? "on" : "off"}
            disabled={!diarizationReady}
            onChange={(e) => setDiarize(e.target.value === "on")}
            options={[
              { value: "off", label: "Off" },
              { value: "on", label: "On — label each line (Speaker 1, 2…)" },
            ]}
          />
        </Field>
        <Field
          id="srt-translate"
          label="Translate to (bilingual)"
          hint={translationConfigured ? "Adds a translated line under each subtitle." : "Needs an AI text provider (see Settings)."}
        >
          <Select
            id="srt-translate"
            value={translateTo}
            disabled={!translationConfigured}
            onChange={(e) => setTranslateTo(e.target.value)}
            options={[{ value: "", label: "Off — no translation" }, ...TARGET_LANGS]}
          />
        </Field>
      </div>

      {health?.translation?.configured === false ? (
        <p className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          <Languages className="mr-1 inline size-3.5" />
          Bilingual subtitles need an AI provider (OpenAI-compatible or Gemini) — add one in
          Settings. We never return fake translations.
        </p>
      ) : null}

      {sourceMode === "upload" && file ? (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-md border border-border bg-muted/30 p-3">
          <FileAudio className="size-5 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{fmtBytes(file.size)}</p>
          </div>
          <Button onClick={startUpload} loading={uploading} disabled={!file || uploading}>
            <AudioLines /> Transcribe
          </Button>
        </div>
      ) : null}
      {sourceMode === "url" ? (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-md border border-border bg-muted/30 p-3">
          <Youtube className="size-5 text-primary" />
          <p className="min-w-0 flex-1 truncate text-sm">
            {urlInput ? urlInput : "Paste a YouTube link above"}
          </p>
          <Button onClick={startUrl} loading={uploading} disabled={!urlInput.trim() || uploading}>
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
              {job.stage === "downloading"
                ? "Fetching the best audio track from YouTube (yt-dlp)."
                : job.stage === "translating"
                  ? "Sending subtitle lines to your configured AI provider."
                  : "Transcription runs locally with faster-whisper. Large models take longer on CPU."}
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
                · {langLabel(job?.result?.language ?? "auto")} · {mode} mode
                {job?.result?.translatedTo ? ` · translated → ${job.result.translatedTo}` : ""}
                {hasSpeaker ? " · labelled speakers" : ""}
              </span>
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => addAfter()}>
                <ListPlus /> Add line
              </Button>
              <CopyButton text={transcript} label="Copy text" />
            </div>
          </div>

          {job?.result?.detectedLanguage && language === "auto" ? (
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline" className="text-foreground/80">
                Detected: {langLabel(job.result.detectedLanguage)}
                {typeof job.result.languageConfidence === "number"
                  ? ` · ${Math.round(job.result.languageConfidence * 100)}% confidence`
                  : ""}
              </Badge>
              {job.result.language &&
              job.result.language !== job.result.detectedLanguage ? (
                <span className="text-amber-200">
                  You requested {langLabel(job.result.language)} — whisper heard{" "}
                  {langLabel(job.result.detectedLanguage)} and forced{" "}
                  {langLabel(job.result.language)}. If the script looks wrong, check the audio
                  language and try again.
                </span>
              ) : null}
            </div>
          ) : null}

          {job?.result?.notice ? (
            <p className="mb-3 whitespace-pre-line rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              {job.result.notice}
            </p>
          ) : null}

          <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
            {segs.map((s, i) => {
              const active = i === activeIndex;
              return (
                <div
                  key={s.id}
                  className={`group rounded-md border p-2 transition-colors ${
                    active ? "border-primary/50 bg-primary/5" : "border-border bg-card"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      className="flex h-7 w-16 items-center justify-center rounded-md border border-border bg-muted text-[11px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                      onClick={() => seek(s.start)}
                      disabled={!audioUrl}
                      title={
                        audioUrl
                          ? `Jump to ${fmtClock(s.start)}`
                          : "Audio preview is only available for uploaded files"
                      }
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
                    {hasSpeaker ? (
                      <>
                        <span className="text-[11px] text-muted-foreground">·</span>
                        <Input
                          value={s.speaker}
                          onChange={(e) => updateSeg(s.id, { speaker: e.target.value })}
                          placeholder="Speaker"
                          className="h-7 w-28 text-xs"
                          aria-label={`speaker of line ${i + 1}`}
                        />
                      </>
                    ) : null}
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
                  {hasTranslation ? (
                    <div className="mt-1">
                      <textarea
                        value={s.translation}
                        onChange={(e) => updateSeg(s.id, { translation: e.target.value })}
                        placeholder="Translation…"
                        rows={Math.max(1, Math.min(3, Math.ceil(s.translation.length / 70)))}
                        className="w-full resize-y rounded-md border border-border/60 bg-muted/20 px-2 py-1 text-sm leading-5 text-foreground/80 focus:border-primary focus:outline-none"
                        aria-label={`translation of line ${i + 1}`}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {audioUrl ? (
          <Card className="border-border">
            <CardContent className="p-4">
              <h2 className="mb-3 text-sm font-semibold">Synced preview</h2>
              <audio
                ref={audioRef}
                src={audioUrl}
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
                <p className="text-[11px] text-muted-foreground">
                  Click a line to jump. Split uses the playhead when it is inside the line. The
                  live styled + animated caption preview is in the “Caption style” card below.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border">
            <CardContent className="p-4 text-xs text-muted-foreground">
              <h2 className="mb-1 text-sm font-semibold text-foreground">No media preview</h2>
              Synced playback is only available for uploaded files. YouTube jobs show timestamps;
              use “Download” below to preview the subtitles in a player.
            </CardContent>
          </Card>
        )}

        <Card className="border-border">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Caption style</h2>
              <Badge variant="outline">preview + export</Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Preset looks like the big caption tools, with a live, word-by-word preview synced to
              the playhead.
            </p>

            {/* preset themes */}
            <div className="flex flex-wrap gap-1.5">
              {CAP_THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => applyCapTheme(t.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    capTheme === t.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
              <button
                onClick={() => applyCapTheme("custom")}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  capTheme === "custom"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
                }`}
              >
                Custom
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="cap-color" label="Text color">
                <div className="flex flex-wrap items-center gap-1.5">
                  {CAP_TEXT_SWATCHES.map((c) => (
                    <button
                      key={c}
                      aria-label={`Text color ${c}`}
                      onClick={() => applyCapStyle({ textColor: c })}
                      className="size-6 rounded-full border border-border transition-transform hover:scale-110"
                      style={{
                        backgroundColor: c,
                        boxShadow:
                          capTextColor === c && capTheme !== "custom"
                            ? "0 0 0 2px var(--primary)"
                            : capTextColor === c
                              ? "0 0 0 2px var(--ring)"
                              : undefined,
                      }}
                    />
                  ))}
                  <Input
                    className="h-8 w-24 font-mono text-xs"
                    value={capTextColor}
                    aria-label="Custom text color (hex)"
                    onChange={(e) => {
                      const v = e.target.value;
                      setCapTextColor(v);
                      if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                        applyCapStyle({ textColor: v });
                      }
                    }}
                  />
                </div>
              </Field>
              <Field id="cap-bg" label="Background">
                <Select
                  id="cap-bg"
                  value={capBackground}
                  onChange={(e) => applyCapStyle({ background: e.target.value })}
                  options={CAP_BACKGROUND_OPTIONS as unknown as { value: string; label: string }[]}
                />
              </Field>
              <Field id="cap-size" label="Font size">
                <Select
                  id="cap-size"
                  value={capSize}
                  onChange={(e) => applyCapStyle({ size: e.target.value as CapSize })}
                  options={CAP_SIZE_OPTIONS as unknown as { value: string; label: string }[]}
                />
              </Field>
              <Field id="cap-pos" label="Position">
                <Select
                  id="cap-pos"
                  value={capPosition}
                  onChange={(e) => applyCapStyle({ position: e.target.value as CapPosition })}
                  options={CAP_POSITION_OPTIONS as unknown as { value: string; label: string }[]}
                />
              </Field>
            </div>

            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={capPop}
                onChange={(e) => setCapPop(e.target.checked)}
                className="size-3.5 accent-primary"
              />
              Word-pop animation (active word jumps forward) — preview only
            </label>

            {/* live styled preview stage */}
            <div className="relative min-h-[9rem] overflow-hidden rounded-md border border-border bg-[#0b0b10]">
              <div
                className="absolute inset-x-0 px-3 text-center"
                style={
                  capPosition === "top"
                    ? { top: "14%" }
                    : capPosition === "middle"
                      ? { top: "50%", transform: "translateY(-50%)" }
                      : { bottom: "14%" }
                }
              >
                <span
                  className="inline-block rounded-md px-3 py-1 text-left leading-8"
                  style={{
                    color: capTextColor,
                    backgroundColor: capBackground || "transparent",
                    fontSize: capSize === "small" ? "1rem" : capSize === "large" ? "1.65rem" : "1.2rem",
                    fontWeight: 600,
                  }}
                >
                  {words.length > 0 ? (
                    words.map((w, i) => (
                      <span key={i} className="inline-block" style={wordStyle(i)}>
                        {w.text}&nbsp;
                      </span>
                    ))
                  ) : (
                    <>{segs[activeIndex]?.text ?? "Waiting for playback…"}</>
                  )}
                </span>
              </div>
            </div>

            <p className="text-[11px] leading-5 text-muted-foreground">
              <span className="font-medium text-foreground/80">Export notes:</span> text color is
              embedded in SRT (HTML &lt;font&gt; tags) and VTT (::cue). Background, font size and
              position are embedded in VTT and shown in this preview — most SRT players ignore
              them, so they are omitted from .srt output. Word-pop is preview-only; exported files
              stay standards-compliant.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Export subtitles</h2>
              <Badge variant={srtValid ? "success" : "destructive"}>
                {srtValid ? "Valid" : "Needs attention"}
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
                HH:MM:SS timestamps · sequential · no overlaps · UTF-8.
              </p>
            )}

            <div className="grid gap-3">
              <Field id="exp-format" label="Format">
                <Select
                  id="exp-format"
                  value={format}
                  onChange={(e) => {
                    const v = e.target.value as Format;
                    setFormat(v);
                    rebuildSrt(segs, { format: v });
                  }}
                  options={FORMATS as unknown as { value: string; label: string }[]}
                />
              </Field>
              {hasTranslation ? (
                <Field id="exp-layout" label="Subtitle layout">
                  <Select
                    id="exp-layout"
                    value={layout}
                    onChange={(e) => {
                      const v = e.target.value as Layout;
                      setLayout(v);
                      rebuildSrt(segs, { layout: v });
                    }}
                    options={LAYOUTS as unknown as { value: string; label: string }[]}
                  />
                </Field>
              ) : null}
              {hasSpeaker ? (
                <Field id="exp-speakers" label="Speaker names">
                  <Select
                    id="exp-speakers"
                    value={speakersOn ? "on" : "off"}
                    onChange={(e) => {
                      const v = e.target.value === "on";
                      setSpeakersOn(v);
                      rebuildSrt(segs, { speakers: v });
                    }}
                    options={[
                      { value: "off", label: "Hide" },
                      { value: "on", label: "Prefix lines (Speaker 1: …)" },
                    ]}
                  />
                </Field>
              ) : null}
            </div>

            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={bom}
                onChange={(e) => setBom(e.target.checked)}
                className="size-3.5 accent-primary"
              />
              Add UTF-8 BOM (helps Windows/media players read non-ASCII text)
            </label>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={downloadNow} disabled={!srt}>
                <Download /> Download .{format}
              </Button>
              <CopyButton text={srt} label="Copy file" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadTextFile("transcript.txt", transcript, "text/plain;charset=utf-8", bom)}
                disabled={!transcript}
              >
                <Download /> .txt transcript
              </Button>
              {job?.result?.source === "url" && job.result.url ? (
                <Button variant="ghost" size="sm" onClick={resetAll}>
                  New transcription
                </Button>
              ) : null}
            </div>

            <pre className="max-h-48 overflow-y-auto rounded-md border border-border bg-muted/30 p-3 text-[11px] leading-5 text-muted-foreground">
              {srt || "Build subtitles by editing lines above."}
            </pre>
          </CardContent>
        </Card>

        <p className="text-[11px] leading-5 text-muted-foreground">
          Privacy: uploaded audio and YouTube downloads are processed locally by this server —
          nothing is sent to a third party. Translation uses your configured AI provider.
          Temp files are deleted automatically.
        </p>
      </div>
    </div>
  ) : null;

  const processing =
    job && (job.stage === "complete" ? false : job.stage !== "error") && !uploadError;

  const showSource =
    !file || (uploadError && !segs.length) || !jobId || (job?.result?.source === "url" && !segs.length);

  return (
    <div>
      <PageHeader
        title="Audio → SRT Subtitles"
        subtitle={
          localReady
            ? "Real, local transcription with faster-whisper. Upload speech or a song — or paste a YouTube URL — and get sentence-aware, editable subtitles with karaoke-level sync."
            : "This host cannot run Whisper. Deploy the same app on Render (Dockerfile included) for real, local transcription — no third-party speech API."
        }
        badge={
          <Badge variant={localReady ? "success" : "outline"}>
            {localReady ? "100% local" : "needs a Whisper host"}
          </Badge>
        }
      />

      {healthError ? (
        <p className="mb-4 text-sm text-destructive">
          {healthError} — checks will re-run when you reload this page.
        </p>
      ) : null}

      {showSource ? (
        <Card className="mb-6 border-border">
          <CardContent className="p-5">{renderSource}</CardContent>
        </Card>
      ) : null}

      {(uploadError || urlError) && !segs.length ? <ErrorState message={uploadError ?? urlError ?? ""} /> : null}

      {(uploading || processing) && !segs.length ? (
        <div className="mb-6">{renderProgress}</div>
      ) : null}

      {!uploading && !processing && segs.length > 0 ? renderEditor : null}

      {!file && !urlInput && !segs.length ? (
        <p className="mt-4 text-xs text-muted-foreground">
          No upload needed for the rest of the studio — this tool is the only one that processes
          audio, and it keeps everything on the server that runs it.
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------ local builders (fallback preview) */

function buildSrtClient(
  segs: Seg[],
  layout: Layout = "original",
  speakers = false,
  style?: CaptionStyle,
): string {
  const clean = segs
    .filter((s) => s.text.trim())
    .map((s) => ({
      start: Math.max(0, Number(s.start) || 0),
      end: Math.max(0, Number(s.end) || 0),
      text: style?.textColor
        ? `<font color="${style.textColor}">${cueTextClient(s, layout, speakers)}</font>`
        : cueTextClient(s, layout, speakers),
    }));
  const stacked: { start: number; end: number; text: string }[] = [];
  for (const s of clean) {
    let start = s.start;
    let end = s.end > start ? s.end : start + 0.5;
    const prev = stacked[stacked.length - 1];
    if (prev && start < prev.end) {
      start = Math.round((prev.end + 0.001) * 1000) / 1000;
      if (end <= start) end = start + 0.5;
    }
    stacked.push({ start, end, text: s.text });
  }
  return stacked
    .map((s, i) => `${i + 1}\n${toSrtTime(s.start)} --> ${toSrtTime(s.end)}\n${s.text}`)
    .join("\n\n");
}

function buildVttClient(
  segs: Seg[],
  layout: Layout,
  speakers: boolean,
  style?: CaptionStyle,
): string {
  const base = segs
    .filter((s) => s.text.trim())
    .map((s) => {
      const start = Math.max(0, Number(s.start) || 0);
      let end = Math.max(0, Number(s.end) || 0);
      if (end <= start) end = start + 0.5;
      return { start, end, text: cueTextClient(s, layout, speakers) };
    });
  const styleBlock = vttStyleClient(style);
  const settings = vttSettingsClient(style?.position);
  return (
    `WEBVTT\n\n` +
    styleBlock +
    base
      .map((s) => `${vttTime(s.start)} --> ${vttTime(s.end)}${settings}\n${s.text}`)
      .join("\n\n")
  );
}

/** Client mirror of the server's WebVTT STYLE block builder. */
function vttStyleClient(style?: CaptionStyle): string {
  if (!style) return "";
  const rules: string[] = [];
  if (style.textColor) rules.push(`  color: ${style.textColor};`);
  if (style.background) rules.push(`  background-color: ${style.background};`);
  if (style.size) {
    rules.push(
      `  font-size: ${style.size === "small" ? "90%" : style.size === "large" ? "140%" : "110%"};`,
    );
  }
  if (rules.length === 0) return "";
  return `STYLE\n::cue {\n${rules.join("\n")}\n}\n\n`;
}

/** Client mirror of the server's WebVTT cue-positioning settings. */
function vttSettingsClient(position?: CapPosition): string {
  if (position === "top") return " line:10% align:middle";
  if (position === "middle") return " line:50% align:middle";
  return "";
}

function buildTxtClient(segs: Seg[], layout: Layout, speakers: boolean): string {
  return segs
    .map((s) => cueTextClient(s, layout, speakers))
    .filter(Boolean)
    .join("\n");
}

function cueTextClient(s: Seg, layout: Layout, speakers: boolean): string {
  const original = s.text.trim();
  const translation = s.translation.trim();
  let body = original;
  if (layout === "translation") body = translation || original;
  else if (layout === "dual") body = translation ? `${original}\n${translation}` : original;
  if (speakers && s.speaker.trim() && body) body = `${s.speaker.trim()}: ${body}`;
  return body;
}

function vttTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const ms = Math.round((seconds % 1) * 1000);
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  const pad = (n: number, w: number) => String(n).padStart(w, "0");
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)}.${pad(ms, 3)}`;
}