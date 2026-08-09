

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // pdf-parse bundles pdfjs-dist, whose fake-worker setup dynamically imports
  // `pdf.worker.mjs`. Bundling it into a server chunk rewrites that import to a
  // `.next/server/chunks/*.worker.mjs` path that is never emitted, breaking PDF
  // uploads with "Setting up fake worker failed". Keep both external so pdfjs
  // resolves its worker from node_modules at runtime. @napi-rs/canvas is a
  // native module and tesseract.js loads its worker/traineddata from disk, so
  // both must stay external (and bundled lang data via @tesseract.js-data/eng).
  serverExternalPackages: [
    "pdf-parse",
    "pdfjs-dist",
    "@napi-rs/canvas",
    "tesseract.js",
    "@tesseract.js-data/eng",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },

  // tesseract.js-core resolves its .wasm OCR engine files dynamically at
  // runtime, so Next's standalone file tracer doesn't pick them up on its own.
  // Explicitly include them for the routes that run local OCR, otherwise OCR
  // silently fails in the standalone production build.
  outputFileTracingIncludes: {
    "/api/resumes/import": ["./node_modules/**/tesseract.js-core/*.wasm"],
    "/api/ats-analyze": ["./node_modules/**/tesseract.js-core/*.wasm"],
  },

  // ── Security Headers ──────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.sentry.io https://apis.google.com https://accounts.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
              "img-src 'self' data: blob: https://*.googleusercontent.com https://avatars.githubusercontent.com https://*.stripe.com https://sentry.io",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://api.github.com https://api.linkedin.com https://api.stripe.com https://generativelanguage.googleapis.com https://*.ingest.sentry.io https://o*.ingest.sentry.io https://accounts.google.com",
              "frame-src 'self' https://*.stripe.com https://accounts.google.com https://hooks.stripe.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // ── Server-side env validation at build time ──────────────────
  // Critical env vars that must be set in production
  env: {},
};

export default nextConfig;
