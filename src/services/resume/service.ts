import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/types";
import type { ResumeData } from "@/types/resume";
import { mapRowToResumeData, type ResumeRow } from "./mapper";

// Typed row shapes for resume writes (typed Supabase clients).
type ResumeInsert = Database["public"]["Tables"]["resumes"]["Insert"];
type ResumeUpdate = Database["public"]["Tables"]["resumes"]["Update"];

// ── Public input types ─────────────────────────────────────────────────────

export interface CreateResumeInput {
  title?: string;
  template?: string;
  targetLevel?: string;
  personalInfo?: ResumeData["personalInfo"];
  summary?: string;
  /** Default true. When false, the profile fetch + section pre-fill is skipped. */
  prefill?: boolean;
  accentColor?: string;
  fontFamily?: string;
}

export interface UpdateResumeInput {
  title?: string;
  template?: string;
  targetLevel?: string;
  personalInfo?: ResumeData["personalInfo"];
  summary?: string;
  coursework?: string[];
  interests?: string[];
  accentColor?: string;
  fontFamily?: string;
  /** Custom section order (builder "Arrange Sections") — stored as section_order JSONB. */
  sectionOrder?: string[];
  /** User-defined custom sections — stored as custom_sections JSONB. */
  customSections?: ResumeData["customSections"];
  /** Pinned to the top of the dashboard (Epic 3, Task 3.1). */
  isPinned?: boolean;
}

// ── Missing-column error helpers ──────────────────────────────────────────
// PostgREST returns PGRST204 ("Could not find the 'X' column ... in the schema
// cache") or a raw 42703 ("column resumes.X does not exist") when the live DB
// predates a migration. Callers retry without the missing column(s).

const THEME_COLUMNS = ["accent_color", "font_family"] as const;

function isMissingColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  return code === "PGRST204" || code === "42703";
}

/** Extract the missing column name from a PostgREST error message, if any. */
function missingColumnFromError(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const message = (error as { message?: string }).message || "";
  const cacheMatch = message.match(/Could not find the '([^']+)' column/);
  if (cacheMatch) return cacheMatch[1];
  const rawMatch = message.match(/column\s+[\w.]+\.(\w+)\s+does not exist/);
  if (rawMatch) return rawMatch[1];
  return null;
}

/** Deep-remove the given column keys from an array of row payloads. */
function stripColumns<T extends object>(rows: T[], columns: readonly string[]): T[] {
  const drop = new Set(columns);
  return rows.map((row) => {
    const next: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) if (!drop.has(k)) next[k] = v;
    return next as T;
  });
}

// ── Reads ──────────────────────────────────────────────────────────────────


export async function getResumes(userId: string): Promise<Array<Record<string, unknown>>> {
  const supabase = await createServerSupabaseClient();

  const query = (columns: string) =>
    supabase
      .from("resumes")
      .select(columns)
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

  // Try successively simpler column lists.
  // This gracefully handles missing columns from older schema versions without
  // failing the entire query.
  const columnTries = [
    "id, title, template, ats_score, view_count, download_count, created_at, updated_at, is_pinned",
    "id, title, template, ats_score, view_count, download_count, created_at, updated_at",
    "id, title, template, ats_score, created_at, updated_at",
    "id, title, template, created_at, updated_at"
  ];

  for (const cols of columnTries) {
    const { data, error } = await query(cols);
    if (error && isMissingColumnError(error)) {
      continue; // Try the next simpler set
    }
    if (error) throw new Error(error.message);
    return (data || []) as unknown as Array<Record<string, unknown>>;
  }

  throw new Error("Failed to load resumes: schema mismatch. Database might be too old.");
}

