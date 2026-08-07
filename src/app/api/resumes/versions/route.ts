import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET  /api/resumes/versions?resumeId=...  → list versions for a resume
 * POST /api/resumes/versions               → create a new version snapshot
 * DELETE /api/resumes/versions?id=...      → delete a version
 */

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const resumeId = request.nextUrl.searchParams.get("resumeId");
  if (!resumeId) {
    return NextResponse.json({ success: false, error: "resumeId query param required" }, { status: 400 });
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("resume_versions")
      .select("id, label, created_at, resume_id")
      .eq("resume_id", resumeId)
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, data: data || [] });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to load versions." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const resumeId = typeof body?.resumeId === "string" ? body.resumeId.trim() : "";
  const label = typeof body?.label === "string" ? body.label.trim().slice(0, 100) : "Untitled version";
  const snapshot = body?.snapshot;

  if (!resumeId || !snapshot) {
    return NextResponse.json({ success: false, error: "resumeId and snapshot are required." }, { status: 400 });
  }

  try {
    const supabase = await createServerSupabaseClient();
    // Verify ownership
    const { data: resume, error: fetchErr } = await supabase
      .from("resumes")
      .select("id")
      .eq("id", resumeId)
      .eq("user_id", session.user.id)
      .single();
    if (fetchErr || !resume) {
      return NextResponse.json({ success: false, error: "Resume not found." }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("resume_versions")
      .insert({ resume_id: resumeId, user_id: session.user.id, label, snapshot })
      .select("id, label, created_at")
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to save version." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ success: false, error: "id query param required" }, { status: 400 });
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from("resume_versions")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete version." }, { status: 500 });
  }
}