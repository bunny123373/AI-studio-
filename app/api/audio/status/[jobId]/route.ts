import { json } from "@/lib/api/generate-route";
import { getJob } from "@/lib/audio/jobs";

/** GET /api/audio/status/[jobId] — poll a transcription job. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const job = getJob(jobId);
  if (!job) {
    return json({ ok: false, error: "Job not found (it may have expired)." }, 404);
  }
  return json({
    ok: true,
    id: job.id,
    stage: job.stage,
    progress: job.progress,
    message: job.message,
    error: job.error,
    result: job.result,
  });
}