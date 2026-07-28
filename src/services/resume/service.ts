import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ResumeData } from "@/types/resume";

interface ResumeRow {
  id: string;
  user_id: string;
  title: string;
  template: string;
  target_level: string;
  personal_info: Record<string, unknown>;
  summary: string;
  coursework: string[];
  interests: string[];
  created_at: string;
  updated_at: string;
}

function mapRowToResumeData(row: ResumeRow & Record<string, unknown>): ResumeData {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    template: row.template as ResumeData["template"],
    targetLevel: (row.target_level as ResumeData["targetLevel"]) || "fresher",
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
    codingProfiles: (row.coding_profiles || []) as ResumeData["codingProfiles"],
    leadership: (row.leadership || []) as ResumeData["leadership"],
    openSource: (row.open_source || []) as ResumeData["openSource"],
    publications: (row.publications || []) as ResumeData["publications"],
    volunteer: (row.volunteer || []) as ResumeData["volunteer"],
    activities: (row.activities || []) as ResumeData["activities"],
    coursework: row.coursework || [],
    interests: row.interests || [],
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
      languages(*),
      coding_profiles(*),
      leadership(*),
      open_source(*),
      publications(*),
      volunteer(*),
      activities(*)
    `)
    .eq("id", id)
    .eq("user_id", userId)
    .order("sort_order", { referencedTable: "education" })
    .order("sort_order", { referencedTable: "experience" })
    .order("sort_order", { referencedTable: "projects" })
    .order("sort_order", { referencedTable: "certifications" })
    .order("sort_order", { referencedTable: "achievements" })
    .order("sort_order", { referencedTable: "languages" })
    .order("sort_order", { referencedTable: "coding_profiles" })
    .order("sort_order", { referencedTable: "leadership" })
    .order("sort_order", { referencedTable: "open_source" })
    .order("sort_order", { referencedTable: "publications" })
    .order("sort_order", { referencedTable: "volunteer" })
    .order("sort_order", { referencedTable: "activities" })
    .single();

  if (resumeError || !resume) throw new Error("Resume not found");

  return mapRowToResumeData(resume as ResumeRow & Record<string, unknown>);
}

export async function createResume(userId: string, data: {
  title?: string;
  template?: string;
  targetLevel?: string;
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
      target_level: data.targetLevel || "fresher",
      personal_info: (data.personalInfo as unknown as Record<string, unknown>) || {},
      summary: data.summary || "",
      coursework: [],
      interests: [],
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return resume;
}

export async function updateResume(id: string, userId: string, data: {
  title?: string;
  template?: string;
  targetLevel?: string;
  personalInfo?: ResumeData["personalInfo"];
  summary?: string;
  coursework?: string[];
  interests?: string[];
}) {
  const supabase = await createServerSupabaseClient();

  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.template !== undefined) updateData.template = data.template;
  if (data.targetLevel !== undefined) updateData.target_level = data.targetLevel;
  if (data.personalInfo !== undefined) updateData.personal_info = data.personalInfo as unknown as Record<string, unknown>;
  if (data.summary !== undefined) updateData.summary = data.summary;
  if (data.coursework !== undefined) updateData.coursework = data.coursework;
  if (data.interests !== undefined) updateData.interests = data.interests;

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
      target_level: resume.targetLevel,
      personal_info: resume.personalInfo as unknown as Record<string, unknown>,
      summary: resume.summary,
      coursework: resume.coursework || [],
      interests: resume.interests || [],
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
    { table: "coding_profiles", data: resume.codingProfiles },
    { table: "leadership", data: resume.leadership },
    { table: "open_source", data: resume.openSource },
    { table: "publications", data: resume.publications },
    { table: "volunteer", data: resume.volunteer },
    { table: "activities", data: resume.activities },
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
    case "languages":
    case "codingProfiles":
    case "leadership":
    case "openSource":
    case "publications":
    case "volunteer":
    case "activities": {
      // Map camelCase section names to snake_case table names
      const tableMap: Record<string, string> = {
        codingProfiles: "coding_profiles",
        openSource: "open_source",
      };
      const tableName = tableMap[sectionType] || sectionType;

      const items = data as Array<Record<string, unknown>>;
      await supabase.from(tableName).delete().eq("resume_id", resumeId);
      if (items.length > 0) {
        const { error } = await supabase.from(tableName).insert(
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
