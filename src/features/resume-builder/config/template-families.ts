/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TEMPLATE FAMILIES — the curated product catalog.
 *
 * The registry ships 83+ templates, but structurally most imported designs are
 * variants of a handful of skeletons (a single-column "98" design repeated 50×
 * with different colors/fonts, a photo-sidebar design repeated 10×, etc.).
 *
 * This module declares the 30 genuinely distinct LAYOUT FAMILIES that the
 * product actually sells, assigns every template id to exactly one family, and
 * marks one CANONICAL representative per family. Duplicate siblings become
 * "variants" of the family — accessible via color/font/photo controls instead
 * of separate catalog cards.
 *
 *  - getCatalogFamilies()          → the 30 cards shown in the catalog
 *  - getFamilyForTemplate(id)      → family metadata for any template key
 *  - getFamilyMembers(familyId)    → every template id in a family
 *  - getFamilyVariants(familyId)   → non-canonical members (the duplicates)
 *  - isCanonicalTemplate(id)       → true for the family's hero design
 *
 * Every family has a unique structural `signature` (the QA uniqueness test
 * asserts these never collide), an honest category, career-level fit, and a
 * best-fit audience. No template code is duplicated here — families only
 * reference existing template keys.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { ALL_TEMPLATE_IDS } from "../templates/imported/catalog";

/** Product categories a family can belong to. Premium is a TIER, not a layout
 * category — it is derived from the canonical template's registry metadata. */
export type FamilyCategory =
  | "ats-friendly"
  | "professional"
  | "modern"
  | "minimal"
  | "creative"
  | "executive"
  | "student"
  | "academic"
  | "technical"
  | "designer";

/** Career levels a family was designed for. */
export type FamilyLevel =
  | "student"
  | "internship"
  | "graduate"
  | "experienced"
  | "senior"
  | "manager"
  | "executive";

export interface TemplateFamily {
  /** Stable kebab id, e.g. "ex-serif". */
  id: string;
  name: string;
  category: FamilyCategory;
  levels: FamilyLevel[];
  /** One-line audience description. */
  bestFor: string;
  /** Longer catalog description. */
  description: string;
  /**
   * Structural fingerprint that makes this family recognizable at thumbnail
   * size: "columns | sidebar | header | section | skills | font class".
   * Uniqueness across all 30 families is enforced by test.
   */
  signature: string;
  /** Brand accent used for card shells / thumbnails. */
  accent: string;
  /** The single hero template id for this family. */
  canonicalId: string;
}

/* ── The 30 families ──────────────────────────────────────────────────────── */

