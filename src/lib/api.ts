import { NextResponse } from "next/server";

/**
 * Unified API response helpers.
 *
 * Every API route returns the same envelope:
 *   { success: true, data }          → 2xx
 *   { success: false, error }        → 4xx/5xx
 *
 * `handleRouteError` guarantees a 500 response never leaks the raw error
 * message (or stack) to the client, and logs unexpected failures through
 * the global error logger so they reach Sentry.
 */

type ApiErrorStatus = 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 | 502 | 503;

/** 2xx response with a payload. */
export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * CORS headers for API responses.
 *
 * This is a same-origin Next.js app (the browser only talks to its own
 * origin), so CORS is locked down by default: no cross-origin reads unless
 * the request origin is explicitly allowlisted. `applyCors` returns true
 * when the origin is allowed (and sets the headers), false otherwise.
 */
export const ALLOWED_ORIGINS = new Set<string>(
  (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
);

/** Same-origin requests and localhost are always allowed. */
function isAllowedOrigin(origin: string | null | undefined): boolean {
  if (!origin) return true; // non-browser clients (curl, webhooks) have no Origin
  const { hostname } = new URL(origin);
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  return ALLOWED_ORIGINS.has(origin);
}

/**
 * Applies CORS headers to a response. When the request carries an Origin
 * header the exact allowlisted origin is echoed back (never `*`), and
 * credentials are allowed so cookie-based sessions work cross-origin.
 * Requests without an Origin (curl, webhooks, server-to-server) get no CORS
 * headers — same-origin behavior applies.
 */
export function applyCors(res: NextResponse, request?: { headers: Headers }): NextResponse {
  const origin = request?.headers.get("origin");
  if (!origin) return res; // no browser origin → nothing to allow
  if (!isAllowedOrigin(origin)) return res;
  res.headers.set("Access-Control-Allow-Origin", origin);
  res.headers.set("Vary", "Origin");
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Max-Age", "86400");
  return res;
}

/** Standard CORS preflight response (or null when the origin is blocked). */
export function corsPreflight(request: { headers: Headers }): NextResponse | null {
  const origin = request.headers.get("origin");
  if (!isAllowedOrigin(origin)) {
    return new NextResponse(null, { status: 403 });
  }
  const res = new NextResponse(null, { status: 204 });
  return applyCors(res, request);
}

/**
 * Returns Cache-Control headers for safe public GET responses.
 * `sMaxAge` is the CDN/shared cache TTL; `staleWhileRevalidate` allows serving
 * stale content while revalidating in the background. Only use on endpoints
 * that return public (non-user-specific) data.
 */
export function publicCacheHeaders(sMaxAge = 60, staleWhileRevalidate = 60): Record<string, string> {
  return {
    "Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
  };
}

/** Error response with a human-safe message. */
export function fail(message: string, status: ApiErrorStatus = 500): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status });
}

/**
 * Returns the user-facing message for an unexpected error. In production the
 * raw message is never exposed (it may contain SQL, stack traces, or secrets);
 * it is only shown in development for easier debugging.
 */
export function safeErrorMessage(error: unknown): string {
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd && error instanceof Error) return error.message;
  return "An unexpected error occurred. Please try again.";
}

/**
 * Logs an unexpected error through the global logger (Sentry when configured).
 * Never throws — route handlers can call it and continue.
 */
export async function logError(error: unknown, context?: string): Promise<void> {
  console.error(`[api]${context ? ` ${context}` : ""}:`, error);
  try {
    const { captureException } = await import("@sentry/nextjs");
    captureException(error, { tags: { area: "api", context: context || "unknown" } });
  } catch {
    // Sentry not configured at runtime — console logging above is sufficient.
  }
}

/**
 * Wraps an async Next.js route handler with global error handling: unexpected
 * errors are logged (Sentry) and returned as a safe 500 without leaking
 * internals to the client.
 *
 * Usage:
 *   export const GET = withErrorHandling(async (req, ctx) => { ... });
 */
export function withErrorHandling<
  TRequest,
  TParams,
  TResponse extends NextResponse | Response,
>(handler: (request: TRequest, context: TParams) => Promise<TResponse>) {
  return async (request: TRequest, context: TParams): Promise<TResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      const url =
        typeof request === "object" &&
        request !== null &&
        "url" in request
          ? String((request as { url?: unknown }).url)
          : undefined;
      await logError(error, url);
      return fail(safeErrorMessage(error)) as TResponse;
    }
  };
}
