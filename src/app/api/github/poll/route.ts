import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUserPlanLimits } from "@/lib/subscription";
import { syncGitHubForUser } from "@/services/github/sync";

export const dynamic = "force-dynamic";

/** GET /api/github/poll — check connected GitHub account for new repos and create update records */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // A-09: GitHub sync is a Pro feature — block free users with an upgrade prompt
  const limits = await getUserPlanLimits(session.user.id);
  if (!limits.hasGitHubSync) {
    return NextResponse.json(
      {
        success: false,
        error: "GitHub sync is a Pro feature. Upgrade to Pro to import your repositories.",
        upgradeRequired: true,
      },
      { status: 403 }
    );
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Verify GitHub is connected before calling the shared sync
    const { data: profile } = await supabase
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

    // Return all pending updates for this user
    const { data: allUpdates } = await supabase
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
