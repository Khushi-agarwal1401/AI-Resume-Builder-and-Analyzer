import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getResume, updateResume, deleteResume, updateSections } from "@/services/resume/service";
import { validatePersonalInfo, validateEducation, validateExperience } from "@/services/resume/validation";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resume = await getResume(id, session.user.id);
    return NextResponse.json({ success: true, data: resume });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Resume not found" },
      { status: 404 }
    );
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (body.sectionType) {
      if (body.sectionType === "education") {
        const errors = (body.data as Record<string, unknown>[]).flatMap((item) => validateEducation(item));
        if (errors.length > 0) {
          return NextResponse.json({ success: false, error: "Validation failed", details: errors }, { status: 400 });
        }
      } else if (body.sectionType === "experience") {
        const errors = (body.data as Record<string, unknown>[]).flatMap((item) => validateExperience(item));
        if (errors.length > 0) {
          return NextResponse.json({ success: false, error: "Validation failed", details: errors }, { status: 400 });
        }
      }
      await updateSections(id, session.user.id, body.sectionType, body.data);
    } else {
      if (body.personalInfo) {
        const errors = validatePersonalInfo(body.personalInfo as Record<string, unknown>);
        if (errors.length > 0) {
          return NextResponse.json({ success: false, error: "Validation failed", details: errors }, { status: 400 });
        }
      }
      await updateResume(id, session.user.id, body);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update resume" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await deleteResume(id, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete resume" },
      { status: 500 }
    );
  }
}
