import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getResume, updateResume, updateSections } from "@/services/resume/service";

export const dynamic = "force-dynamic";

/**
 * Safe, position-valid word swaps only. These are grammatically safe in any
 * sentence context (same word slot), unlike phrase-level advice from the
 * grammar checker ("use 'Managed', 'Led', or 'Owned'") which requires a human
 * to pick the right verb. Everything else stays in the manual checklist.
 */
const SAFE_FIXES: { pattern: RegExp; replace: string }[] = [
  { pattern: /\bUtilized\b/g, replace: "Used" },
  { pattern: /\butilized\b/g, replace: "used" },
  { pattern: /\bUtilize\b/g, replace: "Use" },
  { pattern: /\butilize\b/g, replace: "use" },
  { pattern: /\bHandled\b/g, replace: "Managed" },
  { pattern: /\bhandled\b/g, replace: "managed" },
  { pattern: /\bWorked on\b/g, replace: "Developed" },
  { pattern: /\bworked on\b/g, replace: "developed" },
  { pattern: /\bvery\s+/gi, replace: "" },
];

interface FixChange {
  field: string;
  original: string;
  fixed: string;
}

function applySafeFixes(text: string, field: string, changes: FixChange[]): string {
  let fixed = text;
  for (const { pattern, replace } of SAFE_FIXES) {
    const matched = pattern.test(fixed);
    if (!matched) continue;
    fixed = fixed.replace(pattern, (orig) => {
      changes.push({ field, original: orig.trim(), fixed: replace.trim() || "removed" });
      return replace;
    });
  }
  return fixed;
}

/**
 * POST /api/resumes/[id]/apply-grammar
 * Applies safe deterministic grammar/style swaps to the resume's experience
 * bullets and summary. Body: {} — the resume itself is the input.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let resume;
  try {
    resume = await getResume(id, session.user.id);
  } catch {
    return NextResponse.json({ success: false, error: "Resume not found" }, { status: 404 });
  }

  const changes: FixChange[] = [];

  // Rebuild experience for persistence, dropping DB metadata (mirrors
  // apply-bullets / duplicateResume convention for delete-then-insert).
  const experience = resume.experience.map((entry) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, resume_id: _rid, created_at, updated_at, sort_order, ...clean } = entry;
    return {
      ...clean,
      responsibilities: entry.responsibilities.map((b) => applySafeFixes(b, "responsibility", changes)),
      achievements: (entry.achievements || []).map((b) => applySafeFixes(b, "achievement", changes)),
    };
  });

  let summaryChanged = false;
  const newSummary = applySafeFixes(resume.summary || "", "summary", changes);
  summaryChanged = newSummary !== (resume.summary || "");

  if (changes.length === 0) {
    return NextResponse.json({
      success: true,
      changes: [],
      message: "No safe grammar/style fixes were needed.",
    });
  }

  try {
    // Save experience even if only the summary changed? Only resave a section
    // when it actually changed — avoids pointless delete-then-insert churn.
    const experienceChanged = changes.some((c) => c.field !== "summary");
    if (experienceChanged) {
      await updateSections(id, session.user.id, "experience", experience);
    }
    if (summaryChanged) {
      await updateResume(id, session.user.id, { summary: newSummary });
    }
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update the resume. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, changes });
}
