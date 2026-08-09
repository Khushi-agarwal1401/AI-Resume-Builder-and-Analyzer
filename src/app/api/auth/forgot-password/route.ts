import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/server";
import { forgotPasswordSchema, validateOrError } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { logError } from "@/lib/api";
import { generateResetToken } from "@/lib/password";

export const dynamic = "force-dynamic";

/**
 * Request a password-reset email.
 *
 * Creates a one-time reset token (valid for 1 hour) and emails a link to
 * `/reset-password?token=…`. Always returns success — even for unknown
 * emails — so the endpoint can't be used to enumerate registered addresses.
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

  const origin = new URL(request.url).origin;

  try {
    const db = await createServerClient();
    const { data: profile } = await db
      .from("profiles")
      .select("id, email, full_name")
      .eq("email", validated.data.email)
      .maybeSingle();

    if (profile) {
      const token = generateResetToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      await db
        .from("profiles")
        .update({
          password_reset_token: token,
          password_reset_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      await sendResetEmail({
        to: profile.email || validated.data.email,
        name: profile.full_name || validated.data.email,
        resetUrl: `${origin}/reset-password?token=${token}`,
      });
    }
  } catch (error) {
    // Log for ops, but still return success to the client.
    await logError(error, "forgot-password");
  }

  return NextResponse.json({ success: true });
}

async function sendResetEmail(input: { to: string; name: string; resetUrl: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "AI Resume Builder <onboarding@resend.dev>";
  if (!apiKey) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: "Reset your password — AI Resume Builder",
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
        <h2 style="color:#1f2937;margin:0 0 12px;">Reset your password</h2>
        <p style="color:#4b5563;line-height:1.6;">Hi ${input.name.replace(/</g, "&lt;")},</p>
        <p style="color:#4b5563;line-height:1.6;">We received a request to reset your password. Click the button below to choose a new one. This link expires in 1 hour.</p>
        <a href="${input.resetUrl}" style="display:inline-block;padding:12px 24px;margin:16px 0;background:#4f46e5;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">Reset password</a>
        <p style="color:#9ca3af;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
      </div>`,
    }),
  });
}
