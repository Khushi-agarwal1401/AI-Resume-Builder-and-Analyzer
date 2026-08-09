import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerClient } from "@/lib/db/server";
import { getUserPlanLimits, checkPremiumAccess, recordPremiumUse } from "@/lib/subscription";
import { isAdmin } from "@/lib/admin";
import { syncGitHubForUser } from "@/services/github/sync";

export const dynamic = "force-dynamic";

/** GET /api/github/poll — check connected GitHub account for new repos and create update records */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // A-09: GitHub sync is a Pro feature, but free users get PREMIUM_TRIAL_USES
  // free syncs per month before the paywall (admins exempt).
  const adminUser = await isAdmin(session.user.id, session.user.email || "");
  let burnsSyncTrial = false;
  if (!adminUser) {
    const limits = await getUserPlanLimits(session.user.id);
    const trial = await checkPremiumAccess(
      session.user.id,
      "github_syncs",
      limits.hasGitHubSync,
      adminUser
    );
    if (!trial) {
      return NextResponse.json(
        {
          success: false,
          error: "GitHub sync is a Pro feature. Upgrade to Pro to import your repositories.",
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }
    burnsSyncTrial = !limits.hasGitHubSync;
  }

  try {
    const db = await createServerClient();

    // Verify GitHub is connected before calling the shared sync
    const { data: profile } = await db
      .from("profiles")
      .select("github_token, github_connected")
      .eq("id", session.user.id)
      .single();

    if (!profile?.github_connected || !profile?.github_token) {
      return NextResponse.json(
        { success: false, error: "GitHub not connected. Connect your GitHub account first." },
        { status: 400 }
      );
    }

    const { newFound } = await syncGitHubForUser(session.user.id);

    // Burn one free GitHub sync use on a successful sync (free users only).
    if (burnsSyncTrial) {
      await recordPremiumUse(session.user.id, "github_syncs", false, false);
    }

    // Return all pending updates for this user
    const { data: allUpdates } = await db
      .from("resume_updates")
      .select("*")
      .eq("user_id", session.user.id)
      .order("detected_at", { ascending: false })
      .limit(50);

    return NextResponse.json({
      success: true,
      data: allUpdates || [],
      newFound,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
