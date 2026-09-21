/**
 * In-process background job registry for the audio pipeline.
 * (Single-server friendly; swappable for Redis/BullMQ later.)
 */

export type JobStage =
  | "uploading"
  | "downloading"
  | "extracting"
  | "detecting"
  | "transcribing"
  | "translating"
  | "timing"
  | "srt"
  | "complete"
  | "error";

export interface Word {
  text: string;
  start: number;
  end: number;
}

export interface TranscribeSegment {
  start: number;
  end: number;
  text: string;
  /** Optional speaker label, e.g. "Speaker 1" (from diarization). */
  speaker?: string;
  /** Optional AI translation of `text` (bilingual mode). */
  translation?: string;
  /** Word-level timestamps for karaoke preview. */
  words?: Word[];
}

export interface TranscribeResult {
  language: string;
  /** Language whisper actually detected (may differ from `language`). */
  detectedLanguage?: string;
  /** 0..1 confidence of language detection. */
  languageConfidence?: number;
  duration: number;
  segments: TranscribeSegment[];
  model: string;
  source: "upload" | "url";
  /** Original YouTube URL when source === "url". */
  url?: string;
  /** Whether speaker diarization actually ran. */
  diarizeApplied?: boolean;
  /** Honest notes, e.g. diarization unavailable or translation skipped. */
  notice?: string;
  /** Target language when bilingual translation was requested/applied. */
  translatedTo?: string;
}

export interface AudioJob {
  id: string;
  stage: JobStage;
  progress: number;
  message: string;
  error: string | null;
  result: TranscribeResult | null;
  createdAt: number;
}

const jobs = new Map<string, AudioJob>();
const MAX_JOBS = 100;

export function createJob(id: string): AudioJob {
  const job: AudioJob = {
    id,
    stage: "uploading",
    progress: 2,
    message: "Preparing upload...",
    error: null,
    result: null,
    createdAt: Date.now(),
  };
  jobs.set(id, job);
  // keep the map bounded
  if (jobs.size > MAX_JOBS) {
    const oldest = [...jobs.entries()].sort(
      (a, b) => a[1].createdAt - b[1].createdAt,
    )[0];
    jobs.delete(oldest[0]);
  }
  return job;
}

export function updateJob(
  id: string,
  patch: Partial<Omit<AudioJob, "id" | "createdAt">>,
) {
  const job = jobs.get(id);
  if (job) Object.assign(job, patch);
}

export function getJob(id: string): AudioJob | undefined {
  return jobs.get(id);
}