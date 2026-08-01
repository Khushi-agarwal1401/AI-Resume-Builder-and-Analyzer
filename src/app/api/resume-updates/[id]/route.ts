import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updateResumeUpdateStatus, addUpdateToResume } from "@/services/resume-updates/service";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { status, resumeId } = body;

  if (!["added", "ignored"].includes(status)) {
    return NextResponse.json(
      { success: false, error: "Status must be 'added' or 'ignored'" },
      { status: 400 }
    );
  }

  if (status === "added" && typeof resumeId !== "string") {
    return NextResponse.json(
      { success: false, error: "resumeId is required when adding an update" },
      { status: 400 }
    );
  }

  try {
    if (status === "added" && typeof resumeId === "string") {
      await addUpdateToResume(id, session.user.id, resumeId);
    } else {
      await updateResumeUpdateStatus(id, session.user.id, status as "added" | "ignored");
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
