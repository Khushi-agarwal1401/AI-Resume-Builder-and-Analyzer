import { describe, it, expect } from "vitest";
import { parseResumeText } from "./deterministic-import";

const FULL_RESUME = [
  "Jane Doe",
  "jane@acme.com | (555) 123-4567 | linkedin.com/in/jane",
  "",
  "SUMMARY",
  "Senior frontend engineer with 6 years of experience building React apps.",
  "",
  "EXPERIENCE",
  "Senior Engineer at Acme Corp",
  "Jan 2020 - Present",
  "- Built a design system used by 40+ developers",
  "- Led migration from Webpack to Vite",
  "",
  "Frontend Developer at Beta Labs (2017 - 2019)",
  "- Shipped mobile-first features used by 2M users",
  "",
  "EDUCATION",
  "B.Tech in Computer Science, MIT, 2014 - 2018, CGPA 8.5",
  "",
  "SKILLS",
  "TypeScript, React, Next.js, Docker, Git, AWS, Communication, Leadership",
  "",
  "PROJECTS",
  "resume-builder",
  "AI resume builder with real-time preview",
  "Technologies: React, Node.js, PostgreSQL",
  "",
  "CERTIFICATIONS",
  "AWS Certified Developer - Amazon (2021)",
  "",
  "ACHIEVEMENTS",
  "Won company hackathon 2023",
  "",
  "LANGUAGES",
  "English: Native, Spanish: Conversational",
].join("\n");

describe("parseResumeText", () => {
  it("extracts personal info (name, email, phone, linkedin)", () => {
    const r = parseResumeText(FULL_RESUME);
    expect(r.personalInfo.fullName).toBe("Jane Doe");
    expect(r.personalInfo.email).toBe("jane@acme.com");
    expect(r.personalInfo.phone).toContain("123-4567");
    expect(r.personalInfo.linkedin).toContain("linkedin.com/in/jane");
  });

  it("extracts the summary section", () => {
    const r = parseResumeText(FULL_RESUME);
    expect(r.summary).toContain("Senior frontend engineer");
    expect(r.summary).toContain("6 years");
  });

  it("extracts experience entries with role, company, dates, and responsibilities", () => {
    const r = parseResumeText(FULL_RESUME);
    expect(r.experience.length).toBe(2);

    const first = r.experience[0];
    expect(first.role).toContain("Senior Engineer");
    expect(first.company).toContain("Acme Corp");
    expect(first.startDate).toContain("2020");
    expect(first.current).toBe(true);
    expect(first.responsibilities).toHaveLength(2);
    expect(first.responsibilities[0]).toContain("design system");

    const second = r.experience[1];
    expect(second.role).toContain("Frontend Developer");
    expect(second.company).toContain("Beta Labs");
    expect(second.startDate).toContain("2017");
    expect(second.endDate).toContain("2019");
    expect(second.current).toBe(false);
  });

  it("extracts education with institution, degree, dates, and cgpa", () => {
    const r = parseResumeText(FULL_RESUME);
    expect(r.education.length).toBeGreaterThanOrEqual(1);
    const edu = r.education[0];
    expect(edu.institution).toContain("MIT");
    expect(edu.degree).toContain("B.Tech");
    expect(edu.startDate).toContain("2014");
    expect(edu.endDate).toContain("2018");
    expect(edu.cgpa).toContain("8.5");
  });

  it("categorizes skills into technical, frameworks, tools, and soft", () => {
    const r = parseResumeText(FULL_RESUME);
    expect(r.skills.technical).toContain("TypeScript");
    expect(r.skills.frameworks).toContain("React");
    expect(r.skills.frameworks).toContain("Next.js");
    expect(r.skills.tools).toContain("Docker");
    expect(r.skills.tools).toContain("Git");
    expect(r.skills.soft).toContain("Communication");
  });

  it("extracts projects with name, description, and technologies", () => {
    const r = parseResumeText(FULL_RESUME);
    expect(r.projects.length).toBeGreaterThanOrEqual(1);
    const p = r.projects[0];
    expect(p.name).toContain("resume-builder");
    expect(p.description).toContain("AI resume builder");
    expect(p.technologies).toContain("React");
  });

  it("extracts certifications, achievements, and languages", () => {
    const r = parseResumeText(FULL_RESUME);
    expect(r.certifications.some((c) => c.name.includes("AWS Certified"))).toBe(true);
    expect(r.achievements.some((a) => a.title.includes("hackathon"))).toBe(true);
    expect(r.languages.some((l) => l.name === "English" && l.proficiency === "Native")).toBe(true);
  });

  it("detects internship level for intern resumes", () => {
    const r = parseResumeText("Alex Lee\n\nEXPERIENCE\nSoftware Intern at Startup (2024)\n- Built APIs");
    expect(r.targetLevel).toBe("student_internship");
  });

  it("detects student level for student resumes", () => {
    const r = parseResumeText("Sam Patel\n\nEDUCATION\nB.Sc Computer Science, State University, 2022 - 2026\n\nSKILLS\nPython");
    expect(r.targetLevel).toBe("student");
  });

  it("detects fresher level for entry-level resumes", () => {
    const r = parseResumeText("Ravi Kumar\n\nSUMMARY\nFresher looking for first job\n\nSKILLS\nJava");
    expect(r.targetLevel).toBe("fresher");
  });

  it("defaults to experienced for professional resumes", () => {
    const r = parseResumeText(FULL_RESUME);
    expect(r.targetLevel).toBe("experienced");
  });

  it("returns empty structures for garbage input without crashing", () => {
    const r = parseResumeText("asdf 123 !!! @@@ ###");
    expect(r.experience).toEqual([]);
    expect(r.education).toEqual([]);
    expect(r.summary).toBe("");
    expect(r.personalInfo.fullName).toBe("");
  });
});
