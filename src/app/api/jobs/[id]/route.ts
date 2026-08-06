import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getJobForUser } from "@/lib/jobs/store";

export const dynamic = "force-dynamic";

/**
 * GET /api/jobs/[id]
 * Poll status of a background job. Only the owning user can read it.
 * Returns: { success, data: { id, status, result, error, createdAt, … } }
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const job = await getJobForUser(id, session.user.id);
    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: job });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
