/**
 * In-process background job registry for the audio pipeline.
 * (Single-server friendly; swappable for Redis/BullMQ later.)
 */

export type JobStage =
  | "uploading"
  | "extracting"
  | "detecting"
  | "transcribing"
  | "timing"
  | "srt"
  | "complete"
  | "error";

export interface TranscribeResult {
  language: string;
  duration: number;
  segments: { start: number; end: number; text: string }[];
  model: string;
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