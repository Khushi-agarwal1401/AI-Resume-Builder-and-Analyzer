export interface LinkedInUrlImportResult {
  personalInfo: {
    fullName: string;
    headline: string;
    linkedin: string;
  };
  summary: string;
  education: { institution: string; degree: string; field: string; startDate: string; endDate: string }[];
  experience: {
    company: string;
    role: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    responsibilities: string[];
  }[];
  certifications: { name: string; issuer: string; date: string }[];
  languages: { name: string; proficiency: string }[];
  skills: { technical: string[]; soft: string[]; tools: string[]; frameworks: string[] };
}

const str = (v: unknown): string => (typeof v === "string" ? v : "");

function mapDate(d: unknown): string {
  if (!d || typeof d !== "object") return "";
  const date = d as { day?: number; month?: number; year?: number; raw?: string };
  if (typeof date.raw === "string" && date.raw.trim()) return date.raw.trim();
  if (date.year) return String(date.year);
  if (date.month && date.year) return `${date.month}/${date.year}`;
  return "";
}

function nameOf(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "name" in value) {
    return str((value as { name?: unknown }).name);
  }
  return "";
}

function toResponsibilities(description: unknown): string[] {
  if (typeof description !== "string") return [];
  return description
    .split(/\n+|•|\u2022/)
    .map((s) => s.trim().replace(/^[-–—•·]\s*/, ""))
    .filter(Boolean);
}

function toNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const names: string[] = [];
  for (const item of value) {
    if (typeof item === "string") {
      if (item.trim()) names.push(item.trim());
    } else if (item && typeof item === "object" && "name" in item) {
      const name = (item as { name?: unknown }).name;
      if (typeof name === "string" && name.trim()) names.push(name.trim());
    }
  }
  return names;
}

export function mapProxycurlProfile(raw: unknown, fallbackUrl = ""): LinkedInUrlImportResult {
  const profile = (raw ?? {}) as Record<string, unknown>;
  const arr = (key: string): Array<Record<string, unknown>> =>
    Array.isArray(profile[key]) ? (profile[key] as Array<Record<string, unknown>>) : [];

  const education = arr("education")
    .map((e) => ({
      institution: nameOf(e.school),
      degree: str(e.degree_name),
      field: str(e.field_of_study),
      startDate: mapDate(e.starts_at),
      endDate: mapDate(e.ends_at),
    }))
    .filter((e) => e.institution || e.degree || e.field);

  const experience = arr("experiences")
    .map((x) => ({
      company: nameOf(x.company),
      role: str(x.title),
      location: str(x.location),
      startDate: mapDate(x.starts_at),
      endDate: mapDate(x.ends_at),
      current: !x.ends_at,
      responsibilities: toResponsibilities(x.description),
    }))
    .filter((x) => x.company || x.role);

  const certifications = arr("certifications")
    .map((c) => ({
      name: str(c.name),
      issuer: str(c.authority),
      date: mapDate(c.starts_at) || mapDate(c.ends_at),
    }))
    .filter((c) => c.name);

  const rawLanguages = Array.isArray(profile.languages) ? (profile.languages as unknown[]) : [];
  const languages = rawLanguages
    .map((l) =>
      typeof l === "string"
        ? { name: l, proficiency: "" }
        : {
            name: str((l as { name?: unknown })?.name),
            proficiency: str((l as { proficiency?: unknown })?.proficiency),
          }
    )
    .filter((l) => l.name);

  const skills = toNames(profile.skills);

  return {
    personalInfo: {
      fullName: str(profile.full_name) || "LinkedIn User",
      headline: str(profile.headline),
      linkedin: str(profile.linkedin_profile_url) || fallbackUrl,
    },
    summary: str(profile.summary),
    education,
    experience,
    certifications,
    languages,
    skills: { technical: skills, soft: [], tools: [], frameworks: [] },
  };
}
