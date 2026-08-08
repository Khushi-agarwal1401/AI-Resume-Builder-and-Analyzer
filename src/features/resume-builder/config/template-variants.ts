import type { ResumeFont } from "@/types/resume";
import type { SectionId } from "./template-section-presets";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TEMPLATE VARIANTS — the product catalog.
 *
 * The app renders 8 visual ARCHETYPES (real React components: ATS Professional,
 * Modern, Student, Minimal, Executive, Creative, Executive Sidebar, Card
 * Modern). The marketplace, however, sells 55+ named TEMPLATE choices. Each
 * template is a VARIANT of one archetype: it reuses the archetype's renderer
 * but ships its own accent color, default font, recommended section order,
 * target roles, and copy.
 *
 * This keeps the system maintainable — 55 templates × 6 exporters is NOT 330
 * implementations. The archetype renders everywhere (web/HTML/PDF/DOCX/TXT/
 * LaTeX) and the variant's theme (accent + font) flows through every exporter.
 *
 * Every variant must be distinct from its siblings in `accent` (so PDFs,
 * LaTeX, and HTML exports differ per template) and honest about `atsFriendly`
 * (sidebar/two-column layouts are never parser-safe).
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** The 9 marketplace categories (spec §3). */
export type TemplateCategory9 =
  | "ats"
  | "modern"
  | "student"
  | "minimal"
  | "executive"
  | "creative"
  | "technical"
  | "academic"
  | "portfolio";

/** The 8 real rendering engines. */
export type ArchetypeId =
  | "ats-professional"
  | "modern"
  | "student"
  | "minimal"
  | "executive"
  | "creative"
  | "executive-sidebar"
  | "modern-card";

export interface TemplateVariant {
  /** Stable kebab-case id, e.g. "ats-software-engineer". */
  id: string;
  /** Marketplace display name, e.g. "ATS Software Engineer". */
  name: string;
  /** The archetype renderer this template renders through. */
  archetype: ArchetypeId;
  /** Primary marketplace category (spec §3). */
  category: TemplateCategory9;
  layout: "single-column" | "two-column" | "sidebar";
  /** Honest ATS compatibility. */
  atsFriendly: boolean;
  /** Role labels from TEMPLATE_ROLE_OPTIONS where possible. */
  targetRoles: string[];
  experienceLevels: ("student" | "entry" | "mid" | "senior" | "executive")[];
  tier: "free" | "premium";
  /** Default accent color (hex). Used when the user hasn't picked one. */
  accent: string;
  /** Default font family. */
  fontFamily: ResumeFont;
  /** Discovery/tag vocabulary (ats-friendly, technical, …). */
  tags: string[];
  description: string;
  /** One-line "best for" pitch. */
  bestFor: string;
  sortOrder: number;
  /** Optional variant-specific recommended structure; falls back to the
   * archetype preset when absent (see template-section-presets). */
  sectionOrder?: SectionId[];
}

export const ARCHETYPE_IDS: ArchetypeId[] = [
  "ats-professional",
  "modern",
  "student",
  "minimal",
  "executive",
  "creative",
  "executive-sidebar",
  "modern-card",
];

/** Category display labels used by the marketplace filter pills. */
export const CATEGORY9_LABELS: Record<TemplateCategory9, string> = {
  ats: "ATS",
  modern: "Modern",
  student: "Student",
  minimal: "Minimal",
  executive: "Executive",
  creative: "Creative",
  technical: "Technical",
  academic: "Academic",
  portfolio: "Portfolio",
};

/* ── The catalog ─────────────────────────────────────────────────────────── */

