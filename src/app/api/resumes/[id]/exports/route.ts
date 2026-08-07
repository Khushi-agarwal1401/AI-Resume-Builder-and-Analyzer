import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    // Verify ownership
    const { data: resume, error: resumeError } = await supabase
      .from("resumes")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (resumeError || !resume) {
      return NextResponse.json({ success: false, error: "Resume not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("exports")
      .select("*")
      .eq("resume_id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (e: unknown) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}