import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import { DEFAULT_ADMIN_EMAILS } from "@/lib/admin-emails";

// Env var + hardcoded default list (see admin-emails.ts). A user is an admin
// if their email appears in either list OR their profile has role = 'admin'.
const ADMIN_EMAILS_ENV = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);
const ADMIN_EMAILS = [...new Set([...ADMIN_EMAILS_ENV, ...DEFAULT_ADMIN_EMAILS.map((e) => e.toLowerCase())])];

/**
 * Check whether a user is an admin.
 * Three sources are consulted:
 * 1. The `ADMIN_EMAILS` environment variable (comma-separated).
 * 2. The hardcoded `DEFAULT_ADMIN_EMAILS` list.
 * 3. The `profiles.role` database column (value = `"admin"`).
 *
 * Returns `true` if the user is listed in any source.
 */
export async function isAdmin(userId: string, email: string): Promise<boolean> {
  // 1. Check env-var + default lists
  if (ADMIN_EMAILS.includes(email.toLowerCase())) {
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

/**
 * Record an admin mutation in the audit log (R-14).
 * Fire-and-forget: never fails the calling operation.
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  changes?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.from("admin_audit_log").insert({
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: targetId,
      changes: (changes || {}) as unknown as Json,
    });
  } catch {
    // Audit failures must never break the admin operation itself.
  }
}