export const TEMPLATE_VARIANTS: TemplateVariant[] = [
  /* ═══ ATS — all through the ATS Professional archetype (monochrome,
         single-column, parser-first). Variants differ by accent, font, and
         recommended structure; all remain honest atsFriendly. ═══ */
  {
    id: "ats-professional",
    name: "ATS Professional",
    archetype: "ats-professional",
    category: "ats",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: [
      "Software Engineer", "Full Stack Developer", "Finance / Consultant",
      "HR / Recruiter", "Academic / Researcher / Professor", "Student / Intern / Fresher",
    ],
    experienceLevels: ["entry", "mid", "senior"],
    tier: "free",
    accent: "#334155",
    fontFamily: "sans",
    tags: ["ats-friendly", "professional"],
    description:
      "A pure single-column, monochrome layout with standard section headings, gray section bars, and zero icons or graphics. The layout parsers read flawlessly.",
    bestFor: "Candidates of any seniority who must pass automated screening",
    sortOrder: 1,
  },
  {
    id: "ats-classic",
    name: "ATS Classic",
    archetype: "ats-professional",
    category: "ats",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Marketing / Sales", "HR / Recruiter", "Finance / Consultant"],
    experienceLevels: ["mid", "senior"],
    tier: "free",
    accent: "#1f2937",
    fontFamily: "sans",
    tags: ["ats-friendly", "professional"],
    description:
      "The timeless one-page resume: centered masthead, bold uppercase name, and textbook section order. Nothing a parser hasn't seen a thousand times.",
    bestFor: "Traditional industries that still expect a conservative resume",
    sortOrder: 2,
  },
  {
    id: "ats-minimal",
    name: "ATS Minimal",
    archetype: "ats-professional",
    category: "ats",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Product / UX Designer", "Data Scientist / Analyst", "Marketing / Sales"],
    experienceLevels: ["entry", "mid"],
    tier: "free",
    accent: "#111827",
    fontFamily: "sans",
    tags: ["ats-friendly", "minimal"],
    description:
      "A stripped-down parser-friendly single column with generous whitespace and no decoration whatsoever. Maximum signal, minimum noise.",
    bestFor: "Clean-first professionals who still need ATS safety",
    sortOrder: 3,
  },
  {
    id: "ats-software-engineer",
    name: "ATS Software Engineer",
    archetype: "ats-professional",
    category: "technical",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Software Engineer", "Full Stack Developer", "Backend Developer"],
    experienceLevels: ["entry", "mid", "senior"],
    tier: "free",
    accent: "#1e3a8a",
    fontFamily: "sans",
    tags: ["ats-friendly", "technical"],
    description:
      "An ATS-safe single column tuned for engineering keywords: technical skills up front, projects with tech stacks, and a standard experience section.",
    bestFor: "Software engineers who must clear automated screening",
    sortOrder: 4,
  },
  {
    id: "ats-fullstack",
    name: "ATS Full Stack",
    archetype: "ats-professional",
    category: "technical",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Full Stack Developer", "Software Engineer", "Frontend Developer", "Backend Developer"],
    experienceLevels: ["entry", "mid", "senior"],
    tier: "free",
    accent: "#0f766e",
    fontFamily: "sans",
    tags: ["ats-friendly", "technical"],
    description:
      "A parser-first layout that leads with a full-stack skill matrix, then projects and experience. Built for engineers who span frontend and backend.",
    bestFor: "Full stack developers applying to volume-screened roles",
    sortOrder: 5,
  },
  {
    id: "ats-backend",
    name: "ATS Backend",
    archetype: "ats-professional",
    category: "technical",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Backend Developer", "Software Engineer", "Data Engineer"],
    experienceLevels: ["mid", "senior"],
    tier: "free",
    accent: "#166534",
    fontFamily: "sans",
    tags: ["ats-friendly", "technical"],
    description:
      "A single-column, systems-focused layout: architecture, databases, APIs, and performance metrics in a parser-friendly reading order.",
    bestFor: "Backend and systems engineers targeting enterprise hiring pipelines",
    sortOrder: 6,
  },
  {
    id: "ats-frontend",
    name: "ATS Frontend",
    archetype: "ats-professional",
    category: "technical",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Frontend Developer", "Full Stack Developer", "Software Engineer"],
    experienceLevels: ["entry", "mid"],
    tier: "free",
    accent: "#4338ca",
    fontFamily: "sans",
    tags: ["ats-friendly", "technical"],
    description:
      "A clean single column that puts UI engineering skills, component work, and frontend projects in parser-friendly order.",
    bestFor: "Frontend and UI engineers who need ATS-compatible resumes",
    sortOrder: 7,
  },
  {
    id: "ats-devops",
    name: "ATS DevOps",
    archetype: "ats-professional",
    category: "technical",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["DevOps Engineer", "Cloud Engineer", "SRE / Platform Engineer"],
    experienceLevels: ["mid", "senior"],
    tier: "free",
    accent: "#b45309",
    fontFamily: "sans",
    tags: ["ats-friendly", "technical"],
    description:
      "A parser-safe single column for CI/CD, infrastructure, and automation roles — tools and pipelines described in plain text a parser can index.",
    bestFor: "DevOps, SRE, and platform engineers facing automated screens",
    sortOrder: 8,
  },
  {
    id: "ats-cloud",
    name: "ATS Cloud",
    archetype: "ats-professional",
    category: "technical",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Cloud Engineer", "DevOps Engineer", "SRE / Platform Engineer"],
    experienceLevels: ["mid", "senior"],
    tier: "free",
    accent: "#0284c7",
    fontFamily: "sans",
    tags: ["ats-friendly", "technical"],
    description:
      "A single-column layout organized around cloud platforms, certifications, and infrastructure projects — all selectable text.",
    bestFor: "Cloud and infrastructure engineers targeting big-company pipelines",
    sortOrder: 9,
  },
  {
    id: "ats-data-engineer",
    name: "ATS Data Engineer",
    archetype: "ats-professional",
    category: "technical",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Data Engineer", "Data Scientist / Analyst", "Backend Developer"],
    experienceLevels: ["mid", "senior"],
    tier: "free",
    accent: "#15803d",
    fontFamily: "sans",
    tags: ["ats-friendly", "technical"],
    description:
      "A parser-first layout for pipelines, warehouses, and ETL work — skills, tools, and outcomes in standard single-column order.",
    bestFor: "Data engineers and analytics professionals in enterprise screening",
    sortOrder: 10,
  },
  {
    id: "ats-ai-engineer",
    name: "ATS AI Engineer",
    archetype: "ats-professional",
    category: "technical",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["AI Engineer", "Machine Learning Engineer", "Software Engineer"],
    experienceLevels: ["mid", "senior"],
    tier: "free",
    accent: "#7c3aed",
    fontFamily: "sans",
    tags: ["ats-friendly", "technical"],
    description:
      "A conservative single column that lets ML/AI experience, model work, and frameworks shine in plain, parseable text.",
    bestFor: "AI and ML engineers who must still pass ATS filters",
    sortOrder: 11,
  },
  {
    id: "ats-security",
    name: "ATS Security",
    archetype: "ats-professional",
    category: "technical",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Security Engineer", "Cloud Engineer", "SRE / Platform Engineer"],
    experienceLevels: ["mid", "senior"],
    tier: "free",
    accent: "#be123c",
    fontFamily: "sans",
    tags: ["ats-friendly", "technical"],
    description:
      "A no-frills single column for security, compliance, and AppSec roles — certifications and incident outcomes in standard order.",
    bestFor: "Security engineers applying to heavily filtered roles",
    sortOrder: 12,
  },

  /* ═══ MODERN — the split-header archetype. ═══ */
  {
    id: "modern",
    name: "Modern",
    archetype: "modern",
    category: "modern",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: [
      "Software Engineer", "Full Stack Developer", "Product Manager",
      "Marketing / Sales", "Data Scientist / Analyst",
    ],
    experienceLevels: ["entry", "mid", "senior"],
    tier: "free",
    accent: "#2563eb",
    fontFamily: "sans",
    tags: ["modern", "professional", "ats-friendly"],
    description:
      "A balanced single-column layout with a split header, accent rule titles, and left-rule bullets. Modern hierarchy that stays parser-friendly.",
    bestFor: "Software engineers, business, and general roles",
    sortOrder: 20,
  },
  {
    id: "modern-developer",
    name: "Modern Developer",
    archetype: "modern",
    category: "modern",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Software Engineer", "Full Stack Developer", "Frontend Developer"],
    experienceLevels: ["entry", "mid"],
    tier: "free",
    accent: "#0ea5e9",
    fontFamily: "sans",
    tags: ["modern", "technical", "ats-friendly"],
    description:
      "A clean, accent-forward single column that balances a developer's skills, projects, and experience with modern typography.",
    bestFor: "Developers who want a modern look without sacrificing ATS safety",
    sortOrder: 21,
  },
  {
    id: "modern-tech",
    name: "Modern Tech",
    archetype: "modern",
    category: "technical",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Software Engineer", "DevOps Engineer", "Cloud Engineer", "SRE / Platform Engineer"],
    experienceLevels: ["entry", "mid", "senior"],
    tier: "free",
    accent: "#0891b2",
    fontFamily: "sans",
    tags: ["modern", "technical", "ats-friendly"],
    description:
      "A single-column tech layout with a cyan accent and a technical-skills-led hierarchy for engineering and infrastructure roles.",
    bestFor: "Engineers in fast-moving tech companies that use modern ATS",
    sortOrder: 22,
  },
  {
    id: "modern-startup",
    name: "Modern Startup",
    archetype: "modern",
    category: "modern",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Product Manager", "Software Engineer", "Marketing / Sales", "CEO / Founder / Executive"],
    experienceLevels: ["entry", "mid"],
    tier: "free",
    accent: "#f59e0b",
    fontFamily: "sans",
    tags: ["modern", "professional"],
    description:
      "A warm, high-energy single column with an amber accent — built for startup generalists, PMs, and early-stage operators.",
    bestFor: "Startup candidates who wear many hats",
    sortOrder: 23,
  },
  {
    id: "modern-product-engineer",
    name: "Modern Product Engineer",
    archetype: "modern",
    category: "technical",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Product Manager", "Software Engineer", "Product / UX Designer"],
    experienceLevels: ["mid", "senior"],
    tier: "free",
    accent: "#7c3aed",
    fontFamily: "sans",
    tags: ["modern", "technical", "professional"],
    description:
      "A single-column layout that foregrounds shipped products, impact metrics, and cross-functional work — for engineer-PM hybrids.",
    bestFor: "Product-minded engineers and technical PMs",
    sortOrder: 24,
  },
  {
    id: "modern-fullstack",
    name: "Modern Full Stack",
    archetype: "modern",
    category: "technical",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Full Stack Developer", "Software Engineer", "Frontend Developer", "Backend Developer"],
    experienceLevels: ["entry", "mid", "senior"],
    tier: "free",
    accent: "#059669",
    fontFamily: "sans",
    tags: ["modern", "technical", "ats-friendly"],
    description:
      "An emerald-accent single column that gives equal weight to frontend and backend skills, projects, and shipped features.",
    bestFor: "Full stack developers who want modern, balanced styling",
    sortOrder: 25,
  },
  {
    id: "modern-minimal",
    name: "Modern Minimal",
    archetype: "modern",
    category: "minimal",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Product / UX Designer", "Marketing / Sales", "Data Scientist / Analyst"],
    experienceLevels: ["entry", "mid"],
    tier: "free",
    accent: "#64748b",
    fontFamily: "sans",
    tags: ["modern", "minimal", "ats-friendly"],
    description:
      "A restrained take on the Modern archetype — slate accent, quiet dividers, and generous whitespace for a calm, professional feel.",
    bestFor: "Professionals who want modern structure with minimal decoration",
    sortOrder: 26,
  },
  {
    id: "modern-card",
    name: "Card Modern",
    archetype: "modern-card",
    category: "modern",
    layout: "single-column",
    atsFriendly: false,
    targetRoles: ["Product Manager", "Product / UX Designer", "Frontend Developer", "Software Engineer", "Full Stack Developer"],
    experienceLevels: ["entry", "mid"],
    tier: "premium",
    accent: "#6366f1",
    fontFamily: "sans",
    tags: ["modern", "creative", "premium"],
    description:
      "Rounded card sections with colored left borders and skill chips on a soft gray canvas. A fresh product-minded look for tech and product roles.",
    bestFor: "Tech, product, and startup professionals",
    sortOrder: 27,
  },

  /* ═══ STUDENT — the education-first archetype. ═══ */
  {
    id: "student",
    name: "Student",
    archetype: "student",
    category: "student",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Student / Intern / Fresher", "Academic / Researcher / Professor"],
    experienceLevels: ["student", "entry"],
    tier: "free",
    accent: "#059669",
    fontFamily: "sans",
    tags: ["student", "ats-friendly", "academic"],
    description:
      "An education-first layout with a colored header band, academic projects as cards, and skill chips. Built for students and recent graduates.",
    bestFor: "Students, interns, and recent graduates",
    sortOrder: 40,
  },
  {
    id: "student-developer",
    name: "Student Developer",
    archetype: "student",
    category: "technical",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Student / Intern / Fresher", "Software Engineer", "Frontend Developer"],
    experienceLevels: ["student", "entry"],
    tier: "free",
    accent: "#0d9488",
    fontFamily: "sans",
    tags: ["student", "technical", "ats-friendly"],
    description:
      "An education-first developer resume: coursework and projects lead, internship experience and coding profiles support.",
    bestFor: "CS students and bootcamp graduates applying to developer roles",
    sortOrder: 41,
  },
  {
    id: "graduate",
    name: "Graduate",
    archetype: "student",
    category: "student",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Student / Intern / Fresher", "Academic / Researcher / Professor"],
    experienceLevels: ["student", "entry"],
    tier: "free",
    accent: "#0284c7",
    fontFamily: "sans",
    tags: ["student", "academic", "ats-friendly"],
    description:
      "A bright, optimistic layout for new graduates — education first, projects prominent, and internships placed where they matter.",
    bestFor: "Recent graduates entering the full-time job market",
    sortOrder: 42,
  },
  {
    id: "internship",
    name: "Internship",
    archetype: "student",
    category: "student",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Student / Intern / Fresher", "Academic / Researcher / Professor"],
    experienceLevels: ["student", "entry"],
    tier: "free",
    accent: "#f97316",
    fontFamily: "sans",
    tags: ["student", "ats-friendly"],
    description:
      "A warm, approachable layout that makes internships the hero — work experience placed right after education for current students.",
    bestFor: "Students applying for their next internship",
    sortOrder: 43,
  },
  {
    id: "entry-level",
    name: "Entry Level",
    archetype: "student",
    category: "student",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Student / Intern / Fresher", "Software Engineer", "Marketing / Sales"],
    experienceLevels: ["student", "entry"],
    tier: "free",
    accent: "#16a34a",
    fontFamily: "sans",
    tags: ["student", "ats-friendly"],
    description:
      "A green-accent layout for first full-time roles: education, projects, skills, and a focused summary lead the page.",
    bestFor: "Freshers and career changers with little work history",
    sortOrder: 44,
  },
  {
    id: "college-developer",
    name: "College Developer",
    archetype: "student",
    category: "technical",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Student / Intern / Fresher", "Software Engineer", "Full Stack Developer"],
    experienceLevels: ["student", "entry"],
    tier: "free",
    accent: "#4f46e5",
    fontFamily: "sans",
    tags: ["student", "technical"],
    description:
      "A student-engineer resume with indigo energy — coursework, hackathons, and open-source projects above the fold.",
    bestFor: "College students building a developer brand early",
    sortOrder: 45,
  },
  {
    id: "bootcamp-graduate",
    name: "Bootcamp Graduate",
    archetype: "student",
    category: "technical",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Student / Intern / Fresher", "Frontend Developer", "Full Stack Developer"],
    experienceLevels: ["student", "entry"],
    tier: "free",
    accent: "#db2777",
    fontFamily: "sans",
    tags: ["student", "technical"],
    description:
      "A bold, project-led layout for bootcamp grads — capstone projects and certifications carry the story.",
    bestFor: "Bootcamp graduates proving skill through projects",
    sortOrder: 46,
  },

  /* ═══ MINIMAL — the editorial ultra-clean archetype. ═══ */
  {
    id: "minimal",
    name: "Minimal",
    archetype: "minimal",
    category: "minimal",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Product / UX Designer", "Marketing / Sales", "Data Scientist / Analyst", "SRE / Platform Engineer"],
    experienceLevels: ["entry", "mid"],
    tier: "free",
    accent: "#64748b",
    fontFamily: "sans",
    tags: ["minimal", "ats-friendly", "professional"],
    description:
      "Ultra-clean, generous whitespace, thin hairlines, and a light typographic hierarchy. Monochrome and parser-friendly with an editorial calm.",
    bestFor: "Designers, minimalists, and clean-first professionals",
    sortOrder: 60,
  },
  {
    id: "minimal-developer",
    name: "Minimal Developer",
    archetype: "minimal",
    category: "technical",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Software Engineer", "Full Stack Developer", "Frontend Developer"],
    experienceLevels: ["entry", "mid"],
    tier: "free",
    accent: "#475569",
    fontFamily: "sans",
    tags: ["minimal", "technical", "ats-friendly"],
    description:
      "A quiet, monochrome developer resume where skills read like a typed list and experience gets all the breathing room.",
    bestFor: "Engineers who prefer restraint over decoration",
    sortOrder: 61,
  },
  {
    id: "minimal-ats",
    name: "Minimal ATS",
    archetype: "minimal",
    category: "ats",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Software Engineer", "Finance / Consultant", "HR / Recruiter"],
    experienceLevels: ["entry", "mid", "senior"],
    tier: "free",
    accent: "#334155",
    fontFamily: "sans",
    tags: ["minimal", "ats-friendly"],
    description:
      "The cleanest parser-friendly layout in the catalog — a centered monochrome masthead and textbook section order with zero decoration.",
    bestFor: "ATS-paranoid applicants who still want typographic polish",
    sortOrder: 62,
  },
  {
    id: "minimal-one-page",
    name: "Minimal One Page",
    archetype: "minimal",
    category: "minimal",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Product Manager", "Marketing / Sales", "Software Engineer"],
    experienceLevels: ["entry", "mid", "senior"],
    tier: "free",
    accent: "#0f172a",
    fontFamily: "sans",
    tags: ["minimal", "professional", "ats-friendly"],
    description:
      "A disciplined one-page layout with tight leading and hairline rules — everything fits, nothing feels cramped.",
    bestFor: "Candidates with long histories who must stay on one page",
    sortOrder: 63,
  },
  {
    id: "minimal-technical",
    name: "Minimal Technical",
    archetype: "minimal",
    category: "technical",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Software Engineer", "DevOps Engineer", "SRE / Platform Engineer"],
    experienceLevels: ["entry", "mid", "senior"],
    tier: "free",
    accent: "#1e293b",
    fontFamily: "mono",
    tags: ["minimal", "technical", "ats-friendly"],
    description:
      "A monospace take on Minimal — a typewriter-clean developer resume where every label is uppercase and every skill is a line.",
    bestFor: "Terminal-native engineers who like a bit of character",
    sortOrder: 64,
  },
  {
    id: "minimal-executive",
    name: "Minimal Executive",
    archetype: "minimal",
    category: "executive",
    layout: "single-column",
    atsFriendly: false,
    targetRoles: ["Engineering Manager", "Engineering Director / Tech Lead", "CTO / VP Engineering"],
    experienceLevels: ["senior", "executive"],
    tier: "premium",
    accent: "#312e81",
    fontFamily: "serif",
    tags: ["minimal", "executive", "premium"],
    description:
      "A serif, restrained executive layout — leadership summary, quantified achievements, and competencies with an understated indigo accent.",
    bestFor: "Senior leaders who prefer quiet confidence over flash",
    sortOrder: 65,
  },

  /* ═══ EXECUTIVE — serif masthead + leadership sidebar archetypes. ═══ */
  {
    id: "executive",
    name: "Executive",
    archetype: "executive",
    category: "executive",
    layout: "two-column",
    atsFriendly: false,
    targetRoles: ["CEO / Founder / Executive", "Finance / Consultant", "Engineering Director / Tech Lead", "CTO / VP Engineering"],
    experienceLevels: ["senior", "executive"],
    tier: "premium",
    accent: "#312e81",
    fontFamily: "serif",
    tags: ["executive", "premium", "professional"],
    description:
      "A serif, editorial layout with a commanding name header, executive summary block, quantified achievements, and a competencies area.",
    bestFor: "Senior leaders, directors, and C-suite candidates",
    sortOrder: 80,
  },
  {
    id: "executive-sidebar",
    name: "Executive Sidebar",
    archetype: "executive-sidebar",
    category: "executive",
    layout: "sidebar",
    atsFriendly: false,
    targetRoles: ["CTO / VP Engineering", "Engineering Director / Tech Lead", "CEO / Founder / Executive", "Engineering Manager"],
    experienceLevels: ["senior", "executive"],
    tier: "premium",
    accent: "#0f172a",
    fontFamily: "serif",
    tags: ["executive", "premium", "professional"],
    description:
      "A premium two-column layout with a dark slate sidebar for contact, skills, and certifications, and a focused main column for experience and impact.",
    bestFor: "Senior leadership and C-suite candidates",
    sortOrder: 81,
  },
  {
    id: "executive-tech",
    name: "Executive Tech",
    archetype: "executive",
    category: "technical",
    layout: "two-column",
    atsFriendly: false,
    targetRoles: ["Engineering Director / Tech Lead", "CTO / VP Engineering", "Engineering Manager"],
    experienceLevels: ["senior", "executive"],
    tier: "premium",
    accent: "#4338ca",
    fontFamily: "serif",
    tags: ["executive", "technical", "premium"],
    description:
      "A serif leadership layout built for technical executives — architecture ownership, platform strategy, and team scale.",
    bestFor: "Tech leaders moving into director and VP roles",
    sortOrder: 82,
  },
  {
    id: "engineering-manager",
    name: "Engineering Manager",
    archetype: "executive",
    category: "executive",
    layout: "two-column",
    atsFriendly: false,
    targetRoles: ["Engineering Manager", "Engineering Director / Tech Lead"],
    experienceLevels: ["senior", "executive"],
    tier: "premium",
    accent: "#1e40af",
    fontFamily: "serif",
    tags: ["executive", "premium", "professional"],
    description:
      "A leadership layout that foregrounds team size, delivery, hiring, and mentorship alongside hands-on engineering history.",
    bestFor: "Individual contributors and seniors stepping into management",
    sortOrder: 83,
  },
  {
    id: "engineering-director",
    name: "Engineering Director",
    archetype: "executive",
    category: "executive",
    layout: "two-column",
    atsFriendly: false,
    targetRoles: ["Engineering Director / Tech Lead", "CTO / VP Engineering"],
    experienceLevels: ["senior", "executive"],
    tier: "premium",
    accent: "#1e1b4b",
    fontFamily: "serif",
    tags: ["executive", "premium", "professional"],
    description:
      "A formal serif layout for multi-team leadership — org ownership, P&L impact, and transformation programs in boardroom language.",
    bestFor: "Directors and VPs accountable for large engineering orgs",
    sortOrder: 84,
  },
  {
    id: "technical-leader",
    name: "Technical Leader",
    archetype: "executive",
    category: "technical",
    layout: "two-column",
    atsFriendly: false,
    targetRoles: ["Engineering Director / Tech Lead", "Engineering Manager", "CTO / VP Engineering"],
    experienceLevels: ["senior", "executive"],
    tier: "premium",
    accent: "#0f766e",
    fontFamily: "serif",
    tags: ["executive", "technical", "premium"],
    description:
      "A staff-plus leadership layout — architecture decisions, cross-team influence, and system design leadership.",
    bestFor: "Staff, principal, and technical lead track engineers",
    sortOrder: 85,
  },
  {
    id: "cto",
    name: "CTO",
    archetype: "executive-sidebar",
    category: "executive",
    layout: "sidebar",
    atsFriendly: false,
    targetRoles: ["CTO / VP Engineering", "CEO / Founder / Executive"],
    experienceLevels: ["senior", "executive"],
    tier: "premium",
    accent: "#111827",
    fontFamily: "serif",
    tags: ["executive", "premium", "professional"],
    description:
      "A dark-sidebar executive layout for founders and CTOs — vision, platform building, team scale, and board-level communication.",
    bestFor: "Founders and first-time CTOs seeking a commanding presence",
    sortOrder: 86,
  },
  {
    id: "vp-engineering",
    name: "VP Engineering",
    archetype: "executive-sidebar",
    category: "executive",
    layout: "sidebar",
    atsFriendly: false,
    targetRoles: ["CTO / VP Engineering", "Engineering Director / Tech Lead", "CEO / Founder / Executive"],
    experienceLevels: ["executive"],
    tier: "premium",
    accent: "#1e293b",
    fontFamily: "serif",
    tags: ["executive", "premium", "professional"],
    description:
      "A senior-executive sidebar layout emphasizing org transformation, hiring velocity, and multi-team delivery.",
    bestFor: "VPs and GMs running engineering organizations",
    sortOrder: 87,
  },

  /* ═══ CREATIVE — the bold sidebar archetype. ═══ */
  {
    id: "creative",
    name: "Creative",
    archetype: "creative",
    category: "creative",
    layout: "sidebar",
    atsFriendly: false,
    targetRoles: ["Product / UX Designer", "Marketing / Sales"],
    experienceLevels: ["entry", "mid"],
    tier: "free",
    accent: "#db2777",
    fontFamily: "sans",
    tags: ["creative", "modern", "designer"],
    description:
      "A bold sidebar layout with a profile card, skill tags, a timeline of experience, and project cards. Maximum visual identity.",
    bestFor: "Designers, marketers, and creative roles",
    sortOrder: 100,
  },
  {
    id: "creative-developer",
    name: "Creative Developer",
    archetype: "creative",
    category: "technical",
    layout: "sidebar",
    atsFriendly: false,
    targetRoles: ["Frontend Developer", "Product / UX Designer", "Software Engineer"],
    experienceLevels: ["entry", "mid"],
    tier: "free",
    accent: "#ea580c",
    fontFamily: "sans",
    tags: ["creative", "technical", "designer"],
    description:
      "A warm, orange-accent sidebar layout for creative technologists — skills and languages in the rail, experience and projects up front.",
    bestFor: "Frontend engineers, creative coders, and design engineers",
    sortOrder: 101,
  },
  {
    id: "portfolio-developer",
    name: "Portfolio Developer",
    archetype: "creative",
    category: "portfolio",
    layout: "sidebar",
    atsFriendly: false,
    targetRoles: ["Frontend Developer", "Software Engineer", "Product / UX Designer"],
    experienceLevels: ["entry", "mid"],
    tier: "free",
    accent: "#7c3aed",
    fontFamily: "sans",
    tags: ["creative", "portfolio", "technical"],
    description:
      "A project-led sidebar layout built around GitHub work, live demos, and open-source contributions.",
    bestFor: "Developers whose portfolio does the talking",
    sortOrder: 102,
  },
  {
    id: "designer-developer",
    name: "Designer Developer",
    archetype: "creative",
    category: "creative",
    layout: "sidebar",
    atsFriendly: false,
    targetRoles: ["Product / UX Designer", "Frontend Developer"],
    experienceLevels: ["entry", "mid"],
    tier: "free",
    accent: "#c026d3",
    fontFamily: "sans",
    tags: ["creative", "designer"],
    description:
      "A vivid fuchsia sidebar layout for designer-developers — design process, tooling, and shipped interfaces in one visual story.",
    bestFor: "Design engineers and UI developers with a visual eye",
    sortOrder: 103,
  },
  {
    id: "frontend-creative",
    name: "Frontend Creative",
    archetype: "creative",
    category: "technical",
    layout: "sidebar",
    atsFriendly: false,
    targetRoles: ["Frontend Developer", "Product / UX Designer", "Full Stack Developer"],
    experienceLevels: ["entry", "mid"],
    tier: "free",
    accent: "#e11d48",
    fontFamily: "sans",
    tags: ["creative", "technical", "designer"],
    description:
      "A red-accent sidebar layout that pairs frontend engineering depth with visual polish — component work and design systems.",
    bestFor: "Frontend specialists at design-forward companies",
    sortOrder: 104,
  },
  {
    id: "modern-creative",
    name: "Modern Creative",
    archetype: "creative",
    category: "creative",
    layout: "sidebar",
    atsFriendly: false,
    targetRoles: ["Marketing / Sales", "Product / UX Designer"],
    experienceLevels: ["entry", "mid"],
    tier: "free",
    accent: "#9333ea",
    fontFamily: "sans",
    tags: ["creative", "modern"],
    description:
      "A purple-accent sidebar layout that keeps the bold Creative structure while leaning into modern brand work.",
    bestFor: "Modern marketers and brand creatives",
    sortOrder: 105,
  },

  /* ═══ TECHNICAL — dedicated developer templates across archetypes. ═══ */
  {
    id: "software-engineer",
    name: "Software Engineer",
    archetype: "modern",
    category: "technical",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Software Engineer", "Full Stack Developer", "Backend Developer"],
    experienceLevels: ["entry", "mid", "senior"],
    tier: "free",
    accent: "#1d4ed8",
    fontFamily: "sans",
    tags: ["technical", "modern", "ats-friendly"],
    description:
      "The go-to developer resume: balanced single column, technical skills grouped, projects with impact, and standard ATS-safe order.",
    bestFor: "Software engineers of every level",
    sortOrder: 120,
  },
  {
    id: "fullstack-developer",
    name: "Full Stack Developer",
    archetype: "modern",
    category: "technical",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Full Stack Developer", "Software Engineer", "Frontend Developer"],
    experienceLevels: ["entry", "mid"],
    tier: "free",
    accent: "#0d9488",
    fontFamily: "sans",
    tags: ["technical", "modern", "ats-friendly"],
    description:
      "A single-column layout with a teal accent that gives frontend and backend skills equal billing and ships both stacks in projects.",
    bestFor: "Full stack engineers covering the whole product surface",
    sortOrder: 121,
  },
  {
    id: "frontend-developer",
    name: "Frontend Developer",
    archetype: "modern-card",
    category: "technical",
    layout: "single-column",
    atsFriendly: false,
    targetRoles: ["Frontend Developer", "Software Engineer", "Product / UX Designer"],
    experienceLevels: ["entry", "mid"],
    tier: "free",
    accent: "#4f46e5",
    fontFamily: "sans",
    tags: ["technical", "modern", "designer"],
    description:
      "A card-based single column with an indigo accent that showcases UI work, component libraries, and design-system experience.",
    bestFor: "Frontend engineers who want their UI craft to show",
    sortOrder: 122,
  },
  {
    id: "backend-developer",
    name: "Backend Developer",
    archetype: "ats-professional",
    category: "technical",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Backend Developer", "Software Engineer", "Data Engineer"],
    experienceLevels: ["mid", "senior"],
    tier: "free",
    accent: "#14532d",
    fontFamily: "sans",
    tags: ["technical", "ats-friendly"],
    description:
      "A conservative single column for backend engineers — APIs, databases, distributed systems, and reliability metrics.",
    bestFor: "Backend and systems engineers in enterprise screening pipelines",
    sortOrder: 123,
  },
  {
    id: "devops-engineer",
    name: "DevOps Engineer",
    archetype: "modern",
    category: "technical",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["DevOps Engineer", "SRE / Platform Engineer", "Cloud Engineer"],
    experienceLevels: ["mid", "senior"],
    tier: "free",
    accent: "#b45309",
    fontFamily: "sans",
    tags: ["technical", "modern", "ats-friendly"],
    description:
      "An amber-accent layout for automation and delivery — CI/CD pipelines, observability, and infrastructure-as-code.",
    bestFor: "DevOps and automation engineers at modern companies",
    sortOrder: 124,
  },
  {
    id: "cloud-engineer",
    name: "Cloud Engineer",
    archetype: "modern-card",
    category: "technical",
    layout: "single-column",
    atsFriendly: false,
    targetRoles: ["Cloud Engineer", "DevOps Engineer", "SRE / Platform Engineer"],
    experienceLevels: ["mid", "senior"],
    tier: "free",
    accent: "#0284c7",
    fontFamily: "sans",
    tags: ["technical", "modern"],
    description:
      "A card-based layout with a sky-blue accent organized around platforms, certifications, and cost/reliability wins.",
    bestFor: "Cloud engineers at platform-driven companies",
    sortOrder: 125,
  },
  {
    id: "data-engineer",
    name: "Data Engineer",
    archetype: "modern",
    category: "technical",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Data Engineer", "Data Scientist / Analyst", "Backend Developer"],
    experienceLevels: ["mid", "senior"],
    tier: "free",
    accent: "#15803d",
    fontFamily: "sans",
    tags: ["technical", "modern", "ats-friendly"],
    description:
      "A green-accent single column for pipelines, warehouses, and analytics engineering — tools and data volumes front and center.",
    bestFor: "Data and analytics engineers",
    sortOrder: 126,
  },
  {
    id: "machine-learning-engineer",
    name: "Machine Learning Engineer",
    archetype: "modern",
    category: "technical",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Machine Learning Engineer", "AI Engineer", "Data Scientist / Analyst"],
    experienceLevels: ["mid", "senior"],
    tier: "free",
    accent: "#6d28d9",
    fontFamily: "sans",
    tags: ["technical", "modern", "ats-friendly"],
    description:
      "A violet-accent layout for ML work — model development, training pipelines, evaluation, and production deployment.",
    bestFor: "ML engineers bridging research and production",
    sortOrder: 127,
  },
  {
    id: "ai-engineer",
    name: "AI Engineer",
    archetype: "modern-card",
    category: "technical",
    layout: "single-column",
    atsFriendly: false,
    targetRoles: ["AI Engineer", "Machine Learning Engineer", "Software Engineer"],
    experienceLevels: ["mid", "senior"],
    tier: "free",
    accent: "#6d28d9",
    fontFamily: "sans",
    tags: ["technical", "modern"],
    description:
      "A modern card layout for AI product work — LLM apps, agents, RAG systems, and shipped AI features.",
    bestFor: "AI engineers building production AI products",
    sortOrder: 128,
  },
  {
    id: "security-engineer",
    name: "Security Engineer",
    archetype: "ats-professional",
    category: "technical",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Security Engineer", "Cloud Engineer", "SRE / Platform Engineer"],
    experienceLevels: ["mid", "senior"],
    tier: "free",
    accent: "#9f1239",
    fontFamily: "sans",
    tags: ["technical", "ats-friendly"],
    description:
      "A conservative single column for AppSec, compliance, and security engineering — findings, certifications, and incident outcomes.",
    bestFor: "Security engineers in regulated industries",
    sortOrder: 129,
  },
  {
    id: "mobile-developer",
    name: "Mobile Developer",
    archetype: "modern",
    category: "technical",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Mobile Developer", "Software Engineer", "Frontend Developer"],
    experienceLevels: ["entry", "mid"],
    tier: "free",
    accent: "#0e7490",
    fontFamily: "sans",
    tags: ["technical", "modern", "ats-friendly"],
    description:
      "A cyan-accent single column for iOS/Android engineers — shipped apps, stores, SDKs, and mobile-specific metrics.",
    bestFor: "Mobile engineers targeting consumer apps",
    sortOrder: 130,
  },
  {
    id: "platform-engineer",
    name: "Platform Engineer",
    archetype: "modern-card",
    category: "technical",
    layout: "single-column",
    atsFriendly: false,
    targetRoles: ["SRE / Platform Engineer", "DevOps Engineer", "Cloud Engineer"],
    experienceLevels: ["mid", "senior"],
    tier: "free",
    accent: "#475569",
    fontFamily: "sans",
    tags: ["technical", "modern"],
    description:
      "A slate-accent card layout for internal platforms — developer tooling, self-service infrastructure, and adoption metrics.",
    bestFor: "Platform and developer-experience engineers",
    sortOrder: 131,
  },
  {
    id: "sre",
    name: "SRE",
    archetype: "ats-professional",
    category: "technical",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["SRE / Platform Engineer", "DevOps Engineer", "Cloud Engineer"],
    experienceLevels: ["mid", "senior"],
    tier: "free",
    accent: "#0e7490",
    fontFamily: "sans",
    tags: ["technical", "ats-friendly"],
    description:
      "A reliability-first single column — SLOs, incident response, capacity planning, and automation in parser-friendly order.",
    bestFor: "SREs at high-scale, high-blast-radius companies",
    sortOrder: 132,
  },

  /* ═══ ACADEMIC — serif, publication-led layouts. ═══ */
  {
    id: "academic",
    name: "Academic",
    archetype: "minimal",
    category: "academic",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Academic / Researcher / Professor", "Student / Intern / Fresher"],
    experienceLevels: ["student", "senior"],
    tier: "free",
    accent: "#92400e",
    fontFamily: "serif",
    tags: ["academic", "minimal", "ats-friendly"],
    description:
      "A serif, publication-led CV layout — education, research, publications, and teaching in a calm editorial structure.",
    bestFor: "Researchers, lecturers, and pre-PhD students",
    sortOrder: 150,
  },
  {
    id: "researcher",
    name: "Researcher",
    archetype: "ats-professional",
    category: "academic",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Academic / Researcher / Professor", "Data Scientist / Analyst"],
    experienceLevels: ["senior"],
    tier: "free",
    accent: "#92400e",
    fontFamily: "serif",
    tags: ["academic", "ats-friendly"],
    description:
      "A research-first CV: publications, grants, presentations, and projects with a warm serif accent.",
    bestFor: "Researchers applying to labs, institutes, and universities",
    sortOrder: 151,
  },
  {
    id: "phd",
    name: "PhD",
    archetype: "minimal",
    category: "academic",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Academic / Researcher / Professor", "Student / Intern / Fresher"],
    experienceLevels: ["student", "senior"],
    tier: "free",
    accent: "#7c2d12",
    fontFamily: "serif",
    tags: ["academic", "minimal"],
    description:
      "A serif CV for doctoral work — dissertation, research experience, teaching, and publications in a focused single column.",
    bestFor: "PhD candidates and postdocs building an academic record",
    sortOrder: 152,
  },
  {
    id: "scientific",
    name: "Scientific",
    archetype: "ats-professional",
    category: "academic",
    layout: "single-column",
    atsFriendly: true,
    targetRoles: ["Academic / Researcher / Professor", "Data Scientist / Analyst"],
    experienceLevels: ["senior", "executive"],
    tier: "free",
    accent: "#3730a3",
    fontFamily: "serif",
    tags: ["academic", "ats-friendly"],
    description:
      "A formal serif CV for scientific roles — peer-reviewed publications, grants, collaborations, and lab leadership.",
    bestFor: "Scientists and principal investigators in research institutions",
    sortOrder: 153,
  },

  /* ═══ PORTFOLIO — project-led, creative-based layouts. ═══ */
  {
    id: "portfolio",
    name: "Portfolio",
    archetype: "creative",
    category: "portfolio",
    layout: "sidebar",
    atsFriendly: false,
    targetRoles: ["Product / UX Designer", "Frontend Developer", "Software Engineer"],
    experienceLevels: ["entry", "mid"],
    tier: "free",
    accent: "#6d28d9",
    fontFamily: "sans",
    tags: ["portfolio", "creative", "designer"],
    description:
      "A project-first sidebar layout built around case studies, live work, and a strong visual identity.",
    bestFor: "Designers and developers applying with a portfolio",
    sortOrder: 170,
  },
  {
    id: "design-portfolio",
    name: "Design Portfolio",
    archetype: "modern-card",
    category: "portfolio",
    layout: "single-column",
    atsFriendly: false,
    targetRoles: ["Product / UX Designer", "Marketing / Sales"],
    experienceLevels: ["entry", "mid"],
    tier: "free",
    accent: "#c026d3",
    fontFamily: "sans",
    tags: ["portfolio", "creative", "designer"],
    description:
      "A card-based portfolio resume — each project its own card with role, impact, and links, in a fuchsia-accent single column.",
    bestFor: "UX and visual designers with strong case studies",
    sortOrder: 171,
  },
  {
    id: "case-study-portfolio",
    name: "Case Study Portfolio",
    archetype: "creative",
    category: "portfolio",
    layout: "sidebar",
    atsFriendly: false,
    targetRoles: ["Product / UX Designer", "Marketing / Sales", "Frontend Developer"],
    experienceLevels: ["entry", "mid"],
    tier: "free",
    accent: "#be185d",
    fontFamily: "sans",
    tags: ["portfolio", "creative"],
    description:
      "A rose-accent sidebar layout that treats each project like a mini case study — problem, process, and outcome.",
    bestFor: "Portfolio-driven candidates telling project stories",
    sortOrder: 172,
  },
];

