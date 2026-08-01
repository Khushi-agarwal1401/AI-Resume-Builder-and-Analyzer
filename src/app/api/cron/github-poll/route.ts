import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { syncGitHubForUser } from "@/services/github/sync";
import { getPlanLimits } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * GET /api/cron/github-poll — scheduled (daily) GitHub detection.
 * Runs the A-10 sync for every connected Pro user without manual refresh.
 *
 * Protected by the CRON_SECRET header (configured in vercel.json).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createServerSupabaseClient();

    // All users who connected GitHub
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id")
      .eq("github_connected", true);

    const connectedUserIds = (profiles || []).map((p) => p.id as string);

    // Filter to Pro users (GitHub sync is Pro-only, see A-09)
    const proUserIds: string[] = [];
    if (connectedUserIds.length > 0) {
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("user_id, plan_id")
        .in("user_id", connectedUserIds);

      const proIds = new Set(
        (subs || [])
          .filter((s) => getPlanLimits(s.plan_id || "free").hasGitHubSync)
          .map((s) => s.user_id)
      );
      for (const id of connectedUserIds) {
        if (proIds.has(id)) proUserIds.push(id);
      }
    }

    let synced = 0;
    let newTotal = 0;
    const failures: string[] = [];

    for (const userId of proUserIds) {
      try {
        const { newFound } = await syncGitHubForUser(userId);
        synced += 1;
        newTotal += newFound;
      } catch {
        failures.push(userId);
      }
    }

    return NextResponse.json({
      success: true,
      checked: proUserIds.length,
      synced,
      newRepos: newTotal,
      failures,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