export async function getResume(id: string, userId: string): Promise<ResumeData> {
  const supabase = await createServerSupabaseClient();

  // Single batched query using Supabase's select(*, related:table(*)) syntax
  // This replaces the previous 7 parallel queries with one round-trip.
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

// ── Writes ─────────────────────────────────────────────────────────────────

export async function createResume(userId: string, data: CreateResumeInput = {}) {
  const supabase = await createServerSupabaseClient();
  const prefill = data.prefill !== false;

  // Optional profile pre-fill: personal info, a factual summary, and initial
  // education/experience/skills rows derived from the onboarding profile.
  let profile: Record<string, unknown> | null = null;
  if (prefill) {
    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    // A failed profile fetch must never block resume creation.
    if (!profileError && profileRow) profile = profileRow as Record<string, unknown>;
  }

  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const profileInfo: ResumeData["personalInfo"] = profile
    ? {
        fullName: str(profile.full_name),
        email: str(profile.email),
        phone: "",
        linkedin: "",
        github: "",
        portfolio: "",
        photo: str(profile.avatar_url),
      }
    : { fullName: "", email: "", phone: "", linkedin: "", github: "", portfolio: "", photo: "" };
  // Client-provided personal info wins over the profile.
  const personalInfo = { ...profileInfo, ...(data.personalInfo || {}) };

  // Factual summary from onboarding facts (only when all three are known).
  let summary = data.summary ?? "";
  if (!summary && profile) {
    const position = str(profile.current_position);
    const industry = str(profile.industry);
    const years = typeof profile.experience_years === "number" ? profile.experience_years : 0;
    if (position && industry) {
      summary = `Experienced ${position} in the ${industry} industry with ${years}+ years of experience.`;
    }
  }

  const buildPayload = (withTheme: boolean): ResumeInsert => {
    const payload: ResumeInsert = {
      user_id: userId,
      title: data.title || "Untitled Resume",
      template: data.template || "modern",
      target_level: data.targetLevel || "fresher",
      personal_info: personalInfo as unknown as Json,
      summary,
      coursework: [],
      interests: [],
    };
    if (withTheme) {
      if (data.accentColor) payload.accent_color = data.accentColor;
      if (data.fontFamily) payload.font_family = data.fontFamily;
    }
    return payload;
  };

  const hasTheme = Boolean(data.accentColor || data.fontFamily);
  let result = await supabase
    .from("resumes")
    .insert(buildPayload(hasTheme))
    .select()
    .single();

  if (result.error && isMissingColumnError(result.error)) {
    // Live DB predates the theme columns (00022) — retry without them.
    result = await supabase
      .from("resumes")
      .insert(buildPayload(false))
      .select()
      .single();
  }
  if (result.error) throw new Error(result.error.message);

  const created = result.data as { id: string };

  // Pre-fill sections from the profile (only for fields actually present, so
  // an empty profile never leaves orphaned rows).
  if (prefill && profile) {
    const college = str(profile.college_name);
    const degree = str(profile.degree);
    const gradYear = str(profile.graduation_year);
    if (college || degree || gradYear) {
      await supabase.from("education").insert([
        {
          institution: college,
          degree,
          field: "",
          start_date: "",
          end_date: gradYear,
          resume_id: created.id,
          sort_order: 0,
        },
      ]);
    }

    const role = str(profile.current_position);
    const company = str(profile.current_company);
    if (role || company) {
      await supabase.from("experience").insert([
        {
          company,
          role,
          location: "",
          start_date: "",
          end_date: "",
          current: true,
          responsibilities: [],
          achievements: [],
          resume_id: created.id,
          sort_order: 0,
        },
      ]);
    }

    const skills = Array.isArray(profile.skills) ? profile.skills : [];
    if (skills.length > 0) {
      await supabase.from("skills").insert([{ technical: skills, resume_id: created.id }]);
    }
  }

  return created;
}

export async function updateResume(id: string, userId: string, data: UpdateResumeInput): Promise<void> {
  const supabase = await createServerSupabaseClient();

  const buildUpdate = (withTheme: boolean): ResumeUpdate => {
    const updateData: ResumeUpdate = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.template !== undefined) updateData.template = data.template;
    if (data.targetLevel !== undefined) updateData.target_level = data.targetLevel;
    if (data.personalInfo !== undefined) updateData.personal_info = data.personalInfo as unknown as Json;
    if (data.summary !== undefined) updateData.summary = data.summary;
    if (data.coursework !== undefined) updateData.coursework = data.coursework;
    if (data.interests !== undefined) updateData.interests = data.interests;
    if (withTheme) {
      if (data.accentColor !== undefined) updateData.accent_color = data.accentColor;
      if (data.fontFamily !== undefined) updateData.font_family = data.fontFamily;
    }
    if (data.sectionOrder !== undefined) updateData.section_order = data.sectionOrder;
    if (data.customSections !== undefined) updateData.custom_sections = data.customSections as unknown as Json;
    if (data.isPinned !== undefined) updateData.is_pinned = data.isPinned;
    return updateData;
  };

  const hasTheme = data.accentColor !== undefined || data.fontFamily !== undefined;
  const { error } = await supabase.from("resumes").update(buildUpdate(hasTheme)).eq("id", id).eq("user_id", userId);

  if (error && isMissingColumnError(error)) {
    // Theme columns are optional cosmetics — a theme-only update against an
    // older schema is a harmless no-op (no empty retry request is sent).
    const withoutTheme = stripColumns([buildUpdate(hasTheme)], THEME_COLUMNS)[0];
    if (Object.keys(withoutTheme).length === 0) return;
    const retry = await supabase.from("resumes").update(withoutTheme).eq("id", id).eq("user_id", userId);
    if (retry.error) throw new Error(retry.error.message);
    return;
  }
  if (error) throw new Error(error.message);
}