/* ── Lookups ─────────────────────────────────────────────────────────────── */

const VARIANT_BY_ID = new Map(TEMPLATE_VARIANTS.map((v) => [v.id, v]));

/** Look up a variant by id (undefined for unknown keys). */
export function getVariant(id: string): TemplateVariant | undefined {
  return VARIANT_BY_ID.get(id);
}

/** Whether a key is a registered variant. */
export function isVariant(id: string): boolean {
  return VARIANT_BY_ID.has(id);
}

/**
 * Resolve any template key to its archetype id. Unknown keys fall back to
 * "modern" so renderers and exporters never throw on legacy/mock data.
 */
export function archetypeForTemplate(id: string): ArchetypeId {
  const v = VARIANT_BY_ID.get(id);
  if (v) return v.archetype;
  // Known archetype ids map to themselves.
  if ((ARCHETYPE_IDS as string[]).includes(id)) return id as ArchetypeId;
  return "modern";
}

/** All registered variant ids (the full marketplace catalog). */
export function allVariantIds(): string[] {
  return TEMPLATE_VARIANTS.map((v) => v.id);
}

/** Display name for a template key (variant name or the key itself). */
export function variantDisplayName(id: string): string {
  return VARIANT_BY_ID.get(id)?.name ?? id;
}

/** Default accent for a template key (falls back to the archetype's). */
export function variantAccent(id: string): string | undefined {
  const v = VARIANT_BY_ID.get(id);
  if (v) return v.accent;
  return undefined;
}

/** Default font family for a template key. */
export function variantFont(id: string): ResumeFont | undefined {
  const v = VARIANT_BY_ID.get(id);
  if (v) return v.fontFamily;
  return undefined;
}

/** Recommended section order override for a variant (archetype preset otherwise). */
export function variantSectionOrder(id: string): SectionId[] | undefined {
  return VARIANT_BY_ID.get(id)?.sectionOrder;
}

/** Category label for a variant key. */
export function variantCategory(id: string): TemplateCategory9 | undefined {
  return VARIANT_BY_ID.get(id)?.category;
}

/** Group variants by category (spec §3) for catalog stats. */
export function variantsByCategory(): Record<TemplateCategory9, TemplateVariant[]> {
  const out = {} as Record<TemplateCategory9, TemplateVariant[]>;
  for (const c of Object.keys(CATEGORY9_LABELS) as TemplateCategory9[]) out[c] = [];
  for (const v of TEMPLATE_VARIANTS) out[v.category].push(v);
  return out;
}
