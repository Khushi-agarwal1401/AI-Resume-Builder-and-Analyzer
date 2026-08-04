/**
 * Shared admin-email list.
 *
 * This module is deliberately free of server-only imports so it can be used
 * from both client components (login/signup redirect logic) and server code
 * (lib/admin.ts, route handlers).
 *
 * NOTE: keep the email addresses in sync with the `ADMIN_EMAILS` env var if
 * you also maintain that list — the server treats a user as an admin if their
 * email appears in EITHER source (env var or this list) or their profile row
 * has role = 'admin'.
 *
 * Client-side auto-redirects (login/signup) only consult this hardcoded list,
 * so a user promoted via the admin Users page (profile role = 'admin') whose
 * email is not listed here will still be authorized server-side but won't be
 * auto-redirected to /admin after login.
 */
export const DEFAULT_ADMIN_EMAILS = [
  "radheshyambhatiig@gmail.com",
  "khushiagarwalg1@gmail.com",
  "bhalkeankit@gmail.com",
];

const ADMIN_EMAIL_SET = new Set(DEFAULT_ADMIN_EMAILS.map((e) => e.trim().toLowerCase()));

/** Case-insensitive check that an email is on the hardcoded admin list. */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAIL_SET.has(email.trim().toLowerCase());
}
