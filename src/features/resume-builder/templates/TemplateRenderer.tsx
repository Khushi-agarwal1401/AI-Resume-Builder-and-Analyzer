import { memo } from "react";
import type { ResumeData } from "@/types/resume";
import { AtsProfessional } from "./AtsProfessional";
import { Modern } from "./Modern";
import { Student } from "./Student";
import { Minimal } from "./Minimal";
import { Executive } from "./Executive";
import { Creative } from "./Creative";
import { ExecutiveSidebar } from "./ExecutiveSidebar";
import { ModernCard } from "./ModernCard";

export function TemplateRenderer({ resume }: { resume: ResumeData }) {
  const renderTemplate = () => {
    switch (resume.template) {
      case "ats-professional":
        return <AtsProfessional resume={resume} />;
      case "modern":
        return <Modern resume={resume} />;
      case "student":
        return <Student resume={resume} />;
      case "minimal":
        return <Minimal resume={resume} />;
      case "executive":
        return <Executive resume={resume} />;
      case "creative":
        return <Creative resume={resume} />;
      case "executive-sidebar":
        return <ExecutiveSidebar resume={resume} />;
      case "modern-card":
        return <ModernCard resume={resume} />;
      default:
        return <Modern resume={resume} />;
    }
  };

  return (
    <div className="resume-paper w-[210mm] min-h-[297mm] bg-white mx-auto p-10 box-border text-left shadow-sm">
      {renderTemplate()}
    </div>
  );
}

/**
 * A-18: memoized dispatcher — skips re-rendering the whole template tree
 * when the resume object reference hasn't changed (e.g. unrelated keystrokes).
 */
export const MemoTemplateRenderer = memo(TemplateRenderer);