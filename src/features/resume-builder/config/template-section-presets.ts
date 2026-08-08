import type { TargetLevel } from "@/types/resume";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TEMPLATE SECTION PRESETS — role-aware resume content structure.
 *
 * Every template ships with a recommended section ORDER that matches its
 * archetype (Executive → leadership/achievements first; Academic → education,
 * publications, coursework first; Student → education-first; ATS → parser
 * order). Role keywords and the resume's target level refine that order.
 *
 * This module is pure and renderer-agnostic: it resolves an ordered list of
 * section ids that feeds `resume.sectionOrder`, which the builder form and
 * every template render through `getOrderedSections()`. It is applied ONLY
 * when a resume is created (auto-fill); switching templates later stays
 * non-destructive and never reorders existing content.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Every movable resume section (personalInfo is always pinned first). */
export type SectionId =
  | "summary"
  | "education"
  | "skills"
  | "experience"
  | "projects"
  | "certifications"
  | "achievements"
  | "codingProfiles"
  | "leadership"
  | "openSource"
  | "publications"
  | "volunteer"
  | "activities"
  | "coursework"
  | "languages"
  | "interests";

export interface SectionPreset {
  /** Stable preset id (template key for template presets). */
  id: string;
  /** Short human label, e.g. "Leadership First". */
  label: string;
  /** One-line why-this-structure description. */
  description: string;
  /** Ordered movable section ids (personalInfo excluded — always pinned). */
  sections: SectionId[];
}

/** Canonical display labels for every movable section id. */
export const SECTION_LABELS: Record<SectionId, string> = {
  summary: "Summary",
  education: "Education",
  skills: "Technical Skills",
  experience: "Experience",
  projects: "Projects",
  certifications: "Certifications",
  achievements: "Achievements",
  codingProfiles: "Coding Profiles",
  leadership: "Leadership",
  openSource: "Open Source",
  publications: "Publications",
  volunteer: "Volunteer Experience",
  activities: "Activities",
  coursework: "Relevant Coursework",
  languages: "Languages",
  interests: "Interests",
};

/* ── Template presets (role-appropriate structure per design archetype) ──── */

const TEMPLATE_PRESETS: Record<string, SectionPreset> = {
  "ats-professional": {
    id: "ats-professional",
    label: "Parser First",
    description: "Standard ATS order — summary, experience, skills, education — with every optional section available for keyword coverage.",
    sections: [
      "summary",
      "experience",
      "skills",
      "education",
      "projects",
      "certifications",
      "achievements",
      "openSource",
      "codingProfiles",
      "publications",
      "leadership",
      "volunteer",
      "activities",
      "coursework",
      "languages",
      "interests",
    ],
  },
  modern: {
    id: "modern",
    label: "Balanced Professional",
    description: "A conventional single-column order that reads naturally for software, business, and general roles.",
    sections: [
      "summary",
      "experience",
      "skills",
      "education",
      "projects",
      "certifications",
      "achievements",
      "openSource",
      "codingProfiles",
      "publications",
      "leadership",
      "volunteer",
      "activities",
      "coursework",
      "languages",
      "interests",
    ],
  },
  student: {
    id: "student",
    label: "Education First",
    description: "Education leads for students and graduates, followed by skills, projects, and internship experience.",
    sections: [
      "summary",
      "education",
      "skills",
      "experience",
      "projects",
      "certifications",
      "achievements",
      "coursework",
      "activities",
      "codingProfiles",
      "leadership",
      "languages",
      "interests",
    ],
  },
  minimal: {
    id: "minimal",
    label: "Clean & Focused",
    description: "A sparse, high-whitespace order that highlights experience, education, and skills without clutter.",
    sections: [
      "summary",
      "experience",
      "education",
      "skills",
      "projects",
      "certifications",
      "achievements",
      "languages",
      "interests",
    ],
  },
  executive: {
    id: "executive",
    label: "Leadership First",
    description: "Executive summary, career experience, and quantified achievements lead; competencies and education follow.",
    sections: [
      "summary",
      "experience",
      "achievements",
      "skills",
      "education",
      "certifications",
      "leadership",
      "publications",
      "languages",
      "volunteer",
      "interests",
    ],
  },
  "executive-sidebar": {
    id: "executive-sidebar",
    label: "Leadership Sidebar",
    description: "Main column leads with experience and achievements while the sidebar carries skills, certifications, and languages.",
    sections: [
      "summary",
      "experience",
      "achievements",
      "skills",
      "certifications",
      "education",
      "leadership",
      "publications",
      "languages",
      "interests",
    ],
  },
  "modern-card": {
    id: "modern-card",
    label: "Product Minded",
    description: "Experience and projects up front with skills as chips — a natural order for tech and product roles.",
    sections: [
      "summary",
      "experience",
      "skills",
      "projects",
      "education",
      "certifications",
      "achievements",
      "languages",
      "interests",
    ],
  },
  creative: {
    id: "creative",
    label: "Portfolio First",
    description: "Skills and portfolio projects surface early; experience and education support the visual story.",
    sections: [
      "summary",
      "skills",
      "experience",
      "projects",
      "education",
      "achievements",
      "languages",
      "certifications",
      "interests",
    ],
  },
};

