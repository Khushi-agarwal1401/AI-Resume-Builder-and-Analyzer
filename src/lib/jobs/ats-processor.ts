import type { DeepAtsOptions } from "../../services/resume-analyzer/deep-ats";
import { runAtsPipeline, persistAtsResult } from "../../services/resume-analyzer/ats-pipeline";
import { createAdminSupabaseClient } from "../../lib/supabase/admin";
import { updateJobStatus } from "./store";

export type AtsJobPayload = {
  text: string;
  category: DeepAtsOptions["category"];
  jobTitle?: string;
  jobDescription?: string;
  resumeId?: string;
  resumeTitle?: string;
  userId: string;
};

/**
 * Executes an ats-analysis job end to end: updates status to processing,
 * runs the shared pipeline, persists history + stored score, then marks the
 * job completed (or failed with the error). Reused by the BullMQ worker and
 * the inline (no-Redis) fallback so both paths behave identically.
 */
export async function processAtsJob(jobId: string, payload: AtsJobPayload): Promise<void> {
  await updateJobStatus(jobId, { status: "processing", started_at: new Date().toISOString() });
  try {
    const { report, ai } = await runAtsPipeline({
      text: payload.text,
      category: payload.category,
      jobTitle: payload.jobTitle,
      jobDescription: payload.jobDescription,
    });

    if (payload.resumeId) {
      const admin = createAdminSupabaseClient();
      await persistAtsResult(admin, {
        userId: payload.userId,
        resumeId: payload.resumeId,
        resumeTitle: payload.resumeTitle ?? "",
        report,
        aiStatus: ai.status,
      });
    }

    await updateJobStatus(jobId, {
      status: "completed",
      result: { report, ai, resumeId: payload.resumeId ?? null },
      completed_at: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await updateJobStatus(jobId, {
      status: "failed",
      error: message,
      completed_at: new Date().toISOString(),
    });
    throw error;
  }
}
