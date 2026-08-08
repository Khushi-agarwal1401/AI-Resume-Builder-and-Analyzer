import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getResume } from "@/services/resume/service";
import { analyzeResumeFile } from "@/services/resume-analyzer";
import { runAtsPipeline, persistAtsResult } from "@/services/resume-analyzer/ats-pipeline";
import type { DeepAtsOptions } from "@/services/resume-analyzer/deep-ats";
import type { AtsJobPayload } from "@/lib/jobs/ats-processor";
import { getUserPlanLimits, checkUsageLimit, incrementUsage } from "@/lib/subscription";
import { isAdminEmail } from "@/lib/admin-emails";
import { createNotification, hasRecentUnreadNotification } from "@/services/notifications/service";

export const dynamic = "force-dynamic";

function buildResumeText(resume: Awaited<ReturnType<typeof getResume>>): string {
  const parts: string[] = [];
  parts.push(resume.personalInfo.fullName);
  parts.push(resume.summary);
  for (const exp of resume.experience) {
    parts.push(`${exp.role} at ${exp.company} (${exp.startDate} - ${exp.current ? "Present" : exp.endDate})`);
    parts.push(...exp.responsibilities);
    parts.push(...exp.achievements);
  }
  for (const edu of resume.education) parts.push(`${edu.degree} at ${edu.institution} (${edu.endDate})`);
  for (const proj of resume.projects) parts.push(`${proj.name}: ${proj.description}`);
  const skills = resume.skills;
  parts.push([...skills.technical, ...skills.soft, ...skills.tools, ...skills.frameworks].join(", "));
  if (resume.certifications?.length) parts.push("Certifications: " + resume.certifications.map((c) => c.name).join(", "));
  if (resume.projects?.length) {
    for (const p of resume.projects) if (p.technologies?.length) parts.push(`Technologies: ${p.technologies.join(", ")}`);
  }
  return parts.join("\n");
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Usage limit: check plan's max ATS checks per month (admins exempt)
  if (!isAdminEmail(session.user.email)) {
    const limits = await getUserPlanLimits(session.user.id);
    const usageCheck = await checkUsageLimit(session.user.id, "ats_checks", limits.maxAtsChecks);
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { success: false, error: "Monthly ATS check limit reached. Upgrade to Pro for unlimited checks." },
        { status: 403 }
      );
    }
  }

  const contentType = request.headers.get("content-type") || "";
  const isMultipart = contentType.includes("multipart/form-data");

  let text = "";
  let resumeId = "";
  let resumeTitle = "";
  let jobTitle = "";
  let jobDescription = "";
  let category: DeepAtsOptions["category"] = "experienced";
  let mode: "sync" | "async" = "sync";

  try {
    if (isMultipart) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      resumeId = (formData.get("resumeId") as string | null) || "";
      jobTitle = ((formData.get("jobTitle") as string | null) || "").trim();
      jobDescription = ((formData.get("jobDescription") as string | null) || "").trim();
      const cat = formData.get("category") as string | null;
      if (cat && ["student", "fresher", "experienced", "internship"].includes(cat)) category = cat as DeepAtsOptions["category"];

      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const parsed = await analyzeResumeFile(buffer, file.name, category).catch(() => null);
        if (!parsed) return NextResponse.json({ success: false, error: "Could not read the uploaded resume. Use PDF, DOCX, or TXT." }, { status: 400 });
        text = parsed.parsed.text;
        resumeTitle = file.name;
      } else if (resumeId) {
        const resume = await getResume(resumeId, session.user.id);
        text = buildResumeText(resume);
        resumeTitle = resume.title;
      } else {
        return NextResponse.json({ success: false, error: "Upload a file or select a resume." }, { status: 400 });
      }
    } else {
      const body = await request.json().catch(() => ({}));
      resumeId = typeof body.resumeId === "string" ? body.resumeId : "";
      jobTitle = typeof body.jobTitle === "string" ? body.jobTitle.trim() : "";
      jobDescription = typeof body.jobDescription === "string" ? body.jobDescription.trim() : "";
      mode = body.mode === "async" ? "async" : "sync";
      const cat = body.category as string | undefined;
      if (cat && ["student", "fresher", "experienced", "internship"].includes(cat)) category = cat as DeepAtsOptions["category"];

      if (resumeId) {
        const resume = await getResume(resumeId, session.user.id);
        text = buildResumeText(resume);
        resumeTitle = resume.title;
      } else if (typeof body.text === "string" && body.text.trim().length >= 10) {
        text = body.text.trim();
        resumeTitle = "Pasted resume";
      } else {
        return NextResponse.json({ success: false, error: "Paste a resume, select one of your resumes, or upload a file." }, { status: 400 });
      }
    }

    if (!text || text.trim().length < 10) {
      return NextResponse.json({ success: false, error: "Resume text must be at least 10 characters." }, { status: 400 });
    }

    // Async mode: enqueue the heavy AI work on BullMQ and return immediately.
    // The client polls GET /api/jobs/[jobId] for status/result. Falls back to
    // running inline when Redis is not configured (still tracked in the DB).
    if (mode === "async") {
      const { enqueueJob } = await import("@/lib/jobs/queues");
      const { processAtsJob } = await import("@/lib/jobs/ats-processor");
      const payload: AtsJobPayload = {
        text,
        category,
        jobTitle,
        jobDescription,
        resumeId: resumeId || undefined,
        resumeTitle,
        userId: session.user.id,
      };
      const { jobId, status } = await enqueueJob(session.user.id, "ats-analysis", payload, processAtsJob);
      await incrementUsage(session.user.id, "ats_checks");
      return NextResponse.json({ success: true, queued: true, jobId, status });
    }

    // Sync mode: run the shared pipeline (deterministic + best-effort AI).
    const { report, ai } = await runAtsPipeline({ text, category, jobTitle, jobDescription });

    // Persist history + the stored ATS score when the resume belongs to the
    // user (the dashboard card reads resumes.ats_score). Non-fatal on error.
    if (resumeId) {
      try {
        const supabase = await createServerSupabaseClient();
        await persistAtsResult(supabase, {
          userId: session.user.id,
          resumeId,
          resumeTitle,
          report,
          aiStatus: ai.status,
        });
      } catch {
        // Non-fatal — analysis still succeeds.
      }
    }

    await incrementUsage(session.user.id, "ats_checks");

    // Notification Center (Task 2.1): "ATS analysis complete". Deduped so
    // repeated checks within 5 minutes don't flood the center.
    if (!(await hasRecentUnreadNotification(session.user.id, "ats", 5))) {
      await createNotification(session.user.id, {
        type: "ats",
        title: "ATS analysis complete",
        message: `Your resume scored ${report.atsScore}/100${jobTitle ? ` for "${jobTitle}"` : ""}.`,
        link: resumeId ? `/ats-check?resume=${resumeId}` : "/ats-check",
      });
    }

    return NextResponse.json({
      success: true,
      data: report,
      ai: { status: ai.status, semanticMatch: ai.semanticMatch, keywordMatch: ai.keywordMatch, keywordDensityNote: ai.keywordDensityNote },
      resumeId: resumeId || null,
      resumeTitle,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
