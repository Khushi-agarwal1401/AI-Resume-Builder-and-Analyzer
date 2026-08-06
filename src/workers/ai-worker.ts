/**
 * Background AI worker (BullMQ). Drains the ats-analysis queue and runs the
 * shared pipeline, writing status/results to background_jobs.
 *
 * Run: pnpm worker   (requires REDIS_URL + Supabase env)
 */
import { Worker } from "bullmq";
import { getQueueConnection } from "../lib/jobs/queues";
import { processAtsJob, type AtsJobPayload } from "../lib/jobs/ats-processor";

// Load local env for standalone execution (tsx). No-op in CI when absent.
try {
  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile(".env.local");
  }
} catch {
  // No local env file — rely on process env.
}

const connection = getQueueConnection();
if (!connection) {
  console.error("[worker] REDIS_URL is not set — background worker disabled. Set REDIS_URL and restart.");
  process.exit(1);
}

const worker = new Worker(
  "ats-analysis",
  async (job) => {
    const { jobId, payload } = job.data as { jobId: string; payload: AtsJobPayload };
    await processAtsJob(jobId, payload);
  },
  { connection, concurrency: 2 }
);

worker.on("completed", (job) => console.log(`[worker] job ${job.id} completed`));
worker.on("failed", (job, err) => console.error(`[worker] job ${job.id} failed: ${err.message}`));
worker.on("error", (err) => console.error(`[worker] error: ${err.message}`));

console.log("[worker] AI background worker listening for ats-analysis jobs…");

// Graceful shutdown for SIGINT/SIGTERM.
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    console.log(`[worker] received ${signal}, shutting down…`);
    await worker.close();
    process.exit(0);
  });
}
