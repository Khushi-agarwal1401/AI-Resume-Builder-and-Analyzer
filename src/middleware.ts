import { withAuth } from "next-auth/middleware";
import type { NextRequest } from "next/server";
import { needsAuthUrlWarning } from "@/lib/redirect-url";

// ─── Routes accessible without authentication ────────────────────────────
const publicPaths = [
  "/",
  "/pricing",
  "/login",
  "/sign-up",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/share",          // public share links (unguessable token) — no auth required
  "/api/auth",        // NextAuth API routes
  "/_next/static",
  "/_next/image",
  "/favicon",
  "/images",
];

// ─── Self-authenticating routes ───────────────────────────────────────────
// These endpoints authenticate with their own secrets/signatures and must
// never be bounced to the login page by this middleware (they are called by
// third-party servers or cron schedulers that have no session cookie). Each
// handler performs its own verification:
//   - /api/stripe/webhook → Stripe signature (STRIPE_WEBHOOK_SECRET)
//   - /api/cron/*         → Authorization: Bearer <CRON_SECRET>
//   - /api/health         → public uptime probe
// ⚠️ Keep this list in sync with the matcher exclusion at the bottom of this
// file — Next.js requires the matcher to be a static literal, so it cannot be
// derived from this array.
const selfAuthPaths = ["/api/stripe/webhook", "/api/cron", "/api/health"];

/**
 * Warns (once per function invocation) when the production deployment's
 * NEXTAUTH_URL points at a different origin than the domain actually serving
 * the request. A stale NEXTAUTH_URL silently breaks OAuth sign-in, Stripe
 * redirect URLs and transactional email links, so surface it loudly.
 * Preview/branch deployments are skipped — they legitimately differ.
 */
function warnOnAuthUrlMismatch(req: NextRequest): void {
  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (
    !needsAuthUrlWarning(
      req.nextUrl.hostname,
      productionUrl,
      process.env.NEXTAUTH_URL
    )
  ) {
    return;
  }
  let configuredHost = "(unparseable)";
  try {
    configuredHost = new URL(process.env.NEXTAUTH_URL as string).hostname;
  } catch {
    // Malformed NEXTAUTH_URL — needsAuthUrlWarning already matched, so the
    // env is broken regardless; keep the warning using a placeholder.
  }
  console.warn(
    `[auth] NEXTAUTH_URL host "${configuredHost}" does not match the production domain "${productionUrl}". ` +
      `OAuth sign-in, Stripe redirect URLs and email links will point at the wrong origin. ` +
      `Set NEXTAUTH_URL=https://${productionUrl} (or your custom domain) in the deployment environment.`
  );
}

export default withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ req, token }) {
      const { pathname } = req.nextUrl;

      // Always allow static files and API auth routes
      if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/favicon") ||
        pathname.startsWith("/images")
      ) {
        return true;
      }

      // Self-authenticating routes (webhooks, cron, health) — the handlers
      // verify their own secrets/signatures. Defense in depth: also enforced
      // by the matcher below, which skips this middleware entirely.
      if (selfAuthPaths.some((p) => pathname.startsWith(p))) {
        return true;
      }

      // Warn when NEXTAUTH_URL is stale on the production domain
      warnOnAuthUrlMismatch(req);

      // Allow public pages
      if (publicPaths.some((p) => pathname === p)) {
        return true;
      }

      // Allow public path prefixes (e.g., /pricing/anything)
      if (publicPaths.some((p) => p !== "/" && pathname.startsWith(p))) {
        return true;
      }

      // Allow NextAuth API routes
      if (pathname.startsWith("/api/auth")) {
        return true;
      }

      // All other routes require authentication
      return !!token;
    },
  },
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (public images)
     * - api/auth (NextAuth API)
     * - api/stripe/webhook, api/cron, api/health (self-authenticating routes —
     *   each handler validates its own secret/signature; the session-based
     *   middleware must not redirect them to /login)
     */
    "/((?!_next/static|_next/image|favicon|images|api/auth|api/stripe/webhook|api/cron|api/health).*)",
  ],
};
