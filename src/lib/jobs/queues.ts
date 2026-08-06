import { Queue } from "bullmq";
import { createJob, updateJobStatus } from "./store";
import type { BackgroundJob, JobStatus, JobType } from "./types";

export interface QueueConnection {
  url: string;
  maxRetriesPerRequest: null;
}

/** Redis connection for BullMQ, or null when not configured (inline fallback). */
export function getQueueConnection(): QueueConnection | null {
  const url = process.env.REDIS_URL;
  return url ? { url, maxRetriesPerRequest: null } : null;
}

export function isBackgroundJobsEnabled(): boolean {
  return !!getQueueConnection();
}

const JOB_OPTS = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 2000 },
  removeOnComplete: { age: 3600, count: 500 },
  removeOnFail: { age: 86400, count: 1000 },
};

const _queues = new Map<string, Queue>();

function queueFor(type: JobType): Queue {
  let queue = _queues.get(type);
  if (!queue) {
    const connection = getQueueConnection();
    if (!connection) throw new Error("Redis not configured — cannot enqueue job");
    queue = new Queue(type, { connection });
    _queues.set(type, queue);
  }
  return queue;
}

export interface EnqueueResult {
  jobId: string;
  status: JobStatus;
}

/**
 * Persist a background job and enqueue it on BullMQ. When Redis is not
 * configured the job is executed inline (still tracked in background_jobs),
 * so callers keep working without extra infrastructure.
 *
 * `process` owns the DB status transitions (processing → completed/failed).
 */
export async function enqueueJob<T extends Record<string, unknown>>(
  userId: string,
  type: JobType,
  payload: T,
  process?: (jobId: string, payload: T) => Promise<void>
): Promise<EnqueueResult> {
  const job: BackgroundJob = await createJob(userId, type, payload);

  if (!getQueueConnection()) {
    if (process) {
      try {
        await process(job.id, payload);
        return { jobId: job.id, status: "completed" };
      } catch {
        return { jobId: job.id, status: "failed" };
      }
    }
    return { jobId: job.id, status: "queued" };
  }

  await queueFor(type).add(type, { jobId: job.id, userId, payload }, JOB_OPTS);
  return { jobId: job.id, status: "queued" };
}

/** Mark a job cancelled (used by future cancellation endpoints). */
export async function cancelJob(id: string): Promise<void> {
  await updateJobStatus(id, { status: "cancelled", completed_at: new Date().toISOString() });
}
