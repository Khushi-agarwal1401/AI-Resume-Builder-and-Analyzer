import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getResume, getResumes, updateResume, deleteResume, updateSections } from "@/services/resume/service";
import { updateResumeSchema, validateOrError } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { getUserPlanLimits, checkPremiumAccess, recordPremiumUse } from "@/lib/subscription";
import { isAdmin } from "@/lib/admin";
import { getTemplateInfo, normalizeTemplateKey } from "@/features/resume-builder/config/template-discovery";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resume = await getResume(id, session.user.id);
    return NextResponse.json({ success: true, data: resume });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 404 }
    );
  }
}

/** Shared update handler used by PUT (builder autosave / manual save) and PATCH (LinkedIn import). */
async function handleUpdate(request: Request, id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Admins have full access: exempt from the save rate limit and the premium
  // template gate (checked once, reused for both).
  const adminUser = await isAdmin(session.user.id, session.user.email || "");

  // Builder autosave is debounced to ~1/s, but a scripted client could hammer
  // this endpoint — cap writes per user (K-14).
  const allowed = await checkRateLimit(`builder-save:${session.user.id}`, 300, 60000, { bypass: adminUser });
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Too many save requests. Please slow down." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const validated = validateOrError(updateResumeSchema, body);
  if ("error" in validated) return validated.error;

  // Premium template gate (K-14): the same server-side check as POST
  // /api/resumes. A free user must not switch an existing resume to a premium
  // template by calling the update endpoint directly (or via "use on existing
  // resume") — the templates-page gate is client-side only. Free users get
  // PREMIUM_TRIAL_USES premium switches per month. Admins exempt.
  let burnsPremiumTrial = false;
  if (validated.data.template && !adminUser) {
    const templateKey = normalizeTemplateKey(validated.data.template);
    const limits = await getUserPlanLimits(session.user.id);
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

  // Pin cap (Epic 3, Task 3.1): at most 5 pinned resumes. The dashboard also
  // enforces this client-side, but a second tab or stale cache must not be able
  // to exceed it — count before allowing a new pin.
  if (validated.data.isPinned === true) {
    const existing = await getResumes(session.user.id);
    const pinnedCount = existing.filter((r) => (r as { is_pinned?: boolean | null }).is_pinned).length;
    if (pinnedCount >= 5) {
      return NextResponse.json(
        {
          success: false,
          error: "You can pin up to 5 resumes. Unpin one first.",
          pinLimitReached: true,
        },
        { status: 400 }
      );
    }
  }

  try {
    if (validated.data.sectionType) {
      await updateSections(id, session.user.id, validated.data.sectionType, validated.data.data);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { sectionType, data, sections, personalInfo, customSections, accentColor, ...rest } = validated.data;
      await updateResume(id, session.user.id, {
        ...rest,
        accentColor: accentColor ?? undefined,
        personalInfo: personalInfo as Parameters<typeof updateResume>[2]["personalInfo"],
        // Zod treats customSections as an opaque record; the service persists it as JSONB.
        customSections: customSections as Parameters<typeof updateResume>[2]["customSections"],
      });
      if (sections) {
        const failedSections: string[] = [];
        for (const [sectionKey, sectionData] of Object.entries(sections)) {
          // null/undefined means "no change" — skipping avoids wiping a section's rows.
          if (sectionData == null) continue;
          try {
            await updateSections(id, session.user.id, sectionKey, sectionData);
          } catch (err) {
            // Don't let one bad section discard the other 12 — log and continue.
            console.error(`Failed to persist resume section "${sectionKey}" (${id})`, err);
            failedSections.push(sectionKey);
          }
        }
        if (failedSections.length > 0) {
          if (burnsPremiumTrial) {
            await recordPremiumUse(session.user.id, "premium_templates", false, false);
          }
          return NextResponse.json({
            success: true,
            warning: `Some sections could not be saved: ${failedSections.join(", ")}`,
          });
        }
      }
    }
    // Burn one free premium-template use on a successful switch (free users only).
    if (burnsPremiumTrial) {
      await recordPremiumUse(session.user.id, "premium_templates", false, false);
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleUpdate(request, id);
}

// LinkedIn import posts section payloads with PATCH; without this the import
// would 405 and the imported sections would never persist.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleUpdate(request, id);
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
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
