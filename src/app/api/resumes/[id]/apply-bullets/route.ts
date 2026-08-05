import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getResume, updateSections } from "@/services/resume/service";
import {
  parseBulletPairs,
  applyBulletRewrites,
  type ExperienceEntry,
} from "@/services/resume/bullet-matcher";

export const dynamic = "force-dynamic";

/**
 * POST /api/resumes/[id]/apply-bullets
 * Replaces weak experience bullets with improved rewrites (deduped). Each pair
 * is applied at most once, preferring an exact match anywhere before falling
 * back to a fuzzy match. Body: { bullets: { original, rewrite }[] }
 *
 * The matching + rebuild logic lives in src/services/resume/bullet-matcher.ts
 * (pure and unit-tested); this route handles auth, validation, and persistence.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { bullets?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }

  const pairs = parseBulletPairs(body.bullets);
  if (pairs.length === 0) {
    return NextResponse.json({ success: false, error: "No bullet rewrites selected" }, { status: 400 });
  }

  // Load the resume's current experience rows (ownership-checked via getResume).
  let resume;
  try {
    resume = await getResume(id, session.user.id);
  } catch {
    return NextResponse.json({ success: false, error: "Resume not found" }, { status: 404 });
  }

  // Rebuild experience for persistence, dropping DB metadata so updateSections'
  // delete-then-insert gets clean rows (mirrors duplicateResume's convention).
  const experience: ExperienceEntry[] = resume.experience.map((entry) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, resume_id: _rid, created_at, updated_at, sort_order, ...clean } =
      entry as unknown as ExperienceEntry & {
        resume_id?: string;
        created_at?: string;
        updated_at?: string;
        sort_order?: number;
      };
    return {
      ...clean,
      responsibilities: [...entry.responsibilities],
      achievements: [...(entry.achievements || [])],
    };
  });

  const { applied, alreadyPresent, notFound } = applyBulletRewrites(experience, pairs);

  if (applied.length === 0) {
    return NextResponse.json({
      success: true,
      applied: [],
      alreadyPresent,
      notFound,
      message:
        alreadyPresent.length > 0
          ? "All selected rewrites are already on the resume."
          : "None of the selected bullets could be matched to the resume's experience entries.",
    });
  }

  try {
    await updateSections(id, session.user.id, "experience", experience);
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update the resume. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    applied,
    alreadyPresent,
    notFound,
  });
}
