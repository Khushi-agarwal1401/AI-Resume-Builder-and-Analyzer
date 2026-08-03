import type { ResumeData } from "@/types/resume";

export interface ResumeRow {
  id: string;
  user_id: string;
  title: string;
  template: string;
  target_level: string;
  personal_info: Record<string, unknown>;
  summary: string;
  section_order?: unknown;
  coursework: string[];
  interests: string[];
  custom_sections?: unknown;
  accent_color: string | null;
  font_family: string | null;
  created_at: string;
  updated_at: string;
}

export function mapRowToResumeData(row: ResumeRow & Record<string, unknown>): ResumeData {
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
    sectionOrder: Array.isArray(row.section_order)
      ? (row.section_order as unknown[]).filter((id): id is string => typeof id === "string")
      : [],
    accentColor: row.accent_color ?? null,
    fontFamily: (row.font_family as ResumeData["fontFamily"]) || "sans",
    education: asRows(row.education).map(mapEducationRow),
    experience: asRows(row.experience).map(mapExperienceRow),
    projects: asRows(row.projects).map(mapProjectRow),
    skills: (asRows(row.skills)[0] as unknown as ResumeData["skills"]) || { technical: [], soft: [], tools: [], frameworks: [] },
    certifications: asRows(row.certifications).map((r) => mapIdentityRow<ResumeData["certifications"][number]>(r)),
    achievements: asRows(row.achievements).map((r) => mapIdentityRow<ResumeData["achievements"][number]>(r)),
    languages: asRows(row.languages).map((r) => mapIdentityRow<ResumeData["languages"][number]>(r)),
    codingProfiles: asRows(row.coding_profiles).map((r) => mapIdentityRow<ResumeData["codingProfiles"][number]>(r)),
    leadership: asRows(row.leadership).map(mapLeadershipRow),
    openSource: asRows(row.open_source).map(mapOpenSourceRow),
    publications: asRows(row.publications).map((r) => mapIdentityRow<ResumeData["publications"][number]>(r)),
    volunteer: asRows(row.volunteer).map(mapVolunteerRow),
    activities: asRows(row.activities).map((r) => mapIdentityRow<ResumeData["activities"][number]>(r)),
    coursework: row.coursework || [],
    interests: row.interests || [],
    customSections: mapCustomSections(row.custom_sections),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Coerces the custom_sections JSONB blob into the client shape. Each entry is
 * { title, items: CustomSectionItem[] }; garbage/null entries are dropped and
 * item fields coerced to strings so the builder never receives malformed data.
 */
function mapCustomSections(value: unknown): ResumeData["customSections"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: NonNullable<ResumeData["customSections"]> = {};
  for (const [id, entry] of Object.entries(value as Record<string, unknown>)) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const e = entry as Record<string, unknown>;
    const items = Array.isArray(e.items)
      ? (e.items as Array<Record<string, unknown>>)
          .filter((it) => it && typeof it === "object")
          .map((it) => ({
            id: String(it.id || ""),
            title: typeof it.title === "string" ? it.title : "",
            subtitle: typeof it.subtitle === "string" ? it.subtitle : "",
            date: typeof it.date === "string" ? it.date : "",
            description: typeof it.description === "string" ? it.description : "",
          }))
      : [];
    result[id] = {
      title: typeof e.title === "string" ? e.title : "",
      items,
    };
  }
  return result;
}

function asRows(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? (value as Array<Record<string, unknown>>) : [];
}

function mapEducationRow(row: Record<string, unknown>): ResumeData["education"][number] {
  return {
    id: String(row.id || ""),
    institution: (row.institution as string) || "",
    degree: (row.degree as string) || "",
    field: (row.field as string) || "",
    startDate: (row.start_date as string) || "",
    endDate: (row.end_date as string) || "",
    cgpa: (row.cgpa as string) || "",
    branch: (row.branch as string) || undefined,
    semester: (row.semester as string) || undefined,
    classXII: (row.classXII as string) || undefined,
    classX: (row.classX as string) || undefined,
  };
}

function mapExperienceRow(row: Record<string, unknown>): ResumeData["experience"][number] {
  return {
    id: String(row.id || ""),
    company: (row.company as string) || "",
    role: (row.role as string) || "",
    location: (row.location as string) || "",
    startDate: (row.start_date as string) || "",
    endDate: (row.end_date as string) || "",
    current: Boolean(row.current),
    responsibilities: (row.responsibilities as string[]) || [],
    achievements: (row.achievements as string[]) || [],
  };
}

function mapProjectRow(row: Record<string, unknown>): ResumeData["projects"][number] {
  return {
    id: String(row.id || ""),
    name: (row.name as string) || "",
    description: (row.description as string) || "",
    technologies: (row.technologies as string[]) || [],
    liveUrl: (row.live_url as string) || "",
    githubUrl: (row.github_url as string) || "",
    client: (row.client as string) || undefined,
    teamSize: (row.team_size as string) || undefined,
    impact: (row.impact as string) || undefined,
  };
}

function mapLeadershipRow(row: Record<string, unknown>): ResumeData["leadership"][number] {
  return {
    id: String(row.id || ""),
    title: (row.title as string) || "",
    organization: (row.organization as string) || "",
    startDate: (row.start_date as string) || "",
    endDate: (row.end_date as string) || "",
    description: (row.description as string) || "",
  };
}

function mapOpenSourceRow(row: Record<string, unknown>): ResumeData["openSource"][number] {
  return {
    id: String(row.id || ""),
    projectName: (row.project_name as string) || "",
    role: (row.role as string) || "",
    url: (row.url as string) || "",
    description: (row.description as string) || "",
  };
}

function mapVolunteerRow(row: Record<string, unknown>): ResumeData["volunteer"][number] {
  return {
    id: String(row.id || ""),
    organization: (row.organization as string) || "",
    role: (row.role as string) || "",
    startDate: (row.start_date as string) || "",
    endDate: (row.end_date as string) || "",
    description: (row.description as string) || "",
  };
}

function mapIdentityRow<T>(row: Record<string, unknown>): T {
  return { ...(row as unknown as T), id: String(row.id || "") };
}
