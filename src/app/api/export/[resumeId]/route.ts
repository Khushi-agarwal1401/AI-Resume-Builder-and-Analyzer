import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getResume } from "@/services/resume/service";
import { generatePdfBuffer } from "@/services/export/pdfRenderer";
import { generateDocxBuffer } from "@/services/export/docxGenerator";
import { generateTxtBuffer } from "@/services/export/txtGenerator";
import { renderResumeToHtml } from "@/services/export/htmlRenderer";
import {
  EXPORT_META,
  isExportFormat,
  sanitizeFilename,
  type ExportFormat,
} from "@/services/export/formats";
import type { ResumeData } from "@/types/resume";

export const dynamic = "force-dynamic";

export type { ExportFormat } from "@/services/export/formats";

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

    // Resolve export format (defaults to PDF for backward compatibility)
    const requestedFormat = request.nextUrl.searchParams.get("format");
    const format: ExportFormat = isExportFormat(requestedFormat) ? requestedFormat : "pdf";
    const meta = EXPORT_META[format];

    const name =
      sanitizeFilename(resume.personalInfo.fullName).replace(/\s+/g, "_") || "Resume";
    const filename = `${name}_Resume.${meta.extension}`;

    let body: BodyInit;
    if (format === "pdf") {
      const pdfBuffer = await generatePdfBuffer(exportResume);
      body = new Uint8Array(pdfBuffer);
    } else if (format === "docx") {
      const docxBuffer = await generateDocxBuffer(exportResume);
      body = new Uint8Array(docxBuffer);
    } else if (format === "txt") {
      body = new Uint8Array(generateTxtBuffer(exportResume));
    } else {
      body = renderResumeToHtml(exportResume);
    }

    return new NextResponse(body, {
      headers: {
        "Content-Type": meta.contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
