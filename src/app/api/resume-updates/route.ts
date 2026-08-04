import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getResumeUpdates, updateResumeUpdateStatus, addUpdateToResume } from "@/services/resume-updates/service";
import { updateResumeUpdateSchema, validateOrError } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getResumeUpdates(session.user.id);
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const validated = validateOrError(updateResumeUpdateSchema, body);
  if ("error" in validated) return validated.error;

  try {
    if (validated.data.status === "added" && validated.data.resumeId) {
      await addUpdateToResume(
        validated.data.updateId,
        session.user.id,
        validated.data.resumeId
      );
    } else {
      await updateResumeUpdateStatus(
        validated.data.updateId,
        session.user.id,
        validated.data.status
      );
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
