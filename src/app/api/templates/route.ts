import { NextRequest, NextResponse } from "next/server";
import { getActiveTemplates } from "@/services/templates/service";
import { ok, publicCacheHeaders, applyCors, corsPreflight } from "@/lib/api";

/** GET /api/templates — public catalog of active templates (CDN-cacheable) */
export async function GET(request: NextRequest) {
  try {
    const data = await getActiveTemplates();
    const res = ok(data, 200);
    for (const [k, v] of Object.entries(publicCacheHeaders(300, 300))) {
      res.headers.set(k, v);
    }
    return applyCors(res, request);
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

/** CORS preflight for the public catalog. */
export async function OPTIONS(request: NextRequest) {
  return corsPreflight(request) ?? new NextResponse(null, { status: 403 });
}