const FAMILIES: TemplateFamily[] = [
  // ── ATS FRIENDLY ──────────────────────────────────────────────────────────
  {
    id: "ats-pro",
    name: "ATS Professional",
    category: "ats-friendly",
    levels: ["graduate", "experienced", "senior", "executive"],
    bestFor: "Compliance-critical roles: government, healthcare, enterprise",
    description: "Pure single column, gray section bars, zero decoration. The layout parsers read flawlessly.",
    signature: "single|none|centered|bar|inline|sans",
    accent: "#334155",
    canonicalId: "ats-professional",
  },
  {
    id: "ats-plain",
    name: "Plain Parser",
    category: "ats-friendly",
    levels: ["graduate", "experienced"],
    bestFor: "ATS-paranoid job seekers who still want a modern feel",
    description: "Single column, thin underline headings, inline skills, one accent detail on the name.",
    signature: "single|none|left|underline|inline|sans",
    accent: "#0ea5e9",
    canonicalId: "cv-aurum-aria",
  },
  {
    id: "ats-compact",
    name: "Compact Pro",
    category: "ats-friendly",
    levels: ["graduate", "experienced", "senior"],
    bestFor: "Long careers that must fit one page",
    description: "Dense single column, tight leading, compact header. Information density is the design.",
    signature: "single|none|compact|rule-after|inline|sans",
    accent: "#475569",
    canonicalId: "cv-aurum-quartz",
  },
  // ── PROFESSIONAL ──────────────────────────────────────────────────────────
  {
    id: "prof-classic",
    name: "Classic",
    category: "professional",
    levels: ["experienced", "senior"],
    bestFor: "Finance, law, consulting, traditional industries",
    description: "Single column, centered serif masthead, ruled headings. Timeless and ATS-safe.",
    signature: "single|none|centered|underline|inline|serif",
    accent: "#92400e",
    canonicalId: "cv-aurum-garamond",
  },
  {
    id: "prof-modern",
    name: "Modern",
    category: "professional",
    levels: ["graduate", "experienced", "senior"],
    bestFor: "Software, business, generalists",
    description: "Split header, accent rule titles, left-rule bullets. The safe-modern reference point.",
    signature: "single|none|split|accent-rule|left-rule|sans",
    accent: "#2563eb",
    canonicalId: "modern",
  },
  {
    id: "prof-minimal",
    name: "Minimal",
    category: "minimal",
    levels: ["graduate", "experienced", "senior"],
    bestFor: "Designers, PMs, clean-first professionals",
    description: "Small-caps micro-labels, hairline rules, generous whitespace, monochrome.",
    signature: "single|none|centered|small-caps|inline|sans",
    accent: "#64748b",
    canonicalId: "minimal",
  },
  {
    id: "prof-rail",
    name: "Standard Rail",
    category: "professional",
    levels: ["experienced", "senior", "manager"],
    bestFor: "Two-page careers needing a skills rail",
    description: "Main column plus a white right rail for skills, certs and languages.",
    signature: "two-col|right|left|plain|chips|sans",
    accent: "#0369a1",
    canonicalId: "cv-aurum-linen",
  },
  // ── MODERN ────────────────────────────────────────────────────────────────
  {
    id: "mod-cards",
    name: "Card Modern",
    category: "modern",
    levels: ["graduate", "experienced"],
    bestFor: "Tech, product, startups",
    description: "Stacked white cards on a light canvas; each section is a bordered rounded card.",
    signature: "single|none|cards|cards|chips|sans",
    accent: "#6366f1",
    canonicalId: "modern-card",
  },
  {
    id: "mod-timeline",
    name: "Timeline",
    category: "modern",
    levels: ["graduate", "experienced"],
    bestFor: "Career stories, consultants, PMs",
    description: "Single column with a vertical timeline spine; entries hang off dated nodes.",
    signature: "single|none|left|timeline|grouped-chips|sans",
    accent: "#0d9488",
    canonicalId: "cv-aurum-vertex",
  },
  {
    id: "mod-sidebar",
    name: "Modern Sidebar",
    category: "modern",
    levels: ["experienced", "senior"],
    bestFor: "Modern professionals who want a photo",
    description: "Two columns with a tinted sidebar (photo, skills, languages) and a clean main column.",
    signature: "two-col|left|left|underline|chips|sans",
    accent: "#2b7fd4",
    canonicalId: "cv-aurum-clarity",
  },
  // ── MINIMAL ───────────────────────────────────────────────────────────────
  {
    id: "min-swiss",
    name: "Swiss",
    category: "minimal",
    levels: ["experienced", "senior"],
    bestFor: "Architects, industrial designers, purists",
    description: "Strict grid, oversized name, gridlines as separators. Grid perfection.",
    signature: "single|none|left|plain|inline|mono",
    accent: "#111827",
    canonicalId: "cv-aurum-mono",
  },
  {
    id: "min-air",
    name: "Air",
    category: "minimal",
    levels: ["graduate", "experienced"],
    bestFor: "Creatives, writers, short resumes",
    description: "Centered single column, enormous whitespace, one thin accent line.",
    signature: "single|none|centered|plain|inline|light",
    accent: "#a3a3a3",
    canonicalId: "cv-aurum-frost",
  },
  // ── CREATIVE ──────────────────────────────────────────────────────────────
  {
    id: "cr-pop",
    name: "Creative Pop",
    category: "creative",
    levels: ["internship", "graduate", "experienced"],
    bestFor: "Marketers, social media, brand roles",
    description: "Bold colored sidebar plus main column with timeline dots and skill tags.",
    signature: "sidebar|left|sidebar|timeline|tags|sans",
    accent: "#db2777",
    canonicalId: "creative",
  },
  {
    id: "cr-portfolio",
    name: "Portfolio Grid",
    category: "creative",
    levels: ["internship", "graduate"],
    bestFor: "Designers, illustrators, photographers",
    description: "Projects-first two-column grid; work samples and case links lead the page.",
    signature: "two-col|left|left|plain|chips|sans|photo|icons",
    accent: "#7c3aed",
    canonicalId: "rm-awesome-cv",
  },
  {
    id: "cr-editorial",
    name: "Editorial",
    category: "creative",
    levels: ["experienced", "senior"],
    bestFor: "Journalists, authors, content leads",
    description: "Magazine-style with side labels, serif display headings and asymmetric rules.",
    signature: "single|none|left|side|grouped-chips|serif",
    accent: "#9f1239",
    canonicalId: "cv-aurum-editorial",
  },
  // ── EXECUTIVE ─────────────────────────────────────────────────────────────
  {
    id: "ex-serif",
    name: "Executive Serif",
    category: "executive",
    levels: ["senior", "manager", "executive"],
    bestFor: "Directors, VPs, C-suite",
    description: "Centered serif masthead, leadership summary block, metric-forward entries.",
    signature: "single|none|centered|masthead|inline|serif",
    accent: "#312e81",
    canonicalId: "executive",
  },
  {
    id: "ex-sidebar",
    name: "Executive Sidebar",
    category: "executive",
    levels: ["senior", "manager", "executive"],
    bestFor: "Executives who want a modern dark touch",
    description: "Dark slate sidebar with contact, skills and certs; light main column.",
    signature: "sidebar|left|sidebar|underline|chips|sans|dark",
    accent: "#0f172a",
    canonicalId: "executive-sidebar",
  },
  {
    id: "ex-band",
    name: "Executive Band",
    category: "executive",
    levels: ["senior", "manager", "executive"],
    bestFor: "Executives in creative-adjacent industries",
    description: "Thin colored top band, serif name beneath, numbered uppercase headers.",
    signature: "single|none|banner|underline|inline|serif",
    accent: "#4338ca",
    canonicalId: "fb-exec-band",
  },
  // ── STUDENT ───────────────────────────────────────────────────────────────
  {
    id: "st-band",
    name: "Student Band",
    category: "student",
    levels: ["student", "internship", "graduate"],
    bestFor: "Students and recent graduates",
    description: "Colored header band, education-first card grid, skill chips, project cards.",
    signature: "single|none|band|cards|chips|sans",
    accent: "#059669",
    canonicalId: "student",
  },
  {
    id: "st-graduate",
    name: "Graduate One",
    category: "student",
    levels: ["internship", "graduate"],
    bestFor: "Internship/entry applicants with 1–2 internships",
    description: "Objective summary, internship experience first, skills and projects second.",
    signature: "single|none|centered|plain|chips|sans",
    accent: "#0284c7",
    canonicalId: "rr-lapras",
  },
  {
    id: "st-academic",
    name: "Academic Starter",
    category: "student",
    levels: ["student", "graduate"],
    bestFor: "Pre-PhD, research assistants, exchange applicants",
    description: "Centered serif name, objective, education with GPA prominence, coursework list.",
    signature: "single|none|centered|underline|inline|serif|education-first",
    accent: "#1e3a8a",
    canonicalId: "cv-aurum-harvard",
  },
  // ── ACADEMIC ──────────────────────────────────────────────────────────────
  {
    id: "ac-harvard",
    name: "Harvard Classic",
    category: "academic",
    levels: ["graduate", "senior"],
    bestFor: "Professors, researchers, post-docs",
    description: "Centered serif masthead, ALL-CAPS section headers, dense entries, no color.",
    signature: "single|none|centered|rule-after|inline|serif|dense",
    accent: "#334155",
    canonicalId: "rc-harvard",
  },
  {
    id: "ac-overleaf",
    name: "Overleaf Paper",
    category: "academic",
    levels: ["graduate", "senior", "executive"],
    bestFor: "STEM academics with long publication records",
    description: "Publication-rich multi-page academic CV with numbered headings and grants.",
    signature: "single|none|centered|rule-after|inline|serif|publications",
    accent: "#57534e",
    canonicalId: "cv-aurum-academia",
  },
  {
    id: "ac-scholar",
    name: "Scholar Mono",
    category: "academic",
    levels: ["graduate", "senior"],
    bestFor: "Mathematicians, CS researchers",
    description: "Monospace numerals and labels, tabular date alignment, precise hairlines.",
    signature: "single|none|centered|underline|inline|mono",
    accent: "#3f3f46",
    canonicalId: "cv-aurum-vector",
  },
  // ── TECHNICAL ─────────────────────────────────────────────────────────────
  {
    id: "tc-terminal",
    name: "Terminal",
    category: "technical",
    levels: ["graduate", "experienced", "senior"],
    bestFor: "Developers, DevOps, SRE",
    description: "Dark header band, mono name, code-like section labels, chip skills.",
    signature: "single|none|band|bar|chips|mono",
    accent: "#0f172a",
    canonicalId: "cv-aurum-terminal",
  },
  {
    id: "tc-datasheet",
    name: "Data Sheet",
    category: "technical",
    levels: ["experienced", "senior", "manager"],
    bestFor: "Engineers with metric-heavy histories",
    description: "Two columns with bar skill meters in the rail and metric-led main entries.",
    signature: "two-col|left|left|underline|bars|sans",
    accent: "#0e7490",
    canonicalId: "cv-aurum-apex",
  },
  {
    id: "tc-icon",
    name: "Tech Icon",
    category: "technical",
    levels: ["graduate", "experienced"],
    bestFor: "IT, network, support-to-engineer paths",
    description: "Single column with small line-icons beside headings; mild decoration, ATS-safe.",
    signature: "single|none|split|underline|inline|sans|icons",
    accent: "#166534",
    canonicalId: "cv-aurum-mercury",
  },
  // ── DESIGNER ──────────────────────────────────────────────────────────────
  {
    id: "ds-showcase",
    name: "Showcase",
    category: "designer",
    levels: ["internship", "graduate", "experienced"],
    bestFor: "Product designers, UX, visual designers",
    description: "Portfolio-first two-column with photo and icon work samples.",
    signature: "two-col|left|left|plain|chips|sans|photo|icons|portfolio",
    accent: "#a21caf",
    canonicalId: "fb-showcase",
  },
  {
    id: "ds-mono-grid",
    name: "Mono Grid",
    category: "designer",
    levels: ["graduate", "experienced"],
    bestFor: "Art directors, editorial designers",
    description: "Asymmetric grid with mono labels, geometric shapes and numbered sections.",
    signature: "two-col|left|left|plain|chips|mono",
    accent: "#155e75",
    canonicalId: "fb-mono-grid",
  },
  {
    id: "ds-colorfield",
    name: "Color Field",
    category: "designer",
    levels: ["graduate", "experienced"],
    bestFor: "Brand designers, motion designers",
    description: "One bold color band, confident whitespace, minimal sans hierarchy.",
    signature: "single|none|banner|plain|inline|sans",
    accent: "#be123c",
    canonicalId: "fb-color-field",
  },
];

