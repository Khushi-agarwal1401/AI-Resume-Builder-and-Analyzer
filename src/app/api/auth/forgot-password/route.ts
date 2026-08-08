import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { forgotPasswordSchema, validateOrError } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { logError } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Request a password-reset email.
 *
 * Uses Supabase Auth's recovery flow (the same provider that powers the
 * credentials login), which sends an email with a one-time recovery link to
 * `/reset-password`. Always returns success — even for unknown emails — so
 * the endpoint can't be used to enumerate registered addresses.
 */
export async function POST(request: Request) {
  // Rate limit: 3 requests per 10 minutes per IP (blocks email flooding).
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const allowed = await checkRateLimit(`forgot-password:${ip}`, 3, 10 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const validated = validateOrError(forgotPasswordSchema, body);
  if ("error" in validated) return validated.error;

  // Build the recovery redirect from the request origin so the emailed link
  // points at this deployment (localhost in dev, prod URL in production).
  const origin = new URL(request.url).origin;

  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.resetPasswordForEmail(validated.data.email, {
      redirectTo: `${origin}/reset-password`,
    });
  } catch (error) {
    // Log for ops, but still return success to the client.
    await logError(error, "forgot-password");
  }

  return NextResponse.json({ success: true });
}
