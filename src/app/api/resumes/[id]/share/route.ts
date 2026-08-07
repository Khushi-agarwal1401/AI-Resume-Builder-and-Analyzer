import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createNotification } from "@/services/notifications/service";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

/**
 * Fetches the share columns of a resume owned by the user, or null if the
 * resume doesn't exist / isn't theirs. Shared by GET and POST so the two
 * handlers can't drift on the ownership check.
 */
async function getOwnedShareRow(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  id: string,
  userId: string
) {
  const { data } = await supabase
    .from("resumes")
    .select("id, share_token, share_enabled")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  return data as { id: string; share_token: string | null; share_enabled: boolean } | null;
}

/**
 * GET /api/resumes/[id]/share
 * Returns the current share state for a resume in the same shape as POST
 * ({ success, data: { enabled, token, url } }), so the preview page can
 * initialize its toggle/link from the real state instead of defaulting off.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createServerSupabaseClient();
    const resume = await getOwnedShareRow(supabase, id, session.user.id);

    if (!resume) {
      return NextResponse.json({ success: false, error: "Resume not found" }, { status: 404 });
    }

    const enabled = resume.share_enabled === true;
    const token = enabled ? resume.share_token : null;
    return NextResponse.json({
      success: true,
      data: {
        enabled,
        token,
        url: token ? `${request.nextUrl.origin}/share/${token}` : null,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

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
    const resume = await getOwnedShareRow(supabase, id, session.user.id);

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

    // Notification Center (Task 2.1): "Resume shared" — only when enabling.
    if (enabled) {
      await createNotification(session.user.id, {
        type: "share",
        title: "Resume shared",
        message: "Your resume now has a public share link.",
        link: `/share/${token}`,
      });
    }

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
