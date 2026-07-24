import type { TargetLevel } from "@/types/resume";

export interface ResumeSectionConfig {
  id: string;
  label: string;
  description?: string;
  isOptional?: boolean;
}

export interface ResumeTypeConfig {
  id: TargetLevel;
  name: string;
  description: string;
  sections: ResumeSectionConfig[];
}

export const RESUME_TYPES: Record<TargetLevel, ResumeTypeConfig> = {
  student: {
    id: "student",
    name: "Student Resume",
    description: "Currently studying, no internship, no work experience.",
    sections: [
      { id: "personalInfo", label: "Personal Information", isOptional: false },
      { id: "summary", label: "Career Objective", isOptional: false },
      { id: "education", label: "Education", isOptional: false },
      { id: "skills", label: "Technical Skills", isOptional: false },
      { id: "projects", label: "Academic Projects", isOptional: false },
      { id: "certifications", label: "Certifications", isOptional: true },
      { id: "achievements", label: "Achievements", isOptional: true },
      { id: "codingProfiles", label: "Coding Profiles", isOptional: true },
      { id: "leadership", label: "Leadership", isOptional: true },
      { id: "coursework", label: "Relevant Coursework", isOptional: true },
      { id: "activities", label: "Extra Curricular Activities", isOptional: true },
      { id: "languages", label: "Languages", isOptional: true },
      { id: "interests", label: "Interests", isOptional: true },
    ],
  },
  fresher: {
    id: "fresher",
    name: "Fresher Resume",
    description: "Recently graduated, looking for first full-time job.",
    sections: [
      { id: "personalInfo", label: "Personal Information", isOptional: false },
      { id: "summary", label: "Professional Summary", isOptional: false },
      { id: "education", label: "Education", isOptional: false },
      { id: "skills", label: "Technical Skills", isOptional: false },
      { id: "experience", label: "Internship", isOptional: true },
      { id: "projects", label: "Projects", isOptional: false },
      { id: "certifications", label: "Certifications", isOptional: true },
      { id: "achievements", label: "Achievements", isOptional: true },
      { id: "leadership", label: "Leadership", isOptional: true },
      { id: "codingProfiles", label: "Coding Profiles", isOptional: true },
      { id: "openSource", label: "Open Source", isOptional: true },
      { id: "coursework", label: "Relevant Coursework", isOptional: true },
      { id: "activities", label: "Extra Curricular Activities", isOptional: true },
      { id: "languages", label: "Languages", isOptional: true },
      { id: "interests", label: "Interests", isOptional: true },
    ],
  },
  student_internship: {
    id: "student_internship",
    name: "Student with Internship",
    description: "Currently studying, completed one or more internships.",
    sections: [
      { id: "personalInfo", label: "Personal Information", isOptional: false },
      { id: "summary", label: "Professional Summary", isOptional: false },
      { id: "education", label: "Education", isOptional: false },
      { id: "skills", label: "Technical Skills", isOptional: false },
      { id: "experience", label: "Internship Experience", isOptional: false },
      { id: "projects", label: "Projects", isOptional: false },
      { id: "certifications", label: "Certifications", isOptional: true },
      { id: "achievements", label: "Achievements", isOptional: true },
      { id: "leadership", label: "Leadership", isOptional: true },
      { id: "codingProfiles", label: "Coding Profiles", isOptional: true },
      { id: "openSource", label: "Open Source", isOptional: true },
      { id: "coursework", label: "Relevant Coursework", isOptional: true },
      { id: "activities", label: "Extra Curricular Activities", isOptional: true },
      { id: "languages", label: "Languages", isOptional: true },
      { id: "interests", label: "Interests", isOptional: true },
    ],
  },
  experienced: {
    id: "experienced",
    name: "Experienced Professional",
    description: "Working professionals with multiple years of experience.",
    sections: [
      { id: "personalInfo", label: "Personal Information", isOptional: false },
      { id: "summary", label: "Professional Summary", isOptional: false },
      { id: "skills", label: "Core Skills", isOptional: false },
      { id: "experience", label: "Professional Experience", isOptional: false },
      { id: "projects", label: "Major Projects", isOptional: true },
      { id: "education", label: "Education", isOptional: false },
      { id: "certifications", label: "Certifications", isOptional: true },
      { id: "achievements", label: "Achievements", isOptional: true },
      { id: "leadership", label: "Leadership Experience", isOptional: true },
      { id: "openSource", label: "Open Source", isOptional: true },
      { id: "publications", label: "Publications", isOptional: true },
      { id: "codingProfiles", label: "Technical Profiles", isOptional: true },
      { id: "volunteer", label: "Volunteer Experience", isOptional: true },
      { id: "languages", label: "Languages", isOptional: true },
      { id: "interests", label: "Interests", isOptional: true },
    ],
  },
};
