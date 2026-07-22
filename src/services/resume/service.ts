import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ResumeData } from "@/types/resume";

interface ResumeRow {
  id: string;
  user_id: string;
  title: string;
  template: string;
  personal_info: Record<string, unknown>;
  summary: string;
  created_at: string;
  updated_at: string;
}

function mapRowToResumeData(row: ResumeRow, sections: Record<string, unknown[]>): ResumeData {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    template: row.template as ResumeData["template"],
    personalInfo: (row.personal_info as unknown as ResumeData["personalInfo"]) || {
      fullName: "", email: "", phone: "", linkedin: "", github: "", portfolio: "", photo: "",
    },
    summary: row.summary,
    education: (sections.education || []) as ResumeData["education"],
    experience: (sections.experience || []) as ResumeData["experience"],
    projects: (sections.projects || []) as ResumeData["projects"],
    skills: (sections.skills?.[0] as ResumeData["skills"]) || { technical: [], soft: [], tools: [], frameworks: [] },
    certifications: (sections.certifications || []) as ResumeData["certifications"],
    achievements: (sections.achievements || []) as ResumeData["achievements"],
    languages: (sections.languages || []) as ResumeData["languages"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getResumes(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("resumes")
    .select("id, title, template, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getResume(id: string, userId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: resume, error: resumeError } = await supabase
    .from("resumes")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (resumeError || !resume) throw new Error("Resume not found");

  const sections = await Promise.all([
    supabase.from("education").select("*").eq("resume_id", id).order("sort_order"),
    supabase.from("experience").select("*").eq("resume_id", id).order("sort_order"),
    supabase.from("projects").select("*").eq("resume_id", id).order("sort_order"),
    supabase.from("skills").select("*").eq("resume_id", id),
    supabase.from("certifications").select("*").eq("resume_id", id).order("sort_order"),
    supabase.from("achievements").select("*").eq("resume_id", id).order("sort_order"),
    supabase.from("languages").select("*").eq("resume_id", id).order("sort_order"),
  ]);

  return mapRowToResumeData(resume, {
    education: sections[0].data || [],
    experience: sections[1].data || [],
    projects: sections[2].data || [],
    skills: sections[3].data || [],
    certifications: sections[4].data || [],
    achievements: sections[5].data || [],
    languages: sections[6].data || [],
  });
}

export async function createResume(userId: string, data: {
  title?: string;
  template?: string;
  personalInfo?: ResumeData["personalInfo"];
  summary?: string;
}) {
  const supabase = await createServerSupabaseClient();

  const { data: resume, error } = await supabase
    .from("resumes")
    .insert({
      user_id: userId,
      title: data.title || "Untitled Resume",
      template: data.template || "modern",
      personal_info: (data.personalInfo as unknown as Record<string, unknown>) || {},
      summary: data.summary || "",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return resume;
}

export async function updateResume(id: string, userId: string, data: {
  title?: string;
  template?: string;
  personalInfo?: ResumeData["personalInfo"];
  summary?: string;
}) {
  const supabase = await createServerSupabaseClient();

  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.template !== undefined) updateData.template = data.template;
  if (data.personalInfo !== undefined) updateData.personal_info = data.personalInfo as unknown as Record<string, unknown>;
  if (data.summary !== undefined) updateData.summary = data.summary;

  const { error } = await supabase
    .from("resumes")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

export async function deleteResume(id: string, userId: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("resumes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

export async function updateSections(resumeId: string, userId: string, sectionType: string, data: unknown) {
  const supabase = await createServerSupabaseClient();

  const { data: resume } = await supabase
    .from("resumes")
    .select("id")
    .eq("id", resumeId)
    .eq("user_id", userId)
    .single();

  if (!resume) throw new Error("Resume not found");

  switch (sectionType) {
    case "education":
    case "experience":
    case "projects":
    case "certifications":
    case "achievements":
    case "languages": {
      const items = data as Array<Record<string, unknown>>;
      await supabase.from(sectionType).delete().eq("resume_id", resumeId);
      if (items.length > 0) {
        const { error } = await supabase.from(sectionType).insert(
          items.map((item, i) => ({ ...item, resume_id: resumeId, sort_order: i }))
        );
        if (error) throw new Error(error.message);
      }
      break;
    }
    case "skills": {
      await supabase.from("skills").delete().eq("resume_id", resumeId);
      const { error } = await supabase.from("skills").insert({
        ...(data as Record<string, unknown>),
        resume_id: resumeId,
      });
      if (error) throw new Error(error.message);
      break;
    }
    default:
      throw new Error("Invalid section type");
  }
}
