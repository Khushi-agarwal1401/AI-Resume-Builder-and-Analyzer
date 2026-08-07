import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    // Get the original resume
    const { data: original, error: getError } = await supabase
      .from("resumes")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (getError || !original) {
      return NextResponse.json({ success: false, error: "Resume not found" }, { status: 404 });
    }

    // Create duplicate
    const { data: duplicate, error: createError } = await supabase
      .from("resumes")
      .insert({
        user_id: user.id,
        title: `${original.title} (Copy)`,
        template: original.template,
        personal_info: original.personal_info,
        summary: original.summary,
        target_level: original.target_level,
        coursework: original.coursework,
        interests: original.interests,
        accent_color: original.accent_color,
        font_family: original.font_family,
        section_order: original.section_order,
        custom_sections: original.custom_sections,
      })
      .select()
      .single();

    if (createError) throw createError;

    // Duplicate related data (skills, experience, education, etc.)
    const tables = ["skills", "experience", "education", "projects", "certifications", "achievements", "activities", "leadership", "volunteer", "publications", "open_source", "languages", "coding_profiles"];
    for (const table of tables) {
      const { data: items } = await supabase.from(table).select("*").eq("resume_id", id);
      if (items && items.length > 0) {
        const toInsert = items.map((item: Record<string, unknown>) => {
          const { id: _id, resume_id: _resume_id, created_at: _created_at, updated_at: _updated_at, ...rest } = item as Record<string, unknown>;
          return { ...rest, resume_id: duplicate.id };
        });
        await supabase.from(table).insert(toInsert as Record<string, unknown>[]);
      }
    }

    return NextResponse.json({ success: true, data: duplicate });
  } catch (e: unknown) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}