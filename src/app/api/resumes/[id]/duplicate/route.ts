import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { duplicateResume } from "@/services/resume/service";
import { duplicateResumeSchema, validateOrError } from "@/lib/validation";

export const dynamic = "force-dynamic";

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
  const validated = validateOrError(duplicateResumeSchema, body);
  if ("error" in validated) return validated.error;

  try {
    const newResume = await duplicateResume(
      id,
      session.user.id,
      validated.data.title
    );
    return NextResponse.json({ success: true, data: newResume }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
