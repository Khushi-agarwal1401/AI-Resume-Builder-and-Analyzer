import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getResume } from "@/services/resume/service";
import { generatePdfBuffer } from "@/services/export/pdfRenderer";
import { generateDocxBuffer } from "@/services/export/docxGenerator";
import { generateTxtBuffer } from "@/services/export/txtGenerator";
import { renderResumeToHtml } from "@/services/export/htmlRenderer";
import { renderResumeToLatex } from "@/services/export/latexRenderer";
import { getUserPlanLimits } from "@/lib/subscription";
import { isAdminEmail } from "@/lib/admin-emails";
import { checkRateLimit } from "@/lib/rate-limit";
import { createServerClient } from "@/lib/db/server";
import { createNotification } from "@/services/notifications/service";
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

  // Export rate limit (K-14): a scripted client must not hammer PDF rendering.
  const allowed = await checkRateLimit(`export:${session.user.id}`, 60, 60000);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Too many export requests. Please slow down." },
      { status: 429 }
    );
  }

  // Resolve export format (defaults to PDF for backward compatibility)
  const requestedFormat = request.nextUrl.searchParams.get("format");
  const format: ExportFormat = isExportFormat(requestedFormat) ? requestedFormat : "pdf";
  const meta = EXPORT_META[format];

  try {
    const resume = await getResume(resumeId, session.user.id);
    if (!resume) {
      return NextResponse.json({ success: false, error: "Resume not found" }, { status: 404 });
    }

    // PDF export is a Pro feature (K-10). DOCX/TXT/HTML stay free. Admins exempt.
    if (format === "pdf" && !isAdminEmail(session.user.email)) {
      const limits = await getUserPlanLimits(session.user.id);
      if (!limits.hasExportPdf) {
        return NextResponse.json(
          {
            success: false,
            error: "PDF export is a Pro feature. Upgrade to Pro to download your resume as a PDF.",
            upgradeRequired: true,
          },
          { status: 403 }
        );
      }
    }

    // Allow template override via query param (so preview matches export)
    const templateOverride = request.nextUrl.searchParams.get("template");
    const exportResume = templateOverride
      ? { ...resume, template: templateOverride as ResumeData["template"] }
      : resume;

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
    } else if (format === "latex") {
      body = renderResumeToLatex(exportResume);
    } else {
      body = renderResumeToHtml(exportResume);
    }

    // Best-effort download counter (K-02) — feeds the dashboard card. A counter
    // failure must never fail the export itself.
    try {
      const db = await createServerClient();
      const { data: row } = await db
        .from("resumes")
        .select("download_count")
        .eq("id", resumeId)
        .eq("user_id", session.user.id)
        .single();
      const current = (row as { download_count?: number | null } | null)?.download_count ?? 0;
      await db
        .from("resumes")
        .update({ download_count: current + 1 } as never)
        .eq("id", resumeId)
        .eq("user_id", session.user.id);
    } catch {
      // ignore — counter is best-effort
    }

    // Notification Center (Task 2.1): "Export completed" — best-effort.
    await createNotification(session.user.id, {
      type: "export",
      title: "Export completed",
      message: `Your resume was downloaded as ${format.toUpperCase()}.`,
      link: `/builder/${resumeId}`,
    });

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
