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

/**
 * A-08: Insert the detected repository as a real `projects` row on the chosen
 * resume, then mark the update as `added`. Verifies ownership of both the
 * update and the resume before writing anything.
 */
export async function addUpdateToResume(updateId: string, userId: string, resumeId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: update, error: updateError } = await supabase
    .from("resume_updates")
    .select("*")
    .eq("id", updateId)
    .eq("user_id", userId)
    .single();
  if (updateError || !update) throw new Error("Update not found");

  await insertProjectFromRepo(userId, resumeId, {
    name: update.repo_name,
    description: update.repo_description || "",
    url: update.repo_url || "",
    language: update.repo_language || "",
  });

  await updateResumeUpdateStatus(updateId, userId, "added");

  return { resumeId };
}

/**
 * A-20: Insert an arbitrary repository (from a GitHub search result, a
 * detected open-source contribution, or a resume_update row) as a real
 * `projects` row on the user's resume. Verifies resume ownership first.
 */
export async function insertProjectFromRepo(
  userId: string,
  resumeId: string,
  repo: { name: string; description?: string; url?: string; language?: string }
) {
  const supabase = await createServerSupabaseClient();

  const { data: resume } = await supabase
    .from("resumes")
    .select("id")
    .eq("id", resumeId)
    .eq("user_id", userId)
    .single();
  if (!resume) throw new Error("Resume not found");

  const { error: projectError } = await supabase.from("projects").insert({
    resume_id: resumeId,
    name: repo.name,
    description: repo.description || "",
    technologies: repo.language ? [repo.language] : [],
    live_url: "",
    github_url: repo.url || "",
    sort_order: 0,
  });
  if (projectError) throw new Error(projectError.message);

  return { resumeId };
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