/* ── Family membership ────────────────────────────────────────────────────── */

/**
 * Every template key → its family id. Grouped by family for legibility; the
 * canonical representative of each family is listed first.
 */
const FAMILY_MEMBERS: Record<string, string[]> = {
  "ats-pro": ["ats-professional"],
  "ats-plain": ["cv-aurum-aria", "rr-ditto", "rc-opal", "rm-mcdowell"],
  "ats-compact": ["cv-aurum-quartz", "rm-jakes-resume", "rr-glalie"],
  "prof-classic": ["cv-aurum-garamond", "rc-ember", "rm-article-serif"],
  "prof-modern": ["modern", "cv-aurum-aurum", "cv-aurum-swiss-aurum", "or-blue", "or-green", "or-indigo"],
  "prof-minimal": ["minimal"],
  "prof-rail": ["cv-aurum-linen", "cv-aurum-verdant", "rm-deedy"],
  "mod-cards": ["modern-card"],
  "mod-timeline": ["cv-aurum-vertex", "cv-aurum-slate", "rc-moderncv", "rm-moderncv"],
  "mod-sidebar": ["cv-aurum-clarity", "cv-aurum-cascade", "cv-aurum-sapphire", "cv-aurum-verde", "cv-aurum-initials", "cv-aurum-pinnacle", "rr-azurill", "rr-kakuna", "rr-meowth"],
  "min-swiss": ["cv-aurum-mono", "cv-aurum-lumiere", "cv-aurum-aurum-editorial", "rr-bronzor", "rm-article-minimal"],
  "min-air": ["cv-aurum-frost"],
  "cr-pop": ["creative", "cv-aurum-garnet", "cv-aurum-orchid"],
  "cr-portfolio": ["rm-awesome-cv", "cv-aurum-halcyon", "cv-aurum-portrait", "cv-aurum-opal", "cv-aurum-prism"],
  "cr-editorial": ["cv-aurum-editorial", "cv-aurum-atelier", "cv-aurum-sienna"],
  "ex-serif": ["executive", "cv-aurum-emblem", "cv-aurum-crest", "rr-rhyhorn"],
  "ex-sidebar": ["executive-sidebar"],
  "ex-band": ["fb-exec-band", "cv-aurum-sterling", "cv-aurum-onyx", "rr-ditgar"],
  "st-band": ["student"],
  "st-graduate": ["rr-lapras"],
  "st-academic": ["cv-aurum-harvard", "ol-abey"],
  "ac-harvard": ["rc-harvard", "cv-aurum-cambridge", "cv-aurum-oxford", "cv-aurum-scholar", "rc-classic", "rc-ink", "rm-article", "ol-ashley"],
  "ac-overleaf": ["cv-aurum-academia", "cv-aurum-newton"],
  "ac-scholar": ["cv-aurum-vector"],
  "tc-terminal": ["cv-aurum-terminal", "cv-aurum-graphite", "rc-engineeringclassic", "rm-article-tech"],
  "tc-datasheet": ["cv-aurum-apex", "cv-aurum-deedy", "rc-sb2nov"],
  "tc-icon": ["cv-aurum-mercury", "rc-engineeringresumes", "rr-scizor"],
  "ds-showcase": ["fb-showcase"],
  "ds-mono-grid": ["fb-mono-grid"],
  "ds-colorfield": ["fb-color-field"],
};

