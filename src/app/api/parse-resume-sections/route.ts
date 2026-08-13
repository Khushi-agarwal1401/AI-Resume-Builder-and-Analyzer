import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseOptimizedResume } from "@/services/resume-analyzer/parse-optimized-resume";

export const dynamic = "force-dynamic";

/**
 * POST /api/parse-resume-sections
 * Deterministically parses the ATS Keyword Optimizer's resume output into
 * structured sections (summary, experience, education, skills, projects).
 * Fully offline — no AI.
 *
 * Used by the ATS Keyword Optimizer's Apply button so the AI-rewritten resume
 * text can be written back into the builder's structured sections. The parser
 * lives server-side (it pulls in pdf/tesseract deps), so clients POST the
 * text here instead of importing it.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { text?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (text.length < 10) {
    return NextResponse.json(
      { success: false, error: "Resume text must be at least 10 characters" },
      { status: 400 }
    );
  }
  if (text.length > 30_000) {
    return NextResponse.json(
      { success: false, error: "Resume text is too large to parse" },
      { status: 413 }
    );
  }

  const parsed = parseOptimizedResume(text);

  return NextResponse.json({
    success: true,
    data: {
      summary: parsed.summary,
      experience: parsed.experience,
      education: parsed.education,
      skills: parsed.skills,
      projects: parsed.projects,
    },
  });
}
