import { RESUME_TYPES } from "@/features/resume-builder/config/resume-types";
import type { ResumeData, TargetLevel } from "@/types/resume";

export type SectionStatus = "done" | "in-progress" | "empty";

export interface MissingSection {
  id: string;
  label: string;
  isOptional: boolean;
  status: SectionStatus;
}

export interface ResumeCompletion {
  percentage: number;
  missing: MissingSection[];
  estimatedMinutes: number;
}

/** A lightweight resume item as returned by the dashboard list endpoint. */
export interface ResumeListItem {
  id: string;
  title: string;
  template: string;
  targetLevel: TargetLevel;
  created_at: string;
  updated_at: string;
  ats_score: number | null;
  view_count: number;
  download_count: number;
  completion: ResumeCompletion;
}

export function isFilledValue(v: unknown): boolean {
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return false;
}

/**
 * Classifies a single resume section as done / in-progress / empty.
 * Shared between the builder sidebar and the dashboard completion widget.
 */
export function getSectionStatus(sectionId: string, resume: ResumeData): SectionStatus {
  // User-created custom sections (K-04): status derives from their items.
  if (sectionId.startsWith("custom-")) {
    const items = resume.customSections?.[sectionId]?.items ?? [];
    if (items.length === 0) return "empty";
    const hasContent = items.some(
      (item) => item.title?.trim() || item.description?.trim() || item.subtitle?.trim() || item.date?.trim()
    );
    return hasContent ? "done" : "in-progress";
  }

  const value = resume[sectionId as keyof ResumeData];

  if (typeof value === "string") {
    return value.trim().length > 0 ? "done" : "empty";
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "empty";
    const filledItems = value.filter((item) => {
      if (typeof item === "string") return item.trim().length > 0;
      if (item && typeof item === "object") {
        // Ignore the always-populated "id" key so empty new rows aren't counted as filled
        return Object.entries(item).some(([key, v]) => key !== "id" && isFilledValue(v));
      }
      return false;
    }).length;
    if (filledItems === 0) return "empty";
    if (filledItems === value.length) return "done";
    return "in-progress";
  }

  if (value && typeof value === "object") {
    const values = Object.values(value);
    const filledCount = values.filter(isFilledValue).length;
    if (filledCount === 0) return "empty";
    // Personal info is complete once the core contact fields are filled
    if (sectionId === "personalInfo") {
      const core = ["fullName", "email", "phone"];
      const coreFilled = Object.entries(value)
        .filter(([k, v]) => core.includes(k) && isFilledValue(v))
        .length;
      return coreFilled === core.length ? "done" : "in-progress";
    }
    return filledCount >= values.length ? "done" : "in-progress";
  }

  return "empty";
}

/**
 * Computes a completion summary for a resume:
 * - percentage: weighted by section importance (required sections weigh more)
 * - missing:    sections that are empty or only partially filled
 * - estimatedMinutes: rough time needed to finish the resume
 */
export function computeResumeCompletion(resume: ResumeData): ResumeCompletion {
  const config = RESUME_TYPES[resume.targetLevel];
  if (!config) {
    return { percentage: 0, missing: [], estimatedMinutes: 0 };
  }

  let earned = 0;
  let total = 0;
  let minutes = 0;
  const missing: MissingSection[] = [];

  for (const section of config.sections) {
    const status = getSectionStatus(section.id, resume);
    const weight = section.isOptional ? 0.5 : 1;
    total += weight;

    if (status === "done") {
      earned += weight;
    } else if (status === "in-progress") {
      earned += weight * 0.5;
      minutes += section.isOptional ? 2 : 4;
      missing.push({ id: section.id, label: section.label, isOptional: !!section.isOptional, status });
    } else {
      minutes += section.isOptional ? 5 : 10;
      missing.push({ id: section.id, label: section.label, isOptional: !!section.isOptional, status });
    }
  }

  const percentage = total > 0 ? Math.round((earned / total) * 100) : 0;
  return { percentage, missing, estimatedMinutes: minutes };
}

/** Human-friendly rendering of the estimated completion time. */
export function formatEstimatedMinutes(minutes: number): string {
  if (minutes <= 0) return "Ready to export";
  if (minutes < 60) return `~${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `~${h}h ${m}m` : `~${h}h`;
}
