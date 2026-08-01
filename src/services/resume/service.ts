import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ResumeData, TargetLevel } from "@/types/resume";
import { computeResumeCompletion, type ResumeListItem } from "./completion";
import { DEFAULT_FONT_BY_TEMPLATE } from "@/features/resume-builder/templates/theme";
import { mapRowToResumeData, type ResumeRow } from "./mapper";

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

/**
 * Returns the user's resumes enriched with a completion summary
 * (percentage, missing sections, estimated time to finish).
 */
export async function getResumesWithCompletion(userId: string): Promise<ResumeListItem[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("resumes")
    .select("id, title, template, target_level, ats_score, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  const rows = data || [];

  // Fetch full data per resume to compute section-level completion.
  const items = await Promise.all(
    rows.map(async (row) => {
      const targetLevel = (row as { target_level?: string }).target_level as TargetLevel || "fresher";
      try {
        const resume = await getResume(row.id, userId);
        return {
          id: row.id,
          title: row.title,
          template: row.template,
          targetLevel: resume.targetLevel || targetLevel,
          created_at: row.created_at,
          updated_at: row.updated_at,
          ats_score: (row as { ats_score?: number | null }).ats_score ?? null,
          completion: computeResumeCompletion(resume),
        };
      } catch (err) {
        // Fallback if a resume row is missing data: report a minimal item.
        console.error(`Failed to compute completion for resume ${row.id}`, err);
        return {
          id: row.id,
          title: row.title,
          template: row.template,
          targetLevel,
          created_at: row.created_at,
          updated_at: row.updated_at,
          ats_score: (row as { ats_score?: number | null }).ats_score ?? null,
          completion: { percentage: 0, missing: [], estimatedMinutes: 0 },
        };
      }
    })
  );

  return items;
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
  accentColor?: string | null;
  fontFamily?: string;
}) {
  const supabase = await createServerSupabaseClient();

  const { data: resume, error } = await insertResumeRow(supabase, {
    user_id: userId,
    title: data.title || "Untitled Resume",
    template: data.template || "modern",
    target_level: data.targetLevel || "fresher",
    personal_info: (data.personalInfo as unknown as Record<string, unknown>) || {},
    summary: data.summary || "",
    accent_color: data.accentColor ?? null,
    font_family: data.fontFamily || DEFAULT_FONT_BY_TEMPLATE[(data.template as ResumeData["template"]) || "modern"],
    coursework: [],
    interests: [],
  });

  if (error) throw new Error(error.message);
  return resume;
}

