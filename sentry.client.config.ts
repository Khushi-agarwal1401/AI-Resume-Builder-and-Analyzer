// This file configures the initialization of Sentry on the client side.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production.
  tracesSampleRate: 0.1,

  // Capture unhandled rejections and exceptions
  integrations: [
    Sentry.replayIntegration({
      // Session replay is off by default; enable with a sample rate if desired
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Replays sampling
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Disable Sentry in development
  enabled: process.env.NODE_ENV === "production" && !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
