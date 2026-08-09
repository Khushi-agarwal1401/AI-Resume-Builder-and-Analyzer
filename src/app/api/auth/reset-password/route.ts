import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/server";
import { resetPasswordSchema, validateOrError } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { hashPassword } from "@/lib/password";
import { logError } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Verify a reset token is valid (not expired). */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) {
    return NextResponse.json({ success: true, valid: false });
  }

  try {
    const db = await createServerClient();
    const { data: profile } = await db
      .from("profiles")
      .select("password_reset_token, password_reset_expires_at")
      .eq("password_reset_token", token)
      .maybeSingle();

    const valid =
      !!profile?.password_reset_token &&
      !!profile.password_reset_expires_at &&
      new Date(profile.password_reset_expires_at).getTime() > Date.now();

    return NextResponse.json({ success: true, valid });
  } catch (error) {
    await logError(error, "reset-password verify");
    return NextResponse.json({ success: true, valid: false });
  }
}

/** Reset the password using a valid token. */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const allowed = await checkRateLimit(`reset-password:${ip}`, 5, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const validated = validateOrError(resetPasswordSchema, { ...body });
  if ("error" in validated) return validated.error;

  const { token, password } = body as { token: string; password: string };
  if (!token) {
    return NextResponse.json({ success: false, error: "Invalid or expired reset link." }, { status: 400 });
  }

  try {
    const db = await createServerClient();
    const { data: profile } = await db
      .from("profiles")
      .select("id, password_reset_token, password_reset_expires_at")
      .eq("password_reset_token", token)
      .maybeSingle();

    if (
      !profile?.password_reset_token ||
      !profile.password_reset_expires_at ||
      new Date(profile.password_reset_expires_at).getTime() <= Date.now()
    ) {
      return NextResponse.json({ success: false, error: "Invalid or expired reset link." }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    await db
      .from("profiles")
      .update({
        password_hash: passwordHash,
        password_reset_token: null,
        password_reset_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    await logError(error, "reset-password");
    return NextResponse.json({ success: false, error: "Unable to reset your password. Please try again." }, { status: 500 });
  }
}