export async function deleteResume(id: string, userId: string): Promise<void> {
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

  const buildInsert = (withTheme: boolean): ResumeInsert => {
    const payload: ResumeInsert = {
      user_id: userId,
      title: newTitle || `${resume.title} (Copy)`,
      template: resume.template,
      target_level: resume.targetLevel,
      personal_info: resume.personalInfo as unknown as Json,
      summary: resume.summary,
      coursework: resume.coursework || [],
      interests: resume.interests || [],
      // Custom section order + user-created custom sections must survive a
      // duplicate (K-04) — the builder renders them via section_order/custom_sections.
      section_order: resume.sectionOrder ?? null,
      custom_sections: resume.customSections as unknown as Json,
    };
    if (withTheme) {
      payload.accent_color = resume.accentColor ?? null;
      payload.font_family = resume.fontFamily || "sans";
    }
    return payload;
  };

  let result = await supabase.from("resumes").insert(buildInsert(true)).select().single();
  if (result.error && isMissingColumnError(result.error)) {
    result = await supabase.from("resumes").insert(buildInsert(false)).select().single();
  }
  if (result.error) throw new Error(result.error.message);

  const newId = (result.data as { id: string }).id;

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
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id: _id, resume_id: _rid, created_at, updated_at, ...rest } = item as Record<string, unknown>;
          return { ...rest, resume_id: newId, sort_order: i };
        }) as never[]
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

  return result.data;
}

// ── updateSections (UPSERT-based section writes) ───────────────────────────
//
// Section rows are persisted with a single UPSERT instead of delete-then-
// insert (Phase 3 of the production-hardening work):
//   • Generic sections upsert on `id` — stable client ids are preserved, so a
//     row keeps its identity across saves. Rows the client no longer sends are
//     then deleted (diff-delete), which is the only destructive step and only
//     touches rows the user actually removed.
//   • Skills upsert on `resume_id` (single row per resume, enforced by the
//     unique index in migration 00029).
//   • created_at/updated_at are untouched: section tables have no timestamp
//     columns, and UPSERT only modifies the columns present in the payload.

/**
 * Whitelist of DB columns per section table. Anything the client sends that is
 * not listed here is stripped (non-column fields like teamSize, etc.). camelCase
 * keys are mapped to their snake_case columns. Note that `id` is NOT listed:
 * ids are re-attached separately (see below) so only valid UUIDs pass through.
 */
const SECTION_COLUMNS: Record<string, string[]> = {
  education: ["institution", "degree", "field", "start_date", "end_date", "cgpa", "branch", "semester", "classXII", "classX"],
  experience: ["company", "role", "location", "start_date", "end_date", "current", "responsibilities", "achievements"],
  projects: ["name", "description", "technologies", "live_url", "github_url", "client", "impact"],
  skills: ["technical", "soft", "tools", "frameworks"],
  certifications: ["name", "issuer", "date", "url"],
  achievements: ["title", "description", "date"],
  languages: ["name", "proficiency"],
  coding_profiles: ["platform", "username", "url"],
  leadership: ["title", "organization", "start_date", "end_date", "description"],
  open_source: ["project_name", "role", "url", "description"],
  publications: ["title", "publisher", "date", "url"],
  volunteer: ["organization", "role", "start_date", "end_date", "description"],
  activities: ["title", "description"],
};

