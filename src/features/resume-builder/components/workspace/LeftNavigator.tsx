import React from "react";
import { User, FileText, Briefcase, GraduationCap, Code, Folder, Award, Star, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
  { id: "personalInfo", label: "Personal Info", icon: User },
  { id: "summary", label: "Summary", icon: FileText },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "skills", label: "Skills", icon: Code },
  { id: "projects", label: "Projects", icon: Folder },
  { id: "certifications", label: "Certifications", icon: Award },
  { id: "achievements", label: "Achievements", icon: Star },
  { id: "languages", label: "Languages", icon: Globe },
];

interface LeftNavigatorProps {
  activeSection?: string;
}

export function LeftNavigator({ activeSection }: LeftNavigatorProps) {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="p-5 flex flex-col gap-1 w-[260px]">
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-3">
        Sections
      </h2>
      <nav className="flex flex-col gap-1">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            className={cn(
              "flex items-center gap-3 w-full h-11 px-3 rounded-xl text-sm font-medium transition-all duration-200 text-left",
              activeSection === s.id
                ? "bg-primary-50 text-primary-700 shadow-sm"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <s.icon className={cn("w-4 h-4", activeSection === s.id ? "text-primary-600" : "text-gray-400")} />
            {s.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
