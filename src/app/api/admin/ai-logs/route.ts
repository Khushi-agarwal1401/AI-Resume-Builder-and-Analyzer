import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerClient } from "@/lib/db/server";
import { getPool } from "@/lib/db/connection";
import { isAdmin } from "@/lib/admin";
import { fail, logError } from "@/lib/api";

export const dynamic = "force-dynamic";

export interface AiLogsSummary {
  total: number;
  success: number;
  failed: number;
  successRate: number;
  avgLatencyMs: number;
  groq: number;
  gemini: number;
  local: number;
  none: number;
}

const EMPTY_SUMMARY: AiLogsSummary = {
  total: 0,
  success: 0,
  failed: 0,
  successRate: 0,
  avgLatencyMs: 0,
  groq: 0,
  gemini: 0,
  local: 0,
  none: 0,
};

/**
 * GET /api/admin/ai-logs?limit=50&offset=0
 * Returns AI request telemetry (newest first) plus all-time summary stats
 * (success rate, average latency, provider split). Admin-only.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !(await isAdmin(session.user.id, session.user.email || ""))) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10) || 50, 1), 200);
  const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10) || 0, 0);

  const db = await createServerClient();
  const pool = getPool();

  const { data: rows, error } = await db
    .from("ai_request_logs")
    .select("id, action, provider, model, success, latency_ms, error, created_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    await logError(error, "admin ai-logs list");
    return fail("Failed to load AI request logs");
  }

  const { count } = await db
    .from("ai_request_logs")
    .select("id", { count: "exact", head: true });

  // All-time summary. The query builder has no aggregates, so this runs as a
  // single raw SQL statement over the pool.
  let summary: AiLogsSummary = { ...EMPTY_SUMMARY, total: count || 0 };
  try {
    const res = await pool.query(
      `SELECT
         count(*)::int AS total,
         count(*) FILTER (WHERE success)::int AS success,
         count(*) FILTER (WHERE NOT success)::int AS failed,
         coalesce(avg(latency_ms) FILTER (WHERE success), 0)::int AS avg_latency_ms,
         count(*) FILTER (WHERE provider = 'groq')::int AS groq,
         count(*) FILTER (WHERE provider = 'gemini')::int AS gemini,
         count(*) FILTER (WHERE provider = 'local')::int AS local,
         count(*) FILTER (WHERE provider = '')::int AS none
       FROM ai_request_logs`
    );
    const s = res.rows[0] || {};
    const total = Number(s.total ?? 0);
    const success = Number(s.success ?? 0);
    summary = {
      total,
      success,
      failed: Number(s.failed ?? 0),
      successRate: total > 0 ? Math.round((success / total) * 100) : 0,
      avgLatencyMs: Number(s.avg_latency_ms ?? 0),
      groq: Number(s.groq ?? 0),
      gemini: Number(s.gemini ?? 0),
      local: Number(s.local ?? 0),
      none: Number(s.none ?? 0),
    };
  } catch (e) {
    await logError(e, "admin ai-logs summary");
  }

  return NextResponse.json({ success: true, data: rows || [], total: count || 0, summary });
}
