import { memo } from "react";
import type { ResumeData } from "@/types/resume";
import { archetypeForTemplate } from "../config/template-variants";
import { AtsProfessional } from "./AtsProfessional";
import { Modern } from "./Modern";
import { Student } from "./Student";
import { Minimal } from "./Minimal";
import { Executive } from "./Executive";
import { Creative } from "./Creative";
import { ExecutiveSidebar } from "./ExecutiveSidebar";
import { ModernCard } from "./ModernCard";
import { GraduateCv } from "./GraduateCv";
import { ClassicAcademic } from "./ClassicAcademic";
import { Deedy } from "./Deedy";

export function TemplateRenderer({ resume }: { resume: ResumeData }) {
  const renderTemplate = () => {
    // Every catalog variant renders through its archetype component; the
    // variant's accent/font flow in via the resume's template key.
    switch (archetypeForTemplate(resume.template)) {
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
      case "graduate-cv":
        return <GraduateCv resume={resume} />;
      case "classic-academic":
        return <ClassicAcademic resume={resume} />;
      case "deedy":
        return <Deedy resume={resume} />;
      default:
        return <Modern resume={resume} />;
    }
  };

  return (
    <div className="resume-paper w-[210mm] min-h-[297mm] bg-white mx-auto p-10 box-border text-left shadow-sm print:w-full print:min-h-0 print:shadow-none print:m-0">
      {renderTemplate()}
    </div>
  );
}

/**
 * A-18: memoized dispatcher — skips re-rendering the whole template tree
 * when the resume object reference hasn't changed (e.g. unrelated keystrokes).
 */
export const MemoTemplateRenderer = memo(TemplateRenderer);