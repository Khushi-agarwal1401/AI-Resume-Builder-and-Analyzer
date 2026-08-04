import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getResume } from "@/services/resume/service";
import { generatePdfBuffer } from "@/services/export/pdfRenderer";
import type { ResumeData } from "@/types/resume";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resumeId: string }> }
) {
  const { resumeId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resume = await getResume(resumeId, session.user.id);
    if (!resume) {
      return NextResponse.json({ success: false, error: "Resume not found" }, { status: 404 });
    }

    // Allow template override via query param (so preview matches export)
    const templateOverride = request.nextUrl.searchParams.get("template");
    const exportResume = templateOverride
      ? { ...resume, template: templateOverride as ResumeData["template"] }
      : resume;

    // Also need to import ResumeTemplate type
    const filename = `${resume.personalInfo.fullName.replace(/\s+/g, "_")}_Resume.pdf`;
    const pdfBuffer = await generatePdfBuffer(exportResume);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
