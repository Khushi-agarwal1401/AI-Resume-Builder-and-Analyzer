import { createServerClient } from "@/lib/db/server";
import type { Json } from "@/lib/db/types";

// Env var only. A user is an admin if their email appears in ADMIN_EMAILS
// OR their profile has role = 'admin'.
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
  // 1. Check env var
  if (ADMIN_EMAILS_ENV.includes(email.toLowerCase())) {
    return true;
  }

  // 2. Check DB role
  try {
    const db = await createServerClient();
    const { data } = await db
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
    const db = await createServerClient();
    await db.from("admin_audit_log").insert({
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
