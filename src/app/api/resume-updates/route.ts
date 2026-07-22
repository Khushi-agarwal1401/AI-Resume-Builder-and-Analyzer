import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** GET /api/resume-updates — list all resume updates for the user */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("resume_updates")
      .select("*")
      .eq("user_id", session.user.id)
      .order("detected_at", { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch updates" },
      { status: 500 }
    );
  }
}

/** PATCH /api/resume-updates — update update status (add/ignore) */
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { updateId, status } = await request.json();

    if (!updateId || !["added", "ignored"].includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid updateId or status" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from("resume_updates")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", updateId)
      .eq("user_id", session.user.id);

    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update" },
      { status: 500 }
    );
  }
}
