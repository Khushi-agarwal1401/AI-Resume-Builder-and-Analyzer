import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerClient } from "@/lib/db/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/ats-analyses
 * Returns the signed-in user's ATS score history (real heuristic scores),
 * newest first.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await createServerClient();
    const { data } = await db
      .from("ats_analyses")
      .select("id, resume_id, resume_title, score, created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(200);

    return NextResponse.json({ success: true, data: data || [] });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
