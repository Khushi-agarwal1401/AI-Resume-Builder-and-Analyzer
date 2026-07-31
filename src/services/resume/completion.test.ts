import { describe, expect, it } from "vitest";
import type { ResumeData } from "@/types/resume";
import { computeResumeCompletion, getSectionStatus, formatEstimatedMinutes } from "./completion";

const BASE_RESUME: ResumeData = {
  id: "r1",
  userId: "u1",
  title: "My Resume",
  template: "modern",
  targetLevel: "fresher",
  personalInfo: { fullName: "Jane Doe", email: "jane@x.com", phone: "123", linkedin: "", github: "", portfolio: "", photo: "" },
  summary: "A motivated developer.",
  education: [{ id: "e1", institution: "MIT", degree: "BS", field: "CS", startDate: "", endDate: "", cgpa: "" }],
  experience: [],
  projects: [],
  skills: { technical: ["TypeScript"], soft: [], tools: [], frameworks: [] },
  certifications: [],
  achievements: [],
  languages: [],
  codingProfiles: [],
  leadership: [],
  openSource: [],
  publications: [],
  volunteer: [],
  activities: [],
  coursework: [],
  interests: [],
  createdAt: "",
  updatedAt: "",
};

describe("getSectionStatus", () => {
  it("classifies empty string sections as empty", () => {
    expect(getSectionStatus("summary", { ...BASE_RESUME, summary: "  " })).toBe("empty");
  });

  it("classifies filled string sections as done", () => {
    expect(getSectionStatus("summary", BASE_RESUME)).toBe("done");
  });

  it("classifies empty arrays as empty", () => {
    expect(getSectionStatus("experience", BASE_RESUME)).toBe("empty");
  });

  it("classifies populated arrays as done", () => {
    expect(getSectionStatus("education", BASE_RESUME)).toBe("done");
  });

  it("treats arrays containing only blank rows as empty", () => {
    const resume = {
      ...BASE_RESUME,
      education: [{ id: "blank", institution: "", degree: "", field: "", startDate: "", endDate: "", cgpa: "" }],
    };
    expect(getSectionStatus("education", resume)).toBe("empty");
  });

  it("treats partially filled arrays as in-progress", () => {
    const resume = {
      ...BASE_RESUME,
      education: [
        ...BASE_RESUME.education,
        { id: "blank", institution: "", degree: "", field: "", startDate: "", endDate: "", cgpa: "" },
      ],
    };
    expect(getSectionStatus("education", resume)).toBe("in-progress");
  });

  it("treats fully empty object sections as empty", () => {
    const resume = { ...BASE_RESUME, skills: { technical: [], soft: [], tools: [], frameworks: [] } };
    expect(getSectionStatus("skills", resume)).toBe("empty");
  });

  it("treats partially filled object sections as in-progress", () => {
    const resume = {
      ...BASE_RESUME,
      skills: { technical: ["TypeScript"], soft: [], tools: [], frameworks: [] },
    };
    expect(getSectionStatus("skills", resume)).toBe("in-progress");
  });
});

describe("computeResumeCompletion", () => {
  it("returns 100% for a fully completed resume", () => {
    const full: ResumeData = {
      ...BASE_RESUME,
      experience: [{ id: "x1", company: "Acme", role: "SWE", location: "", startDate: "", endDate: "", current: false, responsibilities: ["Built things"], achievements: [] }],
      projects: [{ id: "p1", name: "App", description: "Cool app", technologies: ["React"], liveUrl: "", githubUrl: "" }],
      certifications: [{ id: "c1", name: "AWS", issuer: "Amazon", date: "", url: "" }],
      achievements: [{ id: "a1", title: "Award", description: "", date: "" }],
      languages: [{ id: "l1", name: "English", proficiency: "fluent" }],
      codingProfiles: [{ id: "cp1", platform: "GitHub", url: "", handle: "jane" }],
      leadership: [{ id: "le1", title: "Lead", organization: "Club", startDate: "", endDate: "", description: "" }],
      openSource: [{ id: "o1", projectName: "Lib", role: "Maintainer", url: "", description: "" }],
      coursework: ["Data Structures"],
      activities: [{ id: "ac1", title: "Hackathon", description: "", date: "" }],
      interests: ["Coding"],
      skills: { technical: ["TypeScript"], soft: ["Communication"], tools: ["Git"], frameworks: ["React"] },
    };
    const result = computeResumeCompletion(full);
    expect(result.percentage).toBe(100);
    expect(result.missing).toHaveLength(0);
  });

  it("reports empty required sections as missing with zero percentage", () => {
    const empty: ResumeData = {
      ...BASE_RESUME,
      personalInfo: { fullName: "", email: "", phone: "", linkedin: "", github: "", portfolio: "", photo: "" },
      summary: "",
      education: [],
      projects: [],
      skills: { technical: [], soft: [], tools: [], frameworks: [] },
    };
    const result = computeResumeCompletion(empty);
    expect(result.percentage).toBe(0);
    expect(result.missing.some((m) => m.id === "summary")).toBe(true);
    expect(result.missing.some((m) => m.id === "education")).toBe(true);
    expect(result.missing.some((m) => m.id === "skills")).toBe(true);
  });

  it("includes missing sections with labels and optional flag", () => {
    const result = computeResumeCompletion(BASE_RESUME);
    const experience = result.missing.find((m) => m.id === "experience");
    expect(experience).toBeDefined();
    expect(experience?.isOptional).toBe(true); // internships are optional for freshers
    expect(result.missing.some((m) => m.id === "projects")).toBe(true);
  });

  it("estimates a nonzero time when sections are missing", () => {
    const result = computeResumeCompletion(BASE_RESUME);
    expect(result.estimatedMinutes).toBeGreaterThan(0);
  });

  it("falls back gracefully for an unrecognized target level", () => {
    const result = computeResumeCompletion({ ...BASE_RESUME, targetLevel: "unknown" as ResumeData["targetLevel"] });
    expect(result.percentage).toBe(0);
    expect(result.missing).toEqual([]);
  });
});

describe("formatEstimatedMinutes", () => {
  it("returns ready message for zero", () => {
    expect(formatEstimatedMinutes(0)).toBe("Ready to export");
  });

  it("formats minutes", () => {
    expect(formatEstimatedMinutes(25)).toBe("~25 min");
  });

  it("formats hours", () => {
    expect(formatEstimatedMinutes(90)).toBe("~1h 30m");
  });
});