export async function updateResume(id: string, userId: string, data: {
  title?: string;
  template?: string;
  targetLevel?: string;
  personalInfo?: ResumeData["personalInfo"];
  summary?: string;
  accentColor?: string | null;
  fontFamily?: string;
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
  if (data.accentColor !== undefined) updateData.accent_color = data.accentColor ?? null;
  if (data.fontFamily !== undefined) updateData.font_family = data.fontFamily;
  if (data.coursework !== undefined) updateData.coursework = data.coursework;
  if (data.interests !== undefined) updateData.interests = data.interests;

  const { error } = await updateResumeRow(supabase, id, userId, updateData);
  if (error) throw new Error(error.message);
}

function isMissingColumnError(error: { code?: string; message?: string } | null): boolean {
  return !!error && (error.code === "PGRST204" || error.code === "42703" || (error.message ?? "").includes("42703"));
}

/**
 * Theme columns added by migration 00022 that may be absent from the live DB
 * until the migration is applied (PGRST204/42703). Every resumes-table write
 * path drops these on retry so Create/Edit/Duplicate keep working.
 */
const THEME_COLUMNS = ["accent_color", "font_family"] as const;

/**
 * Inserts a row into the resumes table, retrying once without the theme
 * columns if the live DB doesn't have them yet (migrations 00022/00023
 * unapplied → PGRST204/42703).
 */
async function insertResumeRow(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  payload: Record<string, unknown>
) {
  let result = await supabase.from("resumes").insert(payload).select().single();
  if (result.error && isMissingColumnError(result.error)) {
    const fallback = { ...payload };
    for (const col of THEME_COLUMNS) delete fallback[col];
    result = await supabase.from("resumes").insert(fallback).select().single();
  }
  return result;
}

/**
 * Updates a row in the resumes table, retrying once without the theme columns
 * if the live DB doesn't have them yet (PGRST204/42703). A theme-only update
 * becomes a successful no-op since there is nothing left to persist.
 */
async function updateResumeRow(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  id: string,
  userId: string,
  updateData: Record<string, unknown>
) {
  let result = await supabase
    .from("resumes")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", userId);
  if (result.error && isMissingColumnError(result.error)) {
    const fallback = { ...updateData };
    for (const col of THEME_COLUMNS) delete fallback[col];
    if (Object.keys(fallback).length === 0) return { data: null, error: null };
    result = await supabase
      .from("resumes")
      .update(fallback)
      .eq("id", id)
      .eq("user_id", userId);
  }
  return result;
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

  // Create the new resume (falls back without the theme columns if the live
  // DB doesn't have them yet — see insertResumeRow).
  const { data: newResume, error: createError } = await insertResumeRow(supabase, {
    user_id: userId,
    title: newTitle || `${resume.title} (Copy)`,
    template: resume.template,
    target_level: resume.targetLevel,
    personal_info: resume.personalInfo as unknown as Record<string, unknown>,
    summary: resume.summary,
    accent_color: resume.accentColor ?? null,
    font_family: resume.fontFamily || "sans",
    coursework: resume.coursework || [],
    interests: resume.interests || [],
  });

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
      // Map the camelCase keys back to snake_case DB columns so the copy
      // round-trips exactly like updateSections does.
      const sectionKey = sectionKeyFromTable(table);
      await insertSectionRows(
        supabase,
        table,
        (items as unknown as Record<string, unknown>[]).map((item, i) => ({
          ...mapSectionToColumns(sectionKey, item),
          resume_id: newId,
          sort_order: i,
        }))
      );
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
      const tableName = tableFromSectionKey(sectionType);

      const items = Array.isArray(data) ? (data as Array<Record<string, unknown>>) : [];
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq("resume_id", resumeId);
      if (deleteError) throw new Error(deleteError.message);
      if (items.length > 0) {
        await insertSectionRows(
          supabase,
          tableName,
          items.map((item, i) => ({
            ...mapSectionToColumns(sectionType, item),
            resume_id: resumeId,
            sort_order: i,
          }))
        );
      }
      break;
    }
    case "skills": {
      const { error: deleteError } = await supabase
        .from("skills")
        .delete()
        .eq("resume_id", resumeId);
      if (deleteError) throw new Error(deleteError.message);
      const mapped = mapSectionToColumns("skills", (data ?? {}) as Record<string, unknown>);
      await insertSectionRows(supabase, "skills", [{ ...mapped, resume_id: resumeId }]);
      break;
    }
    default:
      throw new Error("Invalid section type");
  }
}

/**
 * Client sections use camelCase field names (e.g. startDate, liveUrl) while
 * the DB tables use snake_case columns (start_date, live_url). This whitelist
 * maps client keys to DB columns and drops anything without a column (e.g.
 * client-generated `id`, or fields like `teamSize` that have no column yet).
 */
