import type { ResumeData } from "@/types/resume";
import { AtsProfessional } from "./AtsProfessional";
import { Modern } from "./Modern";
import { Student } from "./Student";
import { Minimal } from "./Minimal";
import { Executive } from "./Executive";
import { Creative } from "./Creative";

export function TemplateRenderer({ resume }: { resume: ResumeData }) {
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
    default:
      return <Modern resume={resume} />;
  }
}
