import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerClient } from "@/lib/db/server";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const db = await createServerClient();

    // Verify ownership via resume
    const { data: exportRecord, error: getError } = await db
      .from("exports")
      .select("resume_id")
      .eq("id", id)
      .single();

    if (getError || !exportRecord) {
      return NextResponse.json({ success: false, error: "Export not found" }, { status: 404 });
    }

    const { data: resume, error: resumeError } = await db
      .from("resumes")
      .select("id")
      .eq("id", exportRecord.resume_id)
      .eq("user_id", session.user.id)
      .single();

    if (resumeError || !resume) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { error } = await db.from("exports").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}