const SECTION_COLUMN_WHITELISTS: Record<string, Record<string, string>> = {
  education: {
    institution: "institution", degree: "degree", field: "field",
    startDate: "start_date", endDate: "end_date", cgpa: "cgpa",
    branch: "branch", semester: "semester",
    classXII: "classXII", classX: "classX",
  },
  experience: {
    company: "company", role: "role", location: "location",
    startDate: "start_date", endDate: "end_date", current: "current",
    responsibilities: "responsibilities", achievements: "achievements",
  },
  projects: {
    name: "name", description: "description", technologies: "technologies",
    liveUrl: "live_url", githubUrl: "github_url",
    client: "client", impact: "impact",
  },
  skills: {
    technical: "technical", soft: "soft", tools: "tools", frameworks: "frameworks",
  },
  certifications: { name: "name", issuer: "issuer", date: "date", url: "url" },
  achievements: { title: "title", description: "description", date: "date" },
  languages: { name: "name", proficiency: "proficiency" },
  codingProfiles: { platform: "platform", url: "url", handle: "handle" },
  leadership: {
    title: "title", organization: "organization",
    startDate: "start_date", endDate: "end_date", description: "description",
  },
  openSource: { projectName: "project_name", role: "role", url: "url", description: "description" },
  publications: { title: "title", publisher: "publisher", date: "date", url: "url", description: "description" },
  volunteer: {
    organization: "organization", role: "role",
    startDate: "start_date", endDate: "end_date", description: "description",
  },
  activities: { title: "title", description: "description", date: "date" },
};

/**
 * Columns that only exist in some deployments (added via later/live DB
 * migrations) but are absent from the repo's baseline migration 00001. These
 * are the whitelisted columns (see SECTION_COLUMN_WHITELISTS) that may be
 * missing at runtime. Keep this set in sync with any extended entries added
 * to the whitelists — it's the fallback safety net below.
 */
const EXTENDED_SECTION_COLUMNS = new Set(["branch", "semester", "classXII", "classX", "client", "impact"]);

/**
 * Extracts the offending column names from a PostgREST missing-column error,
 * e.g. `Could not find the 'branch' column of 'education' in the schema cache.`
 */
function missingColumnsFromError(message: string): string[] {
  const matches = [...message.matchAll(/Could not find the '([a-zA-Z_][a-zA-Z0-9_]*)' column/g)];
  return matches.map((m) => m[1]);
}

/**
 * Inserts rows into a section table, retrying once without the offending
 * extended columns if the first insert fails because the live DB doesn't have
 * them (PGRST204). Only the columns named in the error are dropped, so data
 * for columns that DO exist is still persisted.
 */
async function insertSectionRows(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  tableName: string,
  rows: Array<Record<string, unknown>>
) {
  let result = await supabase.from(tableName).insert(rows);
  if (result.error && isMissingColumnError(result.error)) {
    const parsed = missingColumnsFromError(result.error.message ?? "");
    const offending = parsed.length > 0 ? new Set(parsed) : EXTENDED_SECTION_COLUMNS;
    const fallbackRows = rows.map((row) => {
      const next = { ...row };
      for (const col of offending) delete next[col];
      return next;
    });
    result = await supabase.from(tableName).insert(fallbackRows);
  }
  if (result.error) throw new Error(result.error.message);
}

function mapSectionToColumns(sectionType: string, item: Record<string, unknown>): Record<string, unknown> {
  const whitelist = SECTION_COLUMN_WHITELISTS[sectionType] || {};
  const columns = new Set(Object.values(whitelist));
  const mapped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(item)) {
    // Accept both camelCase client keys (startDate → start_date) and keys that
    // are already the exact DB column name (e.g. LinkedIn import sends start_date).
    const column = whitelist[key] ?? (columns.has(key) ? key : undefined);
    if (column) mapped[column] = value;
  }
  return mapped;
}

/**
 * Client section keys (camelCase, e.g. codingProfiles) → snake_case table name.
 * Shared by updateSections so the write path and duplicateResume can't drift.
 */
const SECTION_KEY_TO_TABLE: Record<string, string> = {
  codingProfiles: "coding_profiles",
  openSource: "open_source",
};

function tableFromSectionKey(sectionType: string): string {
  return SECTION_KEY_TO_TABLE[sectionType] || sectionType;
}

function sectionKeyFromTable(table: string): string {
  return Object.entries(SECTION_KEY_TO_TABLE).find(([, t]) => t === table)?.[0] || table;
}
