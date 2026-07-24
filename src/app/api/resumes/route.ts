import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getResumes, createResume } from "@/services/resume/service";
import { createResumeSchema, validateOrError } from "@/lib/validation";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resumes = await getResumes(session.user.id);
    return NextResponse.json({ success: true, data: resumes });
  } catch (error) {
    console.error(error); // This will show in your terminal
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch resumes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const validated = validateOrError(createResumeSchema, body);
  if ("error" in validated) return validated.error;

  try {
    const resume = await createResume(session.user.id, validated.data as Parameters<typeof createResume>[1]);
    return NextResponse.json({ success: true, data: resume }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create resume" },
      { status: 500 }
    );
  }
}
