import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

/**
 * POST /api/resumes/[id]/share
 * Body: { enabled: boolean }
 * Enables/disables the public share link for a resume and returns the token.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const enabled = body.enabled === true;

  try {
    const supabase = await createServerSupabaseClient();

    // Verify ownership
    const { data: resume } = await supabase
      .from("resumes")
      .select("id, share_token, share_enabled")
      .eq("id", id)
      .eq("user_id", session.user.id)
      .single();

    if (!resume) {
      return NextResponse.json({ success: false, error: "Resume not found" }, { status: 404 });
    }

    const token = enabled ? resume.share_token || randomUUID() : resume.share_token;

    const { error } = await supabase
      .from("resumes")
      .update({
        share_token: token,
        share_enabled: enabled,
        share_updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      data: {
        enabled,
        token: enabled ? token : null,
        url: enabled ? `${request.nextUrl.origin}/share/${token}` : null,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