/** Fallback preset for unknown template keys. */
const FALLBACK_PRESET: SectionPreset = TEMPLATE_PRESETS.modern;

/* ── Role refinement rules ────────────────────────────────────────────────── */

interface RoleSectionRule {
  /** Role keyword pattern (matched case-insensitively against the role string). */
  pattern: RegExp;
  /** Sections promoted to the front, in this order. */
  promoteFirst: SectionId[];
}

const ROLE_SECTION_RULES: RoleSectionRule[] = [
  {
    pattern: /\b(academic|researcher|professor|scientist|phd|research|teacher|lecturer|postdoc)\b/i,
    promoteFirst: ["education", "publications", "coursework", "projects"],
  },
  {
    pattern: /\b(executive|director|vp|vice president|cto|chief|founder|head of|principal|partner)\b/i,
    promoteFirst: ["summary", "experience", "achievements", "leadership"],
  },
  {
    pattern: /\b(student|intern|fresher|graduate|entry[- ]level|junior)\b/i,
    promoteFirst: ["education", "skills", "projects", "coursework"],
  },
  {
    pattern: /\b(designer|creative|ux|ui|artist|visual|brand|portfolio)\b/i,
    promoteFirst: ["skills", "projects", "experience", "summary"],
  },
  {
    pattern: /\b(engineer|developer|software|devops|sre|data|cloud|security|platform|ml|machine learning|ai)\b/i,
    promoteFirst: ["summary", "experience", "skills", "projects", "openSource"],
  },
];

/**
 * Move `keys` to the front of `list` (in `keys` order), keeping every other
 * item in its existing relative order. Keys absent from the list are ignored.
 */
function promote(list: SectionId[], keys: SectionId[]): SectionId[] {
  const rest = list.filter((s) => !keys.includes(s));
  const present = keys.filter((k) => list.includes(k));
  return [...present, ...rest];
}

/* ── Public API ───────────────────────────────────────────────────────────── */

/** Preset for a template key (fallback to Modern for unknown keys). */
export function getTemplateSectionPreset(templateId: string): SectionPreset {
  return TEMPLATE_PRESETS[templateId] ?? FALLBACK_PRESET;
}

/** All template presets (8 built-ins). */
export const TEMPLATE_SECTION_PRESETS: SectionPreset[] = Object.values(TEMPLATE_PRESETS);

/** Human labels for a preset's section ids. */
export function presetSectionLabels(preset: SectionPreset): { id: SectionId; label: string }[] {
  return preset.sections.map((id) => ({ id, label: SECTION_LABELS[id] ?? id }));
}

export interface RecommendedSectionOrderOptions {
  /** Free-text role (e.g. "Academic Researcher", "CTO") used to refine the order. */
  role?: string;
  /** Resume target level used to refine the order (education-first for students). */
  targetLevel?: TargetLevel;
}

/**
 * Resolve the recommended section order for a template, refined by the
 * candidate's role and target level. Deterministic and non-destructive: it is
 * meant to auto-fill NEW resumes, never to reorder existing content.
 */
export function getRecommendedSectionOrder(
  templateId: string,
  opts?: RecommendedSectionOrderOptions
): string[] {
  let order = [...getTemplateSectionPreset(templateId).sections];

  const role = (opts?.role || "").trim().toLowerCase();
  if (role) {
    const rule = ROLE_SECTION_RULES.find((r) => r.pattern.test(role));
    if (rule) order = promote(order, rule.promoteFirst);
  }

  const level = opts?.targetLevel;
  if (level === "student" || level === "student_internship" || level === "fresher") {
    order = promote(order, ["education", "skills", "projects", "coursework"]);
  }

  return order;
}
