"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { getSectionStatus } from "@/services/resume/completion";
import type { ResumeData } from "@/types/resume";
import {
  User,
  FileText,
  GraduationCap,
  Wrench,
  Briefcase,
  FolderKanban,
  Award,
  Trophy,
  Code2,
  Crown,
  BookOpen,
  Dumbbell,
  Globe,
  Heart,
  HandHelping,
  Circle,
  Check,
} from "lucide-react";

export const SECTION_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  personalInfo: User,
  summary: FileText,
  education: GraduationCap,
  skills: Wrench,
  experience: Briefcase,
  projects: FolderKanban,
  certifications: Award,
  achievements: Trophy,
  codingProfiles: Code2,
  leadership: Crown,
  openSource: Code2,
  coursework: BookOpen,
  activities: Dumbbell,
  languages: Globe,
  interests: Heart,
  publications: BookOpen,
  volunteer: HandHelping,
};

interface SectionNavListProps {
  sections: { id: string; label: string; isOptional?: boolean }[];
  resumeId: string;
  currentSectionId?: string;
  data: ResumeData | null;
}

export function SectionNavList({ sections, resumeId, currentSectionId, data }: SectionNavListProps) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-track]:bg-transparent">
      {sections.map((s) => {
        const isActive = s.id === currentSectionId;
        const SectionIcon = SECTION_ICONS[s.id] || Circle;
        const status = data ? getSectionStatus(s.id, data) : "empty";
        return (
          <Link
            key={s.id}
            href={`/builder/${resumeId}/${s.id}`}
            className={cn(
              "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200",
              isActive
                ? "bg-gradient-to-r from-accent-50 to-accent-50/50 text-accent-700 shadow-sm dark:from-accent-500/15 dark:to-accent-500/10 dark:text-accent-300"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/80"
            )}
          >
            {/* Active indicator bar */}
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-gradient-to-b from-accent-500 to-accent-600 shadow-sm" />
            )}

            {/* Icon */}
            <SectionIcon
              size={16}
              className={cn(
                "shrink-0 transition-all duration-200",
                isActive ? "text-accent-600" : "text-gray-400 group-hover:text-gray-600"
              )}
            />

            {/* Label */}
            <span className="truncate">{s.label}</span>

            {/* Required marker */}
            {!s.isOptional && (
              <span
                className="text-[10px] font-bold text-red-400 shrink-0"
                title="Required"
                aria-hidden="true"
              >
                *
              </span>
            )}

            {/* Status indicator */}
            <span
              className="ml-auto shrink-0"
              title={
                status === "done"
                  ? "Completed"
                  : status === "in-progress"
                    ? "In progress"
                    : s.isOptional
                      ? "Empty"
                      : "Required — empty"
              }
            >
              {status === "done" ? (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-100 text-green-600 transition-transform group-hover:scale-110">
                  <Check size={10} strokeWidth={3} />
                </span>
              ) : status === "in-progress" ? (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 text-amber-500 transition-transform group-hover:scale-110">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                </span>
              ) : (
                <span className="flex h-4 w-4 items-center justify-center rounded-full border border-gray-200 text-gray-300">
                  <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                </span>
              )}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
