import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getResumes, getResumesWithCompletion, createResume } from "@/services/resume/service";
import { createResumeSchema, validateOrError } from "@/lib/validation";
import { getUserPlanLimits } from "@/lib/subscription";
import { getTemplateInfo, normalizeTemplateKey } from "@/features/resume-builder/config/template-discovery";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resumes = await getResumesWithCompletion(session.user.id);
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

  // Server-side premium template gate (K-14): the templates page gates premium
  // templates client-side, but the API is the source of truth — a free user
  // must not create a premium-template resume by POSTing directly.
  const templateKey = normalizeTemplateKey(validated.data.template || "modern");
  if (!limits.hasAdvancedTemplates && getTemplateInfo(templateKey, "").tier === "premium") {
    return NextResponse.json(
      {
        success: false,
        error: "This is a premium template. Upgrade to Pro to use it in the builder.",
        upgradeRequired: true,
      },
      { status: 403 }
    );
  }

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
