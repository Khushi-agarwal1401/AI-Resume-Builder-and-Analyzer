import { createServerSupabaseClient } from "@/lib/supabase/server";

type UpdateStatus = "pending" | "added" | "ignored";

export async function getResumeUpdates(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("resume_updates")
    .select("*")
    .eq("user_id", userId)
    .order("detected_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return data || [];
}

export async function updateResumeUpdateStatus(id: string, userId: string, status: UpdateStatus) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("resume_updates")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

export async function getExistingRepoNames(userId: string): Promise<Set<string>> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("resume_updates")
    .select("repo_name")
    .eq("user_id", userId);

  return new Set((data || []).map((u) => u.repo_name));
}

export async function createBatchUpdates(
  userId: string,
  repos: { repo_name: string; repo_description?: string; repo_url?: string; repo_language?: string }[]
) {
  const supabase = await createServerSupabaseClient();
  if (repos.length === 0) return;

  const { error } = await supabase.from("resume_updates").insert(
    repos.map((r) => ({
      user_id: userId,
      source: "github" as const,
      repo_name: r.repo_name,
      repo_description: r.repo_description || "",
      repo_url: r.repo_url || "",
      repo_language: r.repo_language || "",
    }))
  );

  if (error) throw new Error(error.message);
}
