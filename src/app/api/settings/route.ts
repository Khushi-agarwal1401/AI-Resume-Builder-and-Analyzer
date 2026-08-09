import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerClient } from "@/lib/db/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const db = await createServerClient();

  const { data: settings } = await db
    .from("settings")
    .select("*")
    .eq("user_id", session.user.id)
    .maybeSingle();

  const { data: profile } = await db
    .from("profiles")
    .select("github_connected, linkedin_connected")
    .eq("id", session.user.id)
    .maybeSingle();

  return NextResponse.json({
    success: true,
    data: {
      ...(settings || { email_notifications: true, resume_updates: true, job_alerts: true }),
      github_connected: profile?.github_connected || false,
      linkedin_connected: profile?.linkedin_connected || false,
    },
  });
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { email_notifications, resume_updates, job_alerts } = body;

    const db = await createServerClient();
    const { error } = await db.from("settings").upsert(
      {
        user_id: session.user.id,
        email_notifications: email_notifications ?? true,
        resume_updates: resume_updates ?? true,
        job_alerts: job_alerts ?? true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
