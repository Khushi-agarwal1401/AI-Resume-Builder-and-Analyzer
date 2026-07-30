import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();

  const { data: settings } = await supabase
    .from("settings")
    .select("*")
    .eq("user_id", session.user.id)
    .maybeSingle();

  return NextResponse.json({
    success: true,
    data: settings || { email_notifications: true, resume_updates: true, job_alerts: true },
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

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("settings").upsert(
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
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update settings" },
      { status: 500 }
    );
  }
}
