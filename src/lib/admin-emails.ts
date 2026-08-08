/**
 * Admin email utilities.
 *
 * This module is deliberately free of server-only imports so it can be used
 * from both client components and server code.
 *
 * The `ADMIN_EMAILS` environment variable (comma-separated) is the only
 * source for email-based admin access. Database `profiles.role = 'admin'`
 * is the authoritative source for authorization.
 */

const ADMIN_EMAILS_ENV = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const ADMIN_EMAIL_SET = new Set(ADMIN_EMAILS_ENV);

/** Case-insensitive check that an email is in the ADMIN_EMAILS env var. */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAIL_SET.has(email.trim().toLowerCase());
}
