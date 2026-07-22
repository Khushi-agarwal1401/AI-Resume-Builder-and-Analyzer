import { createServerSupabaseClient } from "@/lib/supabase/server";

const ADMIN_EMAILS_ENV = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/**
 * Check whether a user is an admin.
 * Two sources are consulted:
 * 1. The `ADMIN_EMAILS` environment variable (comma-separated).
 * 2. The `profiles.role` database column (value = `"admin"`).
 *
 * Returns `true` if the user is listed in either source.
 */
export async function isAdmin(userId: string, email: string): Promise<boolean> {
  // 1. Check env-var list
  if (ADMIN_EMAILS_ENV.includes(email.toLowerCase())) {
    return true;
  }

  // 2. Check DB role
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    return data?.role === "admin";
  } catch {
    return false;
  }
}
