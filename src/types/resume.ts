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
  branch?: string;
  semester?: string;
  classXII?: string;
  classX?: string;
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
  client?: string;
  teamSize?: string;
  impact?: string;
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

interface CustomSectionItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  description: string;
}

interface Language {
  id: string;
  name: string;
  proficiency: "native" | "fluent" | "advanced" | "intermediate" | "basic";
}

interface CodingProfile {
  id: string;
  platform: string;
  url: string;
  handle: string;
}

interface Leadership {
  id: string;
  title: string;
  organization: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface OpenSource {
  id: string;
  projectName: string;
  role: string;
  url: string;
  description: string;
}

interface Publication {
  id: string;
  title: string;
  publisher: string;
  date: string;
  url: string;
  description: string;
}

interface Volunteer {
  id: string;
  organization: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface Activity {
  id: string;
  title: string;
  description: string;
  date: string;
}

type ResumeTemplate = "ats-professional" | "modern" | "student" | "minimal" | "executive" | "creative";
type TargetLevel = "student" | "fresher" | "student_internship" | "experienced";

interface ResumeData {
  id: string;
  userId: string;
  title: string;
  template: ResumeTemplate;
  targetLevel: TargetLevel;
  personalInfo: PersonalInfo;
  summary: string;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  skills: Skills;
  certifications: Certification[];
  achievements: Achievement[];
  languages: Language[];
  codingProfiles: CodingProfile[];
  leadership: Leadership[];
  openSource: OpenSource[];
  publications: Publication[];
  volunteer: Volunteer[];
  activities: Activity[];
  coursework: string[];
  interests: string[];
  createdAt: string;
  updatedAt: string;
}

export type { 
  ResumeTemplate, 
  TargetLevel,
  ResumeData, 
  PersonalInfo, 
  Education, 
  Experience, 
  Project, 
  Skills, 
  Certification, 
  Achievement, 
  Language, 
  CustomSectionItem,
  CodingProfile,
  Leadership,
  OpenSource,
  Publication,
  Volunteer,
  Activity
};
