import { createServerClient } from "@/lib/db/server";
import type { DbClient } from "@/lib/db/query-builder";
import type { Database } from "@/lib/db/types";
import { decrypt } from "@/lib/encryption";
import { createNotification } from "@/services/notifications/service";
import { sendChannelEmail } from "@/services/notifications/email";

/**
 * A-10: Poll GitHub for a single user's repos, creating resume_updates rows
 * for new repos and refreshing stars/forks on already-tracked ones.
 * Shared by the manual poll route (/api/github/poll) and the scheduled cron
 * (/api/cron/github-poll).
 *
 * The cron passes its admin client because it runs with no user session;
 * ownership is still enforced explicitly via user_id.
 */
export async function syncGitHubForUser(
  userId: string,
  dbClient?: DbClient<Database>
): Promise<{ newFound: number }> {
  const db = dbClient ?? (await createServerClient());

  // 1. Fetch the user's profile to get the encrypted token
  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("github_token, github_connected")
    .eq("id", userId)
    .single();

  if (profileError || !profile?.github_connected || !profile?.github_token) {
    return { newFound: 0 };
  }

  // 2. Decrypt the token
  let accessToken: string;
  try {
    accessToken = decrypt(profile.github_token);
  } catch {
    return { newFound: 0 };
  }

  // 3. Fetch repos from GitHub
  const reposRes = await fetch("https://api.github.com/user/repos?sort=updated&per_page=50", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!reposRes.ok) {
    return { newFound: 0 };
  }

  const repos = (await reposRes.json()) as Record<string, unknown>[];
  if (!Array.isArray(repos)) {
    return { newFound: 0 };
  }

  // 4. Get existing repos already tracked in resume_updates for this user
  const { data: existingUpdates } = await db
    .from("resume_updates")
    .select("id, repo_name, repo_description, repo_language")
    .eq("user_id", userId);

  const existingRepoNames = new Set((existingUpdates || []).map((u) => u.repo_name));

  // 4b. Refresh stars/forks on already-tracked repos so cards stay current
  const repoByName = new Map<string, Record<string, unknown>>();
  for (const repo of repos) {
    if (typeof repo.name === "string") repoByName.set(repo.name, repo);
  }
  const refreshRows = (existingUpdates || []).filter((u) => repoByName.has(u.repo_name));
  for (const row of refreshRows) {
    const repo = repoByName.get(row.repo_name)!;
    await db
      .from("resume_updates")
      .update({
        repo_stars: typeof repo.stargazers_count === "number" ? repo.stargazers_count : 0,
        repo_forks: typeof repo.forks_count === "number" ? repo.forks_count : 0,
        repo_description: (repo.description as string) || row.repo_description || "",
        repo_language: (repo.language as string) || row.repo_language || "",
      })
      .eq("id", row.id)
      .eq("user_id", userId);
  }

  // 5. Filter to new repos only (not already tracked)
  const newRepos = repos.filter(
    (r: Record<string, unknown>) => !existingRepoNames.has(r.name as string)
  );

  // 6. Create notification records for new repos
  const newUpdates: { user_id: string; repo_name: string; repo_description: string; repo_url: string; repo_language: string; repo_stars: number; repo_forks: number }[] = [];

  for (const repo of newRepos) {
    newUpdates.push({
      user_id: userId,
      repo_name: (repo.name as string) || "unknown",
      repo_description: (repo.description as string) || "",
      repo_url: (repo.html_url as string) || "",
      repo_language: (repo.language as string) || "",
      repo_stars: typeof repo.stargazers_count === "number" ? repo.stargazers_count : 0,
      repo_forks: typeof repo.forks_count === "number" ? repo.forks_count : 0,
    });
  }

  if (newUpdates.length > 0) {
    const { error: insertError } = await db.from("resume_updates").insert(newUpdates);
    if (insertError) throw new Error(insertError.message);
  }

  // Notification Center: GitHub sync completed (best-effort; only when something new was found).
  // Note: under the cron path (admin client injected, no session) createNotification
  // silently no-ops — the session client it builds has no RLS context. Harmless.
  if (newUpdates.length > 0) {
    await createNotification(userId, {
      type: "github",
      title: "GitHub sync complete",
      message: `Found ${newUpdates.length} new repo${newUpdates.length === 1 ? "" : "s"} to review.`,
      link: "/updates",
    });

    // A-11: email the user when resume-update notifications are enabled
    await sendChannelEmail(userId, "resume_updates", {
      subject: `New GitHub repos detected on your resume`,
      body: `We found ${newUpdates.length} new repo${newUpdates.length === 1 ? "" : "s"} you might want to feature:\n\n${newUpdates
        .map((r) => `• ${r.repo_name}${r.repo_description ? ` — ${r.repo_description}` : ""}`)
        .join("\n")}\n\nReview and add them: ${process.env.NEXTAUTH_URL}/updates`,
    });
  }

  return { newFound: newUpdates.length };
}
