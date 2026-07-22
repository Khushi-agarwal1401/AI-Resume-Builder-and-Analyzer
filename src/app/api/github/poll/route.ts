import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/encryption";

export const dynamic = "force-dynamic";

/** GET /api/github/poll — check connected GitHub account for new repos and create update records */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createServerSupabaseClient();

    // 1. Fetch the user's profile to get the encrypted token
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("github_token, github_connected")
      .eq("id", session.user.id)
      .single();

    if (profileError || !profile?.github_connected || !profile?.github_token) {
      return NextResponse.json(
        { success: false, error: "GitHub not connected. Connect your GitHub account first." },
        { status: 400 }
      );
    }

    // 2. Decrypt the token
    let accessToken: string;
    try {
      accessToken = decrypt(profile.github_token);
    } catch {
      return NextResponse.json(
        { success: false, error: "Failed to decrypt GitHub token. Reconnect your account." },
        { status: 400 }
      );
    }

    // 3. Fetch repos from GitHub
    const reposRes = await fetch("https://api.github.com/user/repos?sort=updated&per_page=50", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!reposRes.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch GitHub repos. Token may be expired." },
        { status: 400 }
      );
    }

    const repos = await reposRes.json();
    if (!Array.isArray(repos)) {
      return NextResponse.json({ success: false, error: "Unexpected GitHub API response" }, { status: 500 });
    }

    // 4. Get existing repos already tracked in resume_updates for this user
    const { data: existingUpdates } = await supabase
      .from("resume_updates")
      .select("repo_name")
      .eq("user_id", session.user.id);

    const existingRepoNames = new Set((existingUpdates || []).map((u) => u.repo_name));

    // 5. Filter to new repos only (not already tracked)
    const newRepos = repos.filter(
      (r: Record<string, unknown>) => !existingRepoNames.has(r.name as string)
    );

    // 6. Create notification records for new repos
    const newUpdates: { user_id: string; repo_name: string; repo_description: string; repo_url: string; repo_language: string }[] = [];

    for (const repo of newRepos) {
      newUpdates.push({
        user_id: session.user.id,
        repo_name: (repo.name as string) || "unknown",
        repo_description: (repo.description as string) || "",
        repo_url: (repo.html_url as string) || "",
        repo_language: (repo.language as string) || "",
      });
    }

    if (newUpdates.length > 0) {
      const { error: insertError } = await supabase.from("resume_updates").insert(newUpdates);
      if (insertError) {
        return NextResponse.json(
          { success: false, error: insertError.message },
          { status: 500 }
        );
      }
    }

    // 7. Return all pending updates for this user
    const { data: allUpdates } = await supabase
      .from("resume_updates")
      .select("*")
      .eq("user_id", session.user.id)
      .order("detected_at", { ascending: false })
      .limit(50);

    return NextResponse.json({
      success: true,
      data: allUpdates || [],
      newFound: newUpdates.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "GitHub poll failed" },
      { status: 500 }
    );
  }
}