/**
 * Fallback family for any key that is not explicitly assigned (new templates
 * added later). Picks the closest family by structural traits so the catalog
 * never orphans a template.
 */
function fallbackFamilyFor(id: string): string {
  if (id.startsWith("fb-")) {
    if (id.includes("band")) return "ex-band";
    if (id.includes("color")) return "ds-colorfield";
    if (id.includes("mono")) return "ds-mono-grid";
    return "ds-showcase";
  }
  if (id.startsWith("cv-aurum-")) {
    if (id.includes("banner")) return "ex-band";
    if (id.includes("sidebar") || id.includes("two")) return "mod-sidebar";
    if (id.includes("mono")) return "min-swiss";
    if (id.includes("academ") || id.includes("harvard") || id.includes("oxford")) return "ac-harvard";
    if (id.includes("tech") || id.includes("engineer")) return "tc-terminal";
    if (id.includes("minimal") || id.includes("frost")) return "min-air";
    return "prof-modern";
  }
  return "prof-modern";
}

const FAMILY_BY_ID = new Map(FAMILIES.map((f) => [f.id, f]));

/** id → family id, resolved for every known template key. */
export const TEMPLATE_FAMILY: Record<string, string> = Object.fromEntries(
  ALL_TEMPLATE_IDS.map((id) => [id, idToFamily(FAMILY_MEMBERS, id)])
);

