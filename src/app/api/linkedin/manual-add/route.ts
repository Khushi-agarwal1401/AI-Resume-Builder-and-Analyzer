import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { linkedinManualAddSchema, validateOrError } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * POST /api/linkedin/manual-add
 *
 * Writes a manually-entered certificate, achievement, or post reference
 * into the appropriate resume section. This is the entire "LinkedIn import"
 * backend surface — no automated import endpoint can exist without a
 * Talent Solutions partnership.
 *
 * Body: { resumeId, type: "certificate"|"achievement"|"post_reference",
 *         title, issuer?, description?, date?, url? }
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const validated = validateOrError(linkedinManualAddSchema, body);
  if ("error" in validated) return validated.error;

  const { resumeId, type, title, issuer, description, date, url } = validated.data;

  try {
    // Verify resume ownership
    const supabase = await createServerSupabaseClient();
    const { data: resume } = await supabase
      .from("resumes")
      .select("id")
      .eq("id", resumeId)
      .eq("user_id", session.user.id)
      .single();

    if (!resume) {
      return NextResponse.json(
        { success: false, error: "Resume not found" },
        { status: 404 }
      );
    }

    let result;

    if (type === "certificate") {
      // Add to certifications table
      const { data, error } = await supabase
        .from("certifications")
        .insert({
          resume_id: resumeId,
          name: title,
          issuer: issuer || "",
          date: date || "",
          url: url || "",
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      result = data;
    } else if (type === "achievement") {
      // Add to achievements table
      const { data, error } = await supabase
        .from("achievements")
        .insert({
          resume_id: resumeId,
          title,
          description: description || "",
          date: date || "",
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      result = data;
    } else {
      // post_reference — add to projects section as a notable post/reference
      const { data, error } = await supabase
        .from("projects")
        .insert({
          resume_id: resumeId,
          name: title,
          description: `LinkedIn post reference: ${description || title}`,
          technologies: [],
          live_url: url || "",
          github_url: "",
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      result = data;
    }

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to add entry" },
      { status: 500 }
    );
  }
}
