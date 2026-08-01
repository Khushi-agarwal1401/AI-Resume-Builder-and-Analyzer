import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getResume } from "@/services/resume/service";
import { generatePdfBuffer } from "@/services/export/pdfRenderer";
import { generateDocxBuffer } from "@/services/export/docxGenerator";
import { generateTxtBuffer } from "@/services/export/txtGenerator";
import { createNotification } from "@/services/notifications/service";
import { getUserPlanLimits } from "@/lib/subscription";
import type { ResumeData } from "@/types/resume";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ExportFormat = "pdf" | "docx" | "txt";

const CONTENT_TYPES: Record<ExportFormat, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain; charset=utf-8",
};

// A-16: refuse to render absurdly large resumes (memory protection)
const MAX_SERIALIZED_BYTES = 5 * 1024 * 1024; // 5 MB

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w\s.-]/g, "").replace(/\s+/g, "_").slice(0, 100) || "Resume";
}

function safeContentDisposition(filename: string): string {
  // Reject header-injection characters in addition to the sanitizer
  const safe = filename.replace(/[\r\n"\\]/g, "_");
  return `attachment; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(safe)}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resumeId: string }> }
) {
  const { resumeId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Validate format early so an invalid value is a 400, not a 500
  const formatParam = (request.nextUrl.searchParams.get("format") || "pdf").toLowerCase();
  const format: ExportFormat =
    formatParam === "docx" || formatParam === "txt" ? formatParam : "pdf";

  // A-16: PDF export is Pro-only (see pricing); DOCX/TXT stay free.
  if (format === "pdf") {
    const limits = await getUserPlanLimits(session.user.id);
    if (!limits.hasExportPdf) {
      return NextResponse.json(
        {
          success: false,
          error: "PDF export is a Pro feature. Upgrade to Pro to download your resume as PDF.",
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }
  }

  try {
    const resume = await getResume(resumeId, session.user.id);
    if (!resume) {
      return NextResponse.json({ success: false, error: "Resume not found" }, { status: 404 });
    }

    // A-16: payload size guard before handing off to the generators
    const serializedBytes = Buffer.byteLength(JSON.stringify(resume), "utf8");
    if (serializedBytes > MAX_SERIALIZED_BYTES) {
      return NextResponse.json(
        { success: false, error: "This resume is too large to export. Try trimming a few sections." },
        { status: 413 }
      );
    }

    // Allow template override via query param (so preview matches export)
    const templateOverride = request.nextUrl.searchParams.get("template");
    const exportResume = templateOverride
      ? { ...resume, template: templateOverride as ResumeData["template"] }
      : resume;

    const baseName = sanitizeFilename(resume.personalInfo.fullName);
    const filename = `${baseName}_Resume.${format}`;

    let buffer: Buffer;
    if (format === "docx") {
      buffer = await generateDocxBuffer(exportResume);
    } else if (format === "txt") {
      buffer = generateTxtBuffer(exportResume);
    } else {
      buffer = await generatePdfBuffer(exportResume);
    }

    // Notification Center: notify the user their resume was exported (best-effort)
    await createNotification(session.user.id, {
      type: "export",
      title: "Resume exported",
      message: `"${resume.title}" downloaded as ${format.toUpperCase()}.`,
      link: "/dashboard",
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": CONTENT_TYPES[format],
        "Content-Disposition": safeContentDisposition(filename),
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
