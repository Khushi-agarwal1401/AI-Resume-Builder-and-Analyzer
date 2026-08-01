/**
 * Startup environment variable validator.
 * This module runs at import time. If a critical environment variable
 * is missing, it throws a clear error — refusing to start the app.
 *
 * Import this module early in the app lifecycle (e.g., in middleware.ts
 * or a top-level layout) to ensure validation runs before any request is served.
 */

interface EnvVar {
  name: string;
  description: string;
  critical: boolean;
}

const CRITICAL_VARS: EnvVar[] = [
  { name: "NEXT_PUBLIC_SUPABASE_URL", description: "Supabase project URL", critical: true },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", description: "Supabase anonymous API key", critical: true },
  { name: "SUPABASE_SERVICE_ROLE_KEY", description: "Supabase service role key (server-side admin auth)", critical: true },
  { name: "NEXTAUTH_SECRET", description: "NextAuth.js JWT signing secret", critical: true },
  { name: "NEXTAUTH_URL", description: "Application base URL", critical: true },
  { name: "GEMINI_API_KEY", description: "Google Gemini AI API key", critical: false },
  { name: "ENCRYPTION_KEY", description: "Application-layer encryption key (32-byte hex)", critical: true },
  { name: "STRIPE_SECRET_KEY", description: "Stripe secret key for payments", critical: false },
  { name: "STRIPE_WEBHOOK_SECRET", description: "Stripe webhook signing secret", critical: false },
  { name: "ADMIN_EMAILS", description: "Comma-separated admin emails for the admin panel", critical: true },
];

const WARNING_VARS: EnvVar[] = [
  { name: "GOOGLE_CLIENT_ID", description: "Google OAuth client ID (needed for Google sign-in)", critical: false },
  { name: "GOOGLE_CLIENT_SECRET", description: "Google OAuth client secret", critical: false },
  { name: "GITHUB_CLIENT_ID", description: "GitHub OAuth client ID (needed for GitHub sign-in)", critical: false },
  { name: "GITHUB_CLIENT_SECRET", description: "GitHub OAuth client secret", critical: false },
  { name: "LINKEDIN_CLIENT_ID", description: "LinkedIn OAuth client ID", critical: false },
  { name: "LINKEDIN_CLIENT_SECRET", description: "LinkedIn OAuth client secret", critical: false },
  { name: "NEXT_PUBLIC_STRIPE_PRO_PRICE_ID_MONTHLY", description: "Stripe Pro monthly price ID (public)", critical: false },
  { name: "NEXT_PUBLIC_STRIPE_PRO_PRICE_ID_YEARLY", description: "Stripe Pro yearly price ID (public)", critical: false },
  { name: "STRIPE_PRO_PRICE_ID_MONTHLY", description: "Stripe Pro monthly price ID (server)", critical: false },
  { name: "STRIPE_PRO_PRICE_ID_YEARLY", description: "Stripe Pro yearly price ID (server)", critical: false },
  { name: "REDIS_URL", description: "Redis connection string for rate limiting", critical: false },
  { name: "REDIS_HOST", description: "Redis host (fallback when REDIS_URL unset)", critical: false },
  { name: "REDIS_PORT", description: "Redis port (fallback when REDIS_URL unset)", critical: false },
  { name: "SENTRY_ORG", description: "Sentry organization slug (source map upload)", critical: false },
  { name: "SENTRY_PROJECT", description: "Sentry project slug (source map upload)", critical: false },
  { name: "SENTRY_AUTH_TOKEN", description: "Sentry auth token (source map upload)", critical: false },
  { name: "ENCRYPTION_KEY_PREVIOUS", description: "Previous encryption key (only needed during key rotation)", critical: false },
];

/**
 * Validate all required environment variables at startup.
 * Throws immediately if a critical variable is missing.
 * Logs warnings for non-critical but recommended variables.
 */
export function validateEnv(): void {
  if (process.env.SKIP_ENV_VALIDATION === 'true') {
    console.warn('[Env Validator] skipping env validation (SKIP_ENV_VALIDATION=true)');
    return;
  }

  const missingCritical: string[] = [];
  const missingWarnings: string[] = [];

  for (const v of CRITICAL_VARS) {
    if (!process.env[v.name]) {
      if (v.critical) {
        missingCritical.push(`${v.name} — ${v.description}`);
      } else {
        missingWarnings.push(`${v.name} — ${v.description}`);
      }
    }
  }

  for (const v of WARNING_VARS) {
    if (!process.env[v.name]) {
      missingWarnings.push(`${v.name} — ${v.description}`);
    }
  }

  if (missingWarnings.length > 0) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Env Validator] Recommended environment variables not set:\n  " +
        missingWarnings.join("\n  ")
      );
    }
  }

  if (missingCritical.length > 0) {
    // During `next build` (phase-production-build) critical secrets are often
    // unavailable in CI — log instead of throwing so the build can proceed.
    // At runtime the app refuses to start with a clear message.
    if (process.env.NEXT_PHASE === "phase-production-build") {
      console.warn(
        "[Env Validator] ⚠️ CRITICAL ENVIRONMENT VARIABLES MISSING AT BUILD TIME (will fail at runtime):\n  " +
        missingCritical.map((v) => `  • ${v}`).join("\n")
      );
      return;
    }

    const message =
      "[Env Validator] ❌ CRITICAL ENVIRONMENT VARIABLES MISSING\n" +
      "The application cannot start without the following variables:\n\n" +
      missingCritical.map((v) => `  • ${v}`).join("\n") +
      "\n\nCopy .env.example to .env.local and fill in the values.";

    if (typeof window === "undefined") {
      // Server-side: throw immediately — app won't start
      throw new Error(message);
    } else {
      // Client-side: log in development only
      console.error(message);
    }
  }
}