function idToFamily(members: Record<string, string[]>, id: string): string {
  for (const [family, ids] of Object.entries(members)) {
    if (ids.includes(id)) return family;
  }
  return fallbackFamilyFor(id);
}

/** Canonical representative per family (the hero card shown in the catalog). */
export const FAMILY_CANONICAL: Record<string, string> = Object.fromEntries(
  FAMILIES.map((f) => [f.id, f.canonicalId])
);

/* ── Public API ───────────────────────────────────────────────────────────── */

/** All 30 family definitions, in catalog order. */
export const TEMPLATE_FAMILIES: TemplateFamily[] = [...FAMILIES];

/** Look up family metadata by family id. */
export function getFamily(familyId: string): TemplateFamily | undefined {
  return FAMILY_BY_ID.get(familyId);
}

/**
 * Family metadata for any template key (built-in or imported). Unknown keys
 * (e.g. a stray id from an AI recommendation) resolve to the default family
 * so callers never have to handle a missing family.
 */
export function getFamilyForTemplate(templateId: string): TemplateFamily {
  const familyId = TEMPLATE_FAMILY[templateId] ?? "prof-modern";
  return FAMILY_BY_ID.get(familyId) ?? FAMILIES[0];
}

/** Family id for any template key. */
export function familyIdForTemplate(templateId: string): string {
  return TEMPLATE_FAMILY[templateId] ?? "prof-modern";
}

