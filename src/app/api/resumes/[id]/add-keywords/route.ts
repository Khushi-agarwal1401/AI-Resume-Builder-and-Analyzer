import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { updateSections } from "@/services/resume/service";

export const dynamic = "force-dynamic";

/**
 * POST /api/resumes/[id]/add-keywords
 * Appends missing skill keywords to a resume's Skills section (deduped).
 * Body: { keywords: string[] }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { keywords?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }

  const keywords = Array.isArray(body.keywords)
    ? (body.keywords as unknown[])
        .filter((k): k is string => typeof k === "string")
        .map((k) => k.trim().slice(0, 80))
        .filter(Boolean)
        .slice(0, 50)
    : [];

  if (keywords.length === 0) {
    return NextResponse.json({ success: false, error: "No keywords selected" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  // Verify ownership first so no code path leaks resume state to other users
  const { data: ownedResume } = await supabase
    .from("resumes")
    .select("id")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .single();
  if (!ownedResume) {
    return NextResponse.json({ success: false, error: "Resume not found" }, { status: 404 });
  }

  // Fetch current skills
  const { data: skillsRow, error: skillsError } = await supabase
    .from("skills")
    .select("technical, soft, tools, frameworks")
    .eq("resume_id", id)
    .maybeSingle();

  if (skillsError) {
    return NextResponse.json({ success: false, error: "Failed to load resume skills" }, { status: 500 });
  }

  const toArray = (v: unknown): string[] =>
    Array.isArray(v) ? (v as unknown[]).filter((x): x is string => typeof x === "string") : [];

  const technical = toArray(skillsRow?.technical);
  const soft = toArray(skillsRow?.soft);
  const tools = toArray(skillsRow?.tools);
  const frameworks = toArray(skillsRow?.frameworks);

  const existing = new Set(
    [...technical, ...soft, ...tools, ...frameworks].map((s) => s.toLowerCase())
  );

  const added: string[] = [];
  for (const kw of keywords) {
    if (!existing.has(kw.toLowerCase())) {
      existing.add(kw.toLowerCase());
      added.push(kw);
      technical.push(kw);
    }
  }

  if (added.length === 0) {
    return NextResponse.json({
      success: true,
      added: [],
      message: "All selected keywords are already on the resume.",
    });
  }

  // updateSections does a delete-then-insert so no duplicate skills rows can
  // accumulate (skills has no UNIQUE constraint on resume_id).
  try {
    await updateSections(id, session.user.id, "skills", { technical, soft, tools, frameworks });
  } catch {
    return NextResponse.json({ success: false, error: "Resume not found or failed to update" }, { status: 500 });
  }

  return NextResponse.json({ success: true, added });
}
