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
  type?: "personal" | "github" | "company";
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
  category?: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  category?: string;
}

interface CustomSectionItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  description: string;
}

/** A user-created section: a title plus free-form items (K-04). */
interface CustomSection {
  title: string;
  items: CustomSectionItem[];
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

/**
 * Template key. The 8 built-ins keep dedicated components; every other key is
 * an imported catalog design rendered by the data-driven ImportedTemplate.
 * Declared as string so the catalog can grow without touching this union.
 */
type ResumeTemplate = string;
type TargetLevel = "student" | "fresher" | "student_internship" | "experienced";
type ResumeFont = "sans" | "serif" | "mono";

interface ResumeData {
  id: string;
  userId: string;
  title: string;
  template: ResumeTemplate;
  targetLevel: TargetLevel;
  /** Custom section order (array of section ids). Empty = default order for the resume type. */
  sectionOrder: string[];
  personalInfo: PersonalInfo;
  summary: string;
  accentColor?: string | null;
  fontFamily?: ResumeFont;
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
  /** User-created sections keyed by "custom-<id>" (K-04). Optional so legacy
   * resume data / mocks without the field keep working. */
  customSections?: Record<string, CustomSection>;
  createdAt: string;
  updatedAt: string;
  /** Share token for public sharing (A-19) */
  shareToken?: string | null;
  /** Whether sharing is enabled */
  shareEnabled?: boolean | null;
}

export type { 
  ResumeTemplate, 
  TargetLevel,
  ResumeFont,
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
  CustomSection,
  CodingProfile,
  Leadership,
  OpenSource,
  Publication,
  Volunteer,
  Activity
};
