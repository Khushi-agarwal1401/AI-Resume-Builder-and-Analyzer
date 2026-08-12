import { createServerClient } from "@/lib/db/server";

/**
 * Email delivery for notification preferences (A-11).
 *
 * Uses Resend's HTTP API. Requires RESEND_API_KEY and RESEND_FROM_EMAIL.
 * When unconfigured, emails are skipped silently — in-app notifications
 * still work as before.
 */

interface EmailInput {
  subject: string;
  body: string;
}

/** Read the user's notification toggles (defaults: all on). */
async function getSettings(userId: string): Promise<{
  email_notifications: boolean;
  resume_updates: boolean;
  job_alerts: boolean;
  email: string | null;
}> {
  const db = await createServerClient();
  const [settingsRes, profileRes] = await Promise.all([
    db.from("settings").select("email_notifications, resume_updates, job_alerts").eq("user_id", userId).maybeSingle(),
    db.from("profiles").select("email").eq("id", userId).maybeSingle(),
  ]);

  const settings = (settingsRes.data as { email_notifications?: boolean; resume_updates?: boolean; job_alerts?: boolean }) || {};
  return {
    email_notifications: settings.email_notifications !== false,
    resume_updates: settings.resume_updates !== false,
    job_alerts: settings.job_alerts !== false,
    email: (profileRes.data as { email?: string } | null)?.email || null,
  };
}

/**
 * Send an email for a notification channel ("resume_updates" | "job_alerts").
 * Honors the master toggle and the per-channel toggle. Never throws.
 */
export async function sendChannelEmail(
  userId: string,
  channel: "resume_updates" | "job_alerts",
  input: EmailInput
): Promise<{ sent: boolean; skipped: boolean }> {
  try {
    const settings = await getSettings(userId);
    if (!settings.email_notifications || !settings[channel]) {
      return { sent: false, skipped: true };
    }
    if (!settings.email) {
      return { sent: false, skipped: true };
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL || "ResumeCareer <onboarding@resend.dev>";
    if (!apiKey) {
      return { sent: false, skipped: true };
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: settings.email,
        subject: input.subject,
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
          <h2 style="color:#1f2937;margin:0 0 12px;">${input.subject}</h2>
          <p style="color:#4b5563;line-height:1.6;white-space:pre-wrap;">${input.body
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")}</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
          <p style="color:#9ca3af;font-size:12px;">You're receiving this because you enabled notifications in your ResumeCareer settings. Manage them anytime in Settings.</p>
        </div>`,
      }),
    });

    if (!res.ok) {
      console.error("Failed to send notification email:", res.status, await res.text().catch(() => ""));
      return { sent: false, skipped: false };
    }
    return { sent: true, skipped: false };
  } catch (err) {
    console.error("Failed to send notification email:", err);
    return { sent: false, skipped: false };
  }
}
