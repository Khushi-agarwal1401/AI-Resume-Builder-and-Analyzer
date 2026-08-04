import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getResume, updateSections } from "@/services/resume/service";

export const dynamic = "force-dynamic";

interface BulletPair {
  original: string;
  rewrite: string;
}

/**
 * Normalize a bullet for fuzzy matching: lowercase, trim, collapse whitespace,
 * drop trailing punctuation.
 */
function normalizeBullet(b: string): string {
  return b
    .toLowerCase()
    .replace(/[\s]+/g, " ")
    .trim()
    .replace(/[.,;:!?]+$/, "");
}

/** Strict normalized-equality match (survives casing + punctuation changes). */
function bulletsEqual(a: string, b: string): boolean {
  const na = normalizeBullet(a);
  const nb = normalizeBullet(b);
  return na !== "" && na === nb;
}

/**
 * Fuzzy match: containment either way, or >=60% of the significant words of the
 * shorter string shared with the longer one. Used as a fallback after exact
 * matching, so AI rewrites of pasted resumes still land without hijacking a
 * different-but-similar bullet that already matches exactly.
 */
function bulletsSimilar(a: string, b: string): boolean {
  const na = normalizeBullet(a);
  const nb = normalizeBullet(b);
  if (!na || !nb) return false;
  if (na.includes(nb) || nb.includes(na)) return true;

  const words = (s: string) => s.split(" ").filter((w) => w.length > 2);
  const wa = words(na);
  const wb = words(nb);
  if (wa.length === 0 || wb.length === 0) return false;
  const [shorter, longer] = wa.length <= wb.length ? [wa, wb] : [wb, wa];
  const shared = shorter.filter((w) => longer.includes(w)).length;
  return shared / shorter.length >= 0.6;
}

/**
 * POST /api/resumes/[id]/apply-bullets
 * Replaces weak experience bullets with improved rewrites (deduped). Each pair
 * is applied at most once, preferring an exact match anywhere before falling
 * back to a fuzzy match. Body: { bullets: { original, rewrite }[] }
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

  const pairs: BulletPair[] = Array.isArray(body.bullets)
    ? (body.bullets as unknown[])
        .map((b) => {
          const item = b as Record<string, unknown>;
          if (typeof item?.original !== "string" || !item.original.trim()) return null;
          return {
            original: item.original.trim().slice(0, 500),
            rewrite:
              typeof item.rewrite === "string"
                ? item.rewrite.trim().slice(0, 500)
                : "",
          };
        })
        .filter((p): p is BulletPair => p !== null)
        .slice(0, 20)
    : [];

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
  const experience = resume.experience.map((entry) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, resume_id: _rid, created_at, updated_at, sort_order, ...clean } = entry;
    return {
      ...clean,
      responsibilities: [...entry.responsibilities],
      achievements: [...(entry.achievements || [])],
    };
  });

  // Bulk index of every bullet so we can locate matches without scanning per pair.
  const slots: { entryIdx: number; list: "responsibilities" | "achievements"; idx: number; text: string }[] = [];
  experience.forEach((entry, entryIdx) => {
    entry.responsibilities.forEach((text: string, idx: number) =>
      slots.push({ entryIdx, list: "responsibilities", idx, text })
    );
    entry.achievements.forEach((text: string, idx: number) =>
      slots.push({ entryIdx, list: "achievements", idx, text })
    );
  });

  const applied: string[] = [];
  const alreadyPresent: string[] = [];
  const notFound: string[] = [];
  const usedSlotKeys = new Set<string>();
  const usedRewrites = new Set<string>(slots.map((s) => normalizeBullet(s.text)));

  for (const pair of pairs) {
    // Dedupe: skip pairs whose rewrite already exists on the resume.
    if (usedRewrites.has(normalizeBullet(pair.rewrite))) {
      alreadyPresent.push(pair.original);
      continue;
    }

    // Exact match first anywhere, then fuzzy — but only on bullets not already
    // claimed by an earlier pair in this request.
    const match =
      slots.find(
        (s) => !usedSlotKeys.has(`${s.entryIdx}:${s.list}:${s.idx}`) && bulletsEqual(s.text, pair.original)
      ) ||
      slots.find(
        (s) => !usedSlotKeys.has(`${s.entryIdx}:${s.list}:${s.idx}`) && bulletsSimilar(s.text, pair.original)
      );

    if (!match) {
      notFound.push(pair.original);
      continue;
    }

    const { entryIdx, list, idx } = match;
    experience[entryIdx][list][idx] = pair.rewrite;
    usedSlotKeys.add(`${entryIdx}:${list}:${idx}`);
    usedRewrites.add(normalizeBullet(pair.rewrite));
    applied.push(pair.original);
  }

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
