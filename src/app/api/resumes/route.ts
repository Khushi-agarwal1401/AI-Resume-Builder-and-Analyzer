import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getResumes, createResume } from "@/services/resume/service";
import { createResumeSchema, validateOrError } from "@/lib/validation";
import { getUserPlanLimits, checkPremiumAccess, recordPremiumUse } from "@/lib/subscription";
import { ok, fail, logError, withErrorHandling } from "@/lib/api";
import { isAdmin } from "@/lib/admin";
import { getTemplateInfo, normalizeTemplateKey } from "@/features/resume-builder/config/template-discovery";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const resumes = await getResumes(session.user.id);
  return ok(resumes);
});

export const POST = withErrorHandling(async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Usage limit: check plan's max resumes by counting existing records
  const limits = await getUserPlanLimits(session.user.id);
  const existing = await getResumes(session.user.id);
  const adminUser = await isAdmin(session.user.id, session.user.email || "");
  if (!adminUser && existing.length >= limits.maxResumes) {
    return NextResponse.json(
      { success: false, error: `Maximum resume limit (${limits.maxResumes}) reached. Upgrade to Pro for unlimited resumes.` },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const validated = validateOrError(createResumeSchema, body);
  if ("error" in validated) return validated.error;

  // Premium template gate: creating a resume with a premium template is Pro,
  // but free users get PREMIUM_TRIAL_USES free creates per month. Admins exempt.
  let burnsPremiumTrial = false;
  if (!adminUser && validated.data.template) {
    const templateKey = normalizeTemplateKey(validated.data.template);
    if (getTemplateInfo(templateKey, "").tier === "premium") {
      const trial = await checkPremiumAccess(
        session.user.id,
        "premium_templates",
        limits.hasAdvancedTemplates,
        adminUser
      );
      if (!trial) {
        return NextResponse.json(
          {
            success: false,
            error: "This is a premium template. Upgrade to Pro to use it in the builder.",
            upgradeRequired: true,
          },
          { status: 403 }
        );
      }
      burnsPremiumTrial = !limits.hasAdvancedTemplates;
    }
  }

  try {
    const resume = await createResume(session.user.id, validated.data as Parameters<typeof createResume>[1]);
    // Burn one free premium-template use on a successful create (free users only).
    if (burnsPremiumTrial) {
      await recordPremiumUse(session.user.id, "premium_templates", false, false);
    }
    return NextResponse.json({ success: true, data: resume }, { status: 201 });
  } catch (error) {
    await logError(error, "create resume");
    return fail("An unexpected error occurred. Please try again.");
  }
});
