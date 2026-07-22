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

function mapRowToResumeData(row: ResumeRow & Record<string, unknown>): ResumeData {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    template: row.template as ResumeData["template"],
    personalInfo: (row.personal_info as unknown as ResumeData["personalInfo"]) || {
      fullName: "", email: "", phone: "", linkedin: "", github: "", portfolio: "", photo: "",
    },
    summary: row.summary,
    education: (row.education || []) as ResumeData["education"],
    experience: (row.experience || []) as ResumeData["experience"],
    projects: (row.projects || []) as ResumeData["projects"],
    skills: ((row.skills as unknown[])?.[0] as ResumeData["skills"]) || { technical: [], soft: [], tools: [], frameworks: [] },
    certifications: (row.certifications || []) as ResumeData["certifications"],
    achievements: (row.achievements || []) as ResumeData["achievements"],
    languages: (row.languages || []) as ResumeData["languages"],
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

  // Single batched query using Supabase's select(*, related:table(*)) syntax
  // This replaces the previous 7 parallel queries with one round-trip
  const { data: resume, error: resumeError } = await supabase
    .from("resumes")
    .select(`
      *,
      education(*),
      experience(*),
      projects(*),
      skills(*),
      certifications(*),
      achievements(*),
      languages(*)
    `)
    .eq("id", id)
    .eq("user_id", userId)
    .order("sort_order", { referencedTable: "education" })
    .order("sort_order", { referencedTable: "experience" })
    .order("sort_order", { referencedTable: "projects" })
    .order("sort_order", { referencedTable: "certifications" })
    .order("sort_order", { referencedTable: "achievements" })
    .order("sort_order", { referencedTable: "languages" })
    .single();

  if (resumeError || !resume) throw new Error("Resume not found");

  return mapRowToResumeData(resume as ResumeRow & Record<string, unknown>);
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

export async function duplicateResume(id: string, userId: string, newTitle?: string) {
  const supabase = await createServerSupabaseClient();

  // Fetch the full resume with sections
  const resume = await getResume(id, userId);

  // Create the new resume
  const { data: newResume, error: createError } = await supabase
    .from("resumes")
    .insert({
      user_id: userId,
      title: newTitle || `${resume.title} (Copy)`,
      template: resume.template,
      personal_info: resume.personalInfo as unknown as Record<string, unknown>,
      summary: resume.summary,
    })
    .select()
    .single();

  if (createError) throw new Error(createError.message);

  const newId = newResume.id;

  // Duplicate each section type
  const sectionTypes = [
    { table: "education", data: resume.education },
    { table: "experience", data: resume.experience },
    { table: "projects", data: resume.projects },
    { table: "certifications", data: resume.certifications },
    { table: "achievements", data: resume.achievements },
    { table: "languages", data: resume.languages },
  ] as const;

  for (const { table, data: items } of sectionTypes) {
    if (items.length > 0) {
      const { error } = await supabase.from(table).insert(
        (items as unknown as Record<string, unknown>[]).map((item, i) => {
          const { id: _id, resume_id: _rid, created_at, updated_at, ...rest } = item as Record<string, unknown>;
          return { ...rest, resume_id: newId, sort_order: i };
        })
      );
      if (error) throw new Error(error.message);
    }
  }

  // Duplicate skills
  if (resume.skills) {
    const { error } = await supabase.from("skills").insert({
      ...resume.skills,
      resume_id: newId,
    });
    if (error) throw new Error(error.message);
  }

  return newResume;
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
