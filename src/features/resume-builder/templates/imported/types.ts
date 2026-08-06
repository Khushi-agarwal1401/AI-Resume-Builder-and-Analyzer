/**
 * Data-driven template config types for the imported template catalog.
 *
 * Templates are pure data: a theme palette, typography choices, and layout
 * flags, rendered through a single generic renderer (`ImportedTemplate`).
 * The model mirrors CVAurum's registry (source of 52 of the 96 entries) so
 * each design can be described in ~10 lines instead of a full React component.
 */

export type ImportedHeaderStyle = "standard" | "centered" | "split" | "banner" | "compact";
export type ImportedSectionStyle = "underline" | "bar" | "rule-after" | "plain" | "side";
export type ImportedSkillsStyle = "chips" | "inline" | "grouped-chips" | "bars" | "dots";
export type ImportedPhotoShape = "circle" | "square" | "rounded" | "diamond";

export interface ImportedTemplateConfig {
  /** Stable kebab-case key, e.g. "cv-aurum-clarity" or "rr-azurill". */
  id: string;
  name: string;
  /** Source repo: "cv-aurum" | "reactive-resume" | "resumake" | "rendercv" | "open-resume". */
  source: string;
  description: string;
  /** Discovery filter tags (see template-discovery.ts TemplateFilterId). */
  tags: string[];
  atsScore: number;
  header: ImportedHeaderStyle;
  section: ImportedSectionStyle;
  skills: ImportedSkillsStyle;
  sectionIcons?: boolean;
  theme: {
    primary: string;
    text: string;
    muted: string;
    background?: string;
    sidebar?: string;
    sidebarText?: string;
  };
  typography: {
    fontFamily: string;
    headingFamily: string;
    nameFamily: string;
    fontSize: number;
    lineHeight: number;
    letterSpacing?: number;
    headingScale: number;
    uppercaseHeadings: boolean;
  };
  layout: {
    columns: 1 | 2;
    sidebar?: "left" | "right";
    sidebarWidth?: number;
    showPhoto?: boolean;
    monogram?: boolean;
    photoShape?: ImportedPhotoShape;
    photoSize?: "s" | "m" | "l";
    icons?: boolean;
    sectionGap?: number;
    itemGap?: number;
  };
}