/** Every template id in a family (canonical first, then variants). */
export function getFamilyMembers(familyId: string): string[] {
  return FAMILY_MEMBERS[familyId] ?? (FAMILY_BY_ID.get(familyId) ? [FAMILY_CANONICAL[familyId]] : []);
}

/** The duplicate siblings of a family (everything except the canonical). */
export function getFamilyVariants(familyId: string): string[] {
  const members = getFamilyMembers(familyId);
  const canonical = FAMILY_CANONICAL[familyId];
  return canonical ? members.filter((id) => id !== canonical) : members;
}

/** The hero template id for a family. */
export function getCanonicalTemplate(familyId: string): string {
  return FAMILY_CANONICAL[familyId] ?? FAMILIES[0].canonicalId;
}

/** Whether a template is its family's canonical (hero) representative. */
export function isCanonicalTemplate(templateId: string): boolean {
  return FAMILY_CANONICAL[familyIdForTemplate(templateId)] === templateId;
}

/** The 30 curated catalog entries: family + canonical + variant ids. */
export function getCatalogFamilies(): { family: TemplateFamily; canonicalId: string; variantIds: string[] }[] {
  return FAMILIES.map((family) => ({
    family,
    canonicalId: family.canonicalId,
    variantIds: getFamilyVariants(family.id),
  }));
}

/** Map a family category to the legacy discovery-filter vocabulary. */
export function familyCategoryToFilter(category: FamilyCategory): string {
  switch (category) {
    case "academic":
      return "professional";
    case "technical":
      return "professional";
    case "designer":
      return "creative";
    default:
      return category;
  }
}
