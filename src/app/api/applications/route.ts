import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** GET /api/applications — list user's applications, optional status filter */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");

  try {
    const supabase = await createServerSupabaseClient();
    let query = supabase
      .from("applications")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (statusFilter && ["applied", "interview", "rejected", "offer"].includes(statusFilter)) {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

/** POST /api/applications — create a new application */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { company, role, status, notes, resume_id, date_applied } = body;

    if (!company || !role) {
      return NextResponse.json(
        { success: false, error: "Company and role are required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("applications")
      .insert({
        user_id: session.user.id,
        company,
        role,
        status: status || "applied",
        notes: notes || "",
        resume_id: resume_id || null,
        date_applied: date_applied || new Date().toISOString().split("T")[0],
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create application" },
      { status: 500 }
    );
  }
}