const CAMEL_TO_SNAKE: Record<string, string> = {
  startDate: "start_date",
  endDate: "end_date",
  liveUrl: "live_url",
  githubUrl: "github_url",
  projectName: "project_name",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True only for well-formed UUIDs — the only ids Postgres `uuid` accepts. */
function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/** Map one client row to whitelisted snake_case DB columns. */
function mapSectionRow(table: string, row: Record<string, unknown>): Record<string, unknown> {
  const allowed = new Set(SECTION_COLUMNS[table] || []);
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const column = CAMEL_TO_SNAKE[key] ?? key;
    if (allowed.has(column)) result[column] = value;
  }
  return result;
}

export async function updateSections(resumeId: string, userId: string, sectionType: string, data: unknown): Promise<void> {
  const supabase = await createServerSupabaseClient();

  const { data: resume } = await supabase
    .from("resumes")
    .select("id")
    .eq("id", resumeId)
    .eq("user_id", userId)
    .single();

  if (!resume) throw new Error("Resume not found");

  // Map camelCase section names to snake_case table names
  const tableMap: Record<string, string> = {
    codingProfiles: "coding_profiles",
    openSource: "open_source",
  };
  const tableName = tableMap[sectionType] || sectionType;

  if (sectionType === "skills") {
    // Skills persist as a single row per resume (unique on resume_id, 00029).
    const row = mapSectionRow("skills", { ...(data as Record<string, unknown>) });
    const { error } = await supabase
      .from("skills")
      .upsert([{ ...row, resume_id: resumeId }], { onConflict: "resume_id" });
    if (error) throw new Error(error.message);
    return;
  }

  const items = (data as Array<Record<string, unknown>>) || [];
  const rows: Array<Record<string, unknown>> = items.map((item, i) => {
    const mapped = mapSectionRow(tableName, item);
    // Preserve stable ids for UPSERT, but only genuine UUIDs — anything else
    // (generateId()'s non-UUID fallback, LinkedIn import placeholders) is
    // dropped so Postgres generates a fresh id instead of rejecting the row.
    if (isUuid(item.id)) mapped.id = item.id;
    return { ...mapped, resume_id: resumeId, sort_order: i };
  });

  // Existing ids for this resume — used to diff-delete rows the user removed.
  const { data: existingRows } = await supabase
    .from(tableName)
    .select("id")
    .eq("resume_id", resumeId);
  const existingIds = ((existingRows as Array<{ id: unknown }> | null) || [])
    .map((r) => r.id)
    .filter((id): id is string => typeof id === "string");

  const upsertRows = (targetRows: Record<string, unknown>[]) =>
    supabase.from(tableName).upsert(targetRows as unknown as never[], { onConflict: "id" });

  let { error } = await upsertRows(rows);

  if (error && isMissingColumnError(error)) {
    // Extended columns (branch/classXII/etc.) may not exist on an older live
    // schema — strip only the column named in the error and retry, preserving
    // columns that the live DB still has.
    const missingColumn = missingColumnFromError(error);
    const retryRows = missingColumn ? stripColumns(rows, [missingColumn]) : rows;
    const retry = await upsertRows(retryRows);
    if (retry.error) throw new Error(retry.error.message);
    error = null;
  }
  if (error) throw new Error(error.message);

  // Diff-delete: remove only rows the client no longer sends. Rows that were
  // just inserted (no pre-existing id) are not in existingIds, so they survive.
  const incomingIds = new Set(rows.map((r) => r.id).filter(isUuid));
  const removedIds = existingIds.filter((id) => !incomingIds.has(id));
  if (removedIds.length > 0) {
    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .eq("resume_id", resumeId)
      .in("id", removedIds);
    if (deleteError) throw new Error(deleteError.message);
  }
}
