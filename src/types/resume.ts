interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  portfolio: string;
  photo: string;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  cgpa: string;
}

interface Experience {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  responsibilities: string[];
  achievements: string[];
}

interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  liveUrl: string;
  githubUrl: string;
}

interface Skills {
  technical: string[];
  soft: string[];
  tools: string[];
  frameworks: string[];
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
}

interface Language {
  id: string;
  name: string;
  proficiency: "native" | "fluent" | "advanced" | "intermediate" | "basic";
}

interface ResumeData {
  id: string;
  userId: string;
  title: string;
  template: "ats-professional" | "modern" | "student" | "minimal";
  personalInfo: PersonalInfo;
  summary: string;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  skills: Skills;
  certifications: Certification[];
  achievements: Achievement[];
  languages: Language[];
  createdAt: string;
  updatedAt: string;
}

export type {
  ResumeData,
  PersonalInfo,
  Education,
  Experience,
  Project,
  Skills,
  Certification,
  Achievement,
  Language,
};
