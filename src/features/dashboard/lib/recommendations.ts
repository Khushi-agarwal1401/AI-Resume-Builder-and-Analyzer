import {
  Award,
  Briefcase,
  FileText,
  FolderKanban,
  Gauge,
  GraduationCap,
  User,
  Wrench,
  Globe,
  type LucideIcon,
} from "lucide-react";
import type { ResumeListItem } from "@/services/resume/completion";

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

interface SectionMeta {
  title: string;
  description: string;
  href: (id: string) => string;
  icon: LucideIcon;
}

const SECTION_META: Record<string, SectionMeta> = {
  personalInfo: {
    title: "Complete Personal Info",
    description: "Add your name, email and phone so recruiters can reach you.",
    href: (id) => `/builder/${id}/personalInfo`,
    icon: User,
  },
  summary: {
    title: "Write a Professional Summary",
    description: "A strong opening summary helps you stand out at a glance.",
    href: (id) => `/builder/${id}/summary`,
    icon: FileText,
  },
  education: {
    title: "Add Education",
    description: "Showcase your degrees, institutions and academic highlights.",
    href: (id) => `/builder/${id}/education`,
    icon: GraduationCap,
  },
  skills: {
    title: "Add 2+ Skills",
    description: "Recruiters scan for relevant technical and soft skills.",
    href: (id) => `/builder/${id}/skills`,
    icon: Wrench,
  },
  experience: {
    title: "Improve Experience Section",
    description: "Detail your roles, responsibilities and measurable impact.",
    href: (id) => `/builder/${id}/experience`,
    icon: Briefcase,
  },
  projects: {
    title: "Add Projects",
    description: "Showcase real work with technologies and outcomes.",
    href: (id) => `/builder/${id}/projects`,
    icon: FolderKanban,
  },
  certifications: {
    title: "Add Certifications",
    description: "Boost credibility with relevant certifications.",
    href: (id) => `/builder/${id}/certifications`,
    icon: Award,
  },
  languages: {
    title: "Add Languages",
    description: "Mention languages you speak and your proficiency.",
    href: (id) => `/builder/${id}/languages`,
    icon: Globe,
  },
};

/**
 * Builds up to 3 actionable recommendations for a resume, derived from its
 * completion summary and stored ATS score. Each suggestion deep-links into
 * the relevant builder section or ATS report.
 */
export function buildRecommendations(resume: ResumeListItem): Recommendation[] {
  const recs: Recommendation[] = [];

  // 1. Empty required sections first (highest impact)
  const requiredMissing = resume.completion.missing.filter((m) => !m.isOptional);
  for (const m of requiredMissing) {
    const meta = SECTION_META[m.id];
    if (!meta) continue;
    recs.push({
      id: `section-${m.id}`,
      title: meta.title,
      description: meta.description,
      href: meta.href(resume.id),
      icon: meta.icon,
    });
  }

  // 2. ATS score suggestion (only if one is stored — avoids surprise AI calls)
  if (resume.ats_score !== null && resume.ats_score < 70) {
    recs.push({
      id: "ats-score",
      title: "Increase ATS Score",
      description: `Your score is ${resume.ats_score}/100. See what's dragging it down.`,
      href: `/resume/${resume.id}/ats-score`,
      icon: Gauge,
    });
  } else if (resume.ats_score === null) {
    recs.push({
      id: "ats-score",
      title: "Check Your ATS Score",
      description: "Run a free ATS analysis to see how recruiters read your resume.",
      href: `/resume/${resume.id}/ats-score`,
      icon: Gauge,
    });
  }

  // 3. Remaining missing sections (optional), fill up to 3 total
  const optionalMissing = resume.completion.missing.filter((m) => m.isOptional);
  for (const m of optionalMissing) {
    if (recs.length >= 3) break;
    const meta = SECTION_META[m.id];
    if (!meta) continue;
    recs.push({
      id: `section-${m.id}`,
      title: meta.title,
      description: meta.description,
      href: meta.href(resume.id),
      icon: meta.icon,
    });
  }

  return recs.slice(0, 3);
}
