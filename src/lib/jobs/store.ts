import { createAdminClient } from "../../lib/db/admin";
import type { Json } from "../db/types";
import type { BackgroundJob, JobStatus, JobType } from "./types";

/**
 * Create a job row. Uses the admin client so both API routes and the
 * standalone worker can persist through the same code path (ownership is
 * enforced explicitly via user_id).
 */
export async function createJob(
  userId: string,
  jobType: JobType,
  payload: Record<string, unknown>
): Promise<BackgroundJob> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("background_jobs")
    .insert({ user_id: userId, job_type: jobType, status: "queued", payload: payload as unknown as Json })
    .select()
    .single();
  if (error || !data) throw new Error(error?.message || "Failed to create job");
  return data as BackgroundJob;
}

export async function updateJobStatus(
  id: string,
  update: {
    status?: JobStatus;
    result?: Record<string, unknown> | null;
    error?: string | null;
    attempts?: number;
    started_at?: string | null;
    completed_at?: string | null;
  }
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("background_jobs")
    .update({
      ...update,
      result: update.result === undefined ? undefined : (update.result as unknown as Json),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/** Fetch a job only if it belongs to the given user (ownership check). */
export async function getJobForUser(id: string, userId: string): Promise<BackgroundJob | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("background_jobs")
    .select()
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as BackgroundJob | null) ?? null;
}
