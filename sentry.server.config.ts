// This file configures the initialization of Sentry on the server side.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  tracesSampleRate: 0.1,

  // Disable Sentry in development
  enabled: process.env.NODE_ENV === "production" && !!(process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN),
});
