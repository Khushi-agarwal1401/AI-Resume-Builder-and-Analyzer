import type { ImportedTemplateConfig } from "./types";
import { CVAURUM_TEMPLATES } from "./cvaurum";
import { COMMUNITY_TEMPLATES } from "./community";

export type { ImportedTemplateConfig } from "./types";
export type {
  ImportedHeaderStyle,
  ImportedSectionStyle,
  ImportedSkillsStyle,
  ImportedPhotoShape,
} from "./types";

/**
 * Full imported catalog: 75 curated data-driven templates from 5 open-source
 * projects (CVAurum, reactive-resume, resumake.io, rendercv, open-resume)
 * plus the 8 built-in templates described with the same config shape — 83
 * total. Non-professional / non-company-safe designs (dark full-page
 * backgrounds, full-width banner mastheads, playful student palettes) were
 * curated out.
 */
export const IMPORTED_TEMPLATES: ImportedTemplateConfig[] = [
  ...CVAURUM_TEMPLATES,
  ...COMMUNITY_TEMPLATES,
];

/** id → config lookup. */
export const IMPORTED_TEMPLATE_MAP: Record<string, ImportedTemplateConfig> =
  Object.fromEntries(IMPORTED_TEMPLATES.map((t) => [t.id, t]));

/** All imported template ids (the 83-key union feeds pickers & the DB seed). */
export const IMPORTED_TEMPLATE_IDS: string[] = IMPORTED_TEMPLATES.map((t) => t.id);

/** Built-in (hand-written) template keys that keep their dedicated components. */
export const BUILTIN_TEMPLATE_IDS: string[] = [
  "ats-professional",
  "modern",
  "student",
  "minimal",
  "executive",
  "creative",
  "executive-sidebar",
  "modern-card",
];

/** Every template the app can render: built-ins + imported catalog. */
export const ALL_TEMPLATE_IDS: string[] = [...BUILTIN_TEMPLATE_IDS, ...IMPORTED_TEMPLATE_IDS];

/** Look up an imported config; returns undefined for built-in/unknown keys. */
export function getImportedTemplate(id: string): ImportedTemplateConfig | undefined {
  return IMPORTED_TEMPLATE_MAP[id];
}

/** Whether a template key is part of the imported (data-driven) catalog. */
export function isImportedTemplate(id: string): boolean {
  return id in IMPORTED_TEMPLATE_MAP;
}

/** Human-readable display name for any template key (built-in or imported). */
export function templateDisplayName(id: string): string {
  const imported = IMPORTED_TEMPLATE_MAP[id];
  if (imported) return imported.name;
  const builtinNames: Record<string, string> = {
    "ats-professional": "ATS Professional",
    modern: "Modern",
    student: "Student",
    minimal: "Minimal",
    executive: "Executive",
    creative: "Creative",
    "executive-sidebar": "Executive Sidebar",
    "modern-card": "Modern Card",
  };
  return builtinNames[id] ?? id;
}

/** Source repo label used on catalog cards / admin. */
export function sourceLabel(source: string): string {
  switch (source) {
    case "cv-aurum":
      return "CVAurum";
    case "reactive-resume":
      return "Reactive Resume";
    case "resumake":
      return "Resumake";
    case "rendercv":
      return "RenderCV";
    case "open-resume":
      return "Open Resume";
    default:
      return source;
  }
}

/**
 * Map an imported template to the closest built-in PDF/HTML/word export
 * style. The dedicated exporters only implement the 8 built-in designs, so
 * imported designs export through their nearest structural sibling instead of
 * always collapsing to Modern.
 */
export function exportedStyleForTemplate(id: string): string {
  const imported = IMPORTED_TEMPLATE_MAP[id];
  if (!imported) return id;
  const { layout, theme } = imported;
  // Dark canvases (first RGB channel < 0x30 ≈ dark) export through the dark
  // sidebar design.
  if (theme.background && parseInt(theme.background.slice(1, 3), 16) < 0x30) {
    return "executive-sidebar";
  }
  // Two-column / sidebar layouts keep their rail via the creative design.
  if (layout.columns === 2 || layout.sidebar) return "creative";
  // Serif families export through the executive (serif) design.
  const serif = /serif|garamond|playfair|cormorant|times|tinos|charter|computer modern|fontin|gentium|latin modern|spectral/i;
  if (serif.test(imported.typography.fontFamily)) return "executive";
  return "modern";
}
