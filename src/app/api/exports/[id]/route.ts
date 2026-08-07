import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    // Verify ownership via resume
    const { data: exportRecord, error: getError } = await supabase
      .from("exports")
      .select("resume_id")
      .eq("id", id)
      .single();

    if (getError || !exportRecord) {
      return NextResponse.json({ success: false, error: "Export not found" }, { status: 404 });
    }

    const { data: resume, error: resumeError } = await supabase
      .from("resumes")
      .select("id")
      .eq("id", exportRecord.resume_id)
      .eq("user_id", user.id)
      .single();

    if (resumeError || !resume) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { error } = await supabase.from("exports").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}