import { createServerSupabaseClient } from "@/lib/supabase/server";

type ApplicationStatus = "applied" | "interview" | "rejected" | "offer";

interface CreateApplicationInput {
  company: string;
  role: string;
  status?: ApplicationStatus;
  notes?: string;
  resume_id?: string | null;
  date_applied?: string;
}

interface UpdateApplicationInput {
  company?: string;
  role?: string;
  status?: ApplicationStatus;
  notes?: string;
  resume_id?: string | null;
  date_applied?: string;
  outcome_type?: "round_reached" | "offer" | "rejected" | null;
  outcome_notes?: string;
  interview_round?: number | null;
}

export async function getApplications(
  userId: string,
  statusFilter?: string,
  options?: { page?: number; pageSize?: number }
) {
  const supabase = await createServerSupabaseClient();

  // A-16: pagination so large application lists don't hammer the client
  const page = Math.max(1, Math.floor(options?.page || 1));
  const pageSize = Math.min(Math.max(1, Math.floor(options?.pageSize || 50)), 200);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("applications")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (statusFilter && ["applied", "interview", "rejected", "offer"].includes(statusFilter)) {
    query = query.eq("status", statusFilter);
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw new Error(error.message);
  return { data: data || [], total: count || 0 };
}

export async function createApplication(userId: string, input: CreateApplicationInput) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("applications")
    .insert({
      user_id: userId,
      company: input.company,
      role: input.role,
      status: input.status || "applied",
      notes: input.notes || "",
      resume_id: input.resume_id || null,
      date_applied: input.date_applied || new Date().toISOString().split("T")[0],
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateApplication(id: string, userId: string, input: UpdateApplicationInput) {
  const supabase = await createServerSupabaseClient();

  const allowedFields: (keyof UpdateApplicationInput)[] = [
    "company", "role", "status", "notes", "resume_id", "date_applied",
    "outcome_type", "outcome_notes", "interview_round",
  ];
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const field of allowedFields) {
    if (input[field] !== undefined) updates[field] = input[field];
  }

  const { error } = await supabase
    .from("applications")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

export async function deleteApplication(id: string, userId: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}
