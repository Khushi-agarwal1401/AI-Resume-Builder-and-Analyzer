/**
 * Resolves the app's base URL for redirects that must land back inside the
 * app (Stripe checkout success/cancel, billing portal return).
 *
 * Priority:
 *   1. The origin the user actually reached (`request.nextUrl.origin`) — this
 *      is always correct even when NEXTAUTH_URL is stale or the domain has
 *      changed, because the browser is already on that origin.
 *   2. NEXTAUTH_URL (only used when no request context exists, e.g. legacy
 *      call sites building absolute links).
 */
export function resolveAppUrl(request?: { nextUrl?: { origin?: string } }): string {
  const fromRequest = request?.nextUrl?.origin;
  if (fromRequest) return fromRequest;
  const configured = process.env.NEXTAUTH_URL;
  return configured ? configured.replace(/\/+$/, "") : "";
}

/** Builds an absolute redirect path on the app origin (or NEXTAUTH_URL fallback). */
export function appRedirectUrl(path: string, request?: { nextUrl?: { origin?: string } }): string {
  return `${resolveAppUrl(request)}${path}`;
}

/**
 * Returns true when the production deployment is being served but NEXTAUTH_URL
 * points at a different origin — the config error that silently breaks OAuth
 * sign-in, Stripe redirect URLs and transactional email links. Preview/branch
 * deployments return false (they legitimately differ).
 */
export function needsAuthUrlWarning(
  hostname: string,
  productionUrl?: string,
  configured?: string
): boolean {
  if (!configured || !productionUrl) return false;
  if (hostname !== productionUrl) return false;
  try {
    return new URL(configured).hostname !== productionUrl;
  } catch {
    // Malformed NEXTAUTH_URL — broken env regardless; don't throw here.
    return false;
  }
}
