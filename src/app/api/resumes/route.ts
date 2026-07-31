import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getResumes, createResume } from "@/services/resume/service";
import { createResumeSchema, validateOrError } from "@/lib/validation";
import { getUserPlanLimits } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resumes = await getResumes(session.user.id);
    return NextResponse.json({ success: true, data: resumes });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Usage limit: check plan's max resumes by counting existing records
  const limits = await getUserPlanLimits(session.user.id);
  const existing = await getResumes(session.user.id);
  if (existing.length >= limits.maxResumes) {
    return NextResponse.json(
      { success: false, error: `Maximum resume limit (${limits.maxResumes}) reached. Upgrade to Pro for unlimited resumes.` },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const validated = validateOrError(createResumeSchema, body);
  if ("error" in validated) return validated.error;

  try {
    const resume = await createResume(session.user.id, validated.data as Parameters<typeof createResume>[1]);
    return NextResponse.json({ success: true, data: resume }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
