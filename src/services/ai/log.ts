import { createServerClient } from "@/lib/db/server";

export interface AiLogEntry {
  action: string;
  success: boolean;
  latency_ms: number;
  /** Which provider served the request ("groq" | "gemini"), when one ran. */
  provider?: string;
  /** Model name that produced the response (successes only). */
  model?: string;
  /** User-facing error message, truncated to keep the log lean. */
  error?: string;
}

/**
 * Best-effort AI request telemetry — one row per AI call so the admin
 * provider-health dashboard can show which provider (Groq vs Gemini) served
 * each request, its model, latency, and outcome.
 *
 * Never throws: the log sits on the hot path of every AI call, so a DB hiccup
 * must never degrade or break generation.
 */
export async function logAiRequest(entry: AiLogEntry): Promise<void> {
  try {
    const db = await createServerClient();
    await db.from("ai_request_logs").insert({
      action: entry.action,
      success: entry.success,
      latency_ms: entry.latency_ms,
      provider: entry.provider ?? "",
      model: entry.model ?? "",
      error: (entry.error ?? "").slice(0, 500),
    });
  } catch (error) {
    console.error("[ai-log] failed to record AI request:", error);
  }
}
