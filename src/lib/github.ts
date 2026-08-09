import { createServerClient } from "@/lib/db/server";
import { decrypt } from "@/lib/encryption";

/**
 * Returns the user's decrypted GitHub access token.
 * Throws an Error with a user-facing message when GitHub isn't connected or
 * the stored token cannot be decrypted (e.g. after key rotation without the
 * previous key).
 */
export async function getGitHubAccessToken(userId: string): Promise<string> {
  const db = await createServerClient();
  const { data: profile, error } = await db
    .from("profiles")
    .select("github_token, github_connected")
    .eq("id", userId)
    .single();

  if (error || !profile?.github_connected || !profile?.github_token) {
    throw new Error("GitHub not connected. Connect your GitHub account first.");
  }

  try {
    return decrypt(profile.github_token);
  } catch {
    throw new Error("Failed to decrypt GitHub token. Reconnect your account.");
  }
}

export async function githubFetch<T>(
  userId: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const token = await getGitHubAccessToken(userId);
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    throw new Error(
      res.status === 401 || res.status === 403
        ? "GitHub access may be expired. Reconnect your account."
        : "GitHub API request failed. Please try again."
    );
  }

  return (await res.json()) as T;
}
