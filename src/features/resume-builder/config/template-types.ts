/**
 * Template type definitions for the resume template marketplace.
 * These types define the structure for template metadata, categories, and archetypes.
 */

export type TemplateCategory =
  | "ats"
  | "modern"
  | "student"
  | "minimal"
  | "executive"
  | "creative"
  | "technical"
  | "academic";

export type TemplateExperienceLevel =
  | "student"
  | "entry"
  | "mid"
  | "senior"
  | "executive";

export type TemplateLayout =
  | "single-column"
  | "two-column"
  | "sidebar";

export type TemplateTier = "free" | "premium";

export interface TemplateArchetype {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  layout: TemplateLayout;
  previewComponent: string;
  pdfComponent: string;
  htmlRenderer: string;
  docxRenderer: string;
  latexRenderer: string;
  supportsCustomization: {
    accentColor: boolean;
    fontFamily: boolean;
    spacing: boolean;
    showIcons: boolean;
    showPhoto: boolean;
  };
  defaultAccentColor: string;
  defaultFontFamily: "sans" | "serif" | "mono";
}

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  targetRoles: string[];
  experienceLevels: TemplateExperienceLevel[];
  layout: TemplateLayout;
  archetype: string;
  atsFriendly: boolean;
  tier: TemplateTier;
  tags: string[];
  previewImage?: string;
  supportedFormats: {
    web: boolean;
    html: boolean;
    pdf: boolean;
    docx: boolean;
    txt: boolean;
    latex: boolean;
  };
  source?: {
    repository?: string;
    license?: string;
    author?: string;
  };
  isActive: boolean;
  sortOrder: number;
}

export interface TemplateSearchFilters {
  query?: string;
  category?: TemplateCategory;
  role?: string;
  experienceLevel?: TemplateExperienceLevel;
  atsFriendly?: boolean;
  tier?: TemplateTier;
}

export interface TemplateRecommendation {
  templateId: string;
  reason: string;
  score: number;
}

export interface TemplatePreviewData {
  templateId: string;
  resumeData: ResumeData;
}

export type ResumeData = import("@/types/resume").ResumeData;