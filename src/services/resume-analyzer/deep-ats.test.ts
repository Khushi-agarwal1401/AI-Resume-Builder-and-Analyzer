import { describe, it, expect } from "vitest";
import { analyzeDeepAts } from "./deep-ats";

const STRONG_RESUME = `John Doe
john@email.com | +1 555 123 4567 | linkedin.com/in/johndoe | github.com/johndoe

SUMMARY
Senior Software Engineer with 6+ years building scalable web applications.

EXPERIENCE
TechNova Solutions — Senior Software Engineer (2022 - Present)
- Architected microservices handling 100K+ daily active users
- Reduced API response time by 38% via query optimization
- Led a team of 6 engineers to ship 3 major releases

Acme Corp — Software Engineer (2019 - 2022)
- Built REST APIs in Node.js serving 300K users
- Automated CI/CD pipelines with Docker and GitHub Actions
- Migrated legacy monolith to Kubernetes on AWS

EDUCATION
B.Tech Computer Science, Stanford University (2015 - 2019), CGPA 3.8

SKILLS
JavaScript, TypeScript, React, Node.js, Python, SQL, Docker, Kubernetes, AWS, Git

PROJECTS
AI Resume Analyzer — ML-powered resume analysis tool with 94% accuracy
- Used TensorFlow and Python to classify resume sections`;

const WEAK_RESUME = `John Doe
john@email.com

SUMMARY
Hardworking team player with excellent communication skills. Passionate about technology.

EXPERIENCE
Some Company - Developer (2021-2023)
- Worked on various projects
- Responsible for fixing bugs
- Helped the team

EDUCATION
Some University

SKILLS
MS Office, Excel`;

describe("analyzeDeepAts", () => {
  it("scores a strong resume highly without a job description (resume-headings scan)", () => {
    const report = analyzeDeepAts({ text: STRONG_RESUME });
    expect(report.keywordScan).toBe("resume-headings");
    expect(report.atsScore).toBeGreaterThanOrEqual(60);
    expect(report.parserConfidence).toBeGreaterThanOrEqual(80);
    expect(report.interviewChance).toBe("YES");
    expect(report.detected).toContain("LinkedIn");
    expect(report.bullets.total).toBeGreaterThanOrEqual(7);
    expect(report.bullets.weak.length).toBeLessThanOrEqual(3);
    expect(report.disclaimer).toContain("Actual ATS scoring varies");
  });

  it("scores a weak resume low and flags weak bullets, missing keywords, and weak verbs", () => {
    const report = analyzeDeepAts({ text: WEAK_RESUME });
    expect(report.atsScore).toBeLessThan(60);
    expect(report.recruiterScore).toBeLessThan(60);
    expect(report.interviewChance).toBe("NO");
    expect(report.missingKeywords.length).toBeGreaterThan(0);
    expect(report.formattingIssues.length).toBeGreaterThan(0);
    // Weak verbs ("Worked on", "Responsible for") should be flagged as weak bullets
    const flaggedWeak = report.bullets.weak.some((w) => /worked on|responsible for/i.test(w.bullet));
    expect(flaggedWeak).toBe(true);
    // A rewrite is always suggested for weak bullets
    expect(report.bullets.weak[0].rewrite.length).toBeGreaterThan(0);
  });

  it("uses the job description keyword scan when a JD is provided", () => {
    const report = analyzeDeepAts({
      text: STRONG_RESUME,
      jobTitle: "Senior Full Stack Engineer",
      jobDescription: "We need a Senior Full Stack Engineer with React, Node.js, AWS, Kubernetes, Docker, CI/CD and GraphQL experience. Bonus: Go and Kafka.",
    });
    expect(report.keywordScan).toBe("job-description");
    expect(report.foundKeywords).toContain("react");
    expect(report.foundKeywords.some((k) => k === "node" || k === "node.js")).toBe(true);
    expect(report.foundKeywords).toContain("aws");
    // Not in the resume:
    expect(report.missingKeywords).toContain("graphql");
    // Synonym normalization: "ci/cd" found via "ci/cd" itself (in resume)
    expect(report.foundKeywords.length).toBeGreaterThan(0);
  });

  it("flags keyword stuffing in the density analysis", () => {
    const stuffed = STRONG_RESUME + "\n" + Array.from({ length: 15 }, (_, i) => `React is great for building ${i}`).join("\n");
    const report = analyzeDeepAts({ text: stuffed });
    const reactDensity = report.keywordDensity.find((d) => d.term === "react");
    expect(reactDensity).toBeDefined();
    expect(reactDensity!.flagged).toBe(true);
    expect(report.densityScore).toBeLessThan(90);
  });

  it("detects missing contact info and reduces parser confidence", () => {
    const noContact = `Jane Smith\n\nSUMMARY\nA summary without contact details.\n\nEDUCATION\nSome University\n\nSKILLS\nPython, SQL`;
    const report = analyzeDeepAts({ text: noContact });
    expect(report.missing).toContain("Email");
    expect(report.missing).toContain("Phone");
    expect(report.parserConfidence).toBeLessThan(60);
  });

  it("throws when no text is provided", () => {
    expect(() => analyzeDeepAts({ text: "   " })).toThrow();
  });
});
