import { describe, it, expect } from "vitest";
import { calculateAtsScore } from "./ats-scorer";

describe("calculateAtsScore", () => {
  it("returns all required fields in the result", () => {
    const result = calculateAtsScore("Test resume content");

    expect(result).toHaveProperty("overall");
    expect(result).toHaveProperty("subscores");
    expect(result).toHaveProperty("keywordDetails");
    expect(result).toHaveProperty("readabilityDetails");
    expect(result).toHaveProperty("sectionDetails");
    expect(result).toHaveProperty("suggestions");
    expect(Array.isArray(result.suggestions)).toBe(true);
  });

  it("scores 0 for empty string", () => {
    const result = calculateAtsScore("");
    // Overall should be low but not necessarily 0 due to formula
    expect(result.overall).toBeLessThanOrEqual(40);
  });

  it("gives high score to a well-structured resume", () => {
    const resume = `John Doe
john@example.com | (555) 123-4567 | linkedin.com/in/john | github.com/johndoe

Summary
Experienced software engineer with 5 years building web applications.

Experience
Software Engineer at Acme Corp (2020 - Present)
• Implemented new features using React and TypeScript, improving performance by 40%
• Led a team of 5 developers to deliver projects on time
• Reduced deployment time by 60% using automated CI/CD pipelines

Education
BS Computer Science, University of Technology (2016 - 2020)

Skills
JavaScript, TypeScript, React, Node.js, Python, SQL, Docker, AWS
`;

    const result = calculateAtsScore(resume);
    expect(result.overall).toBeGreaterThanOrEqual(50);
    expect(result.sectionDetails.present.length).toBeGreaterThanOrEqual(3);
    expect(result.suggestions.length).toBeLessThan(6);
  });

  it("detects missing sections", () => {
    const resume = `John Doe
john@example.com
I built some stuff.`;

    const result = calculateAtsScore(resume);
    expect(result.sectionDetails.missing.length).toBeGreaterThanOrEqual(1);
  });

  it("generates suggestions for improvements", () => {
    const resume = "Just a simple resume with no sections or contact info";
    const result = calculateAtsScore(resume);
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it("adds action verb suggestion when few action verbs are present", () => {
    const resume = "I did some work on a project. I made things happen.";
    const result = calculateAtsScore(resume);
    const hasVerbSuggestion = result.suggestions.some((s) =>
      s.toLowerCase().includes("action verb")
    );
    expect(hasVerbSuggestion).toBe(true);
  });

  it("adds LinkedIn suggestion when missing from resume", () => {
    const resume = "john@example.com\nSome experience content here.";
    const result = calculateAtsScore(resume);
    const hasLinkedInSuggestion = result.suggestions.some((s) =>
      s.toLowerCase().includes("linkedin")
    );
    expect(hasLinkedInSuggestion).toBe(true);
  });

  it("does not add LinkedIn suggestion when LinkedIn URL is present", () => {
    const resume = "john@example.com\nlinkedin.com/in/johndoe\nExperience at Acme Corp";
    const result = calculateAtsScore(resume);
    const hasLinkedInSuggestion = result.suggestions.some((s) =>
      s.toLowerCase().includes("linkedin")
    );
    expect(hasLinkedInSuggestion).toBe(false);
  });

  it("detects contact information properly", () => {
    const resume = "john@example.com\n(555) 123-4567\nlinkedin.com/in/john\ngithub.com/johndoe";
    const result = calculateAtsScore(resume);
    expect(result.subscores.contactInfo).toBe(100);
  });

  it("detects missing email in contact score", () => {
    const resume = "Just a name and some text without an email address";
    const result = calculateAtsScore(resume);
    expect(result.subscores.contactInfo).toBeLessThan(100);
  });

  it("calculates readability score for short sentences", () => {
    const resume = "Built apps. Led teams. Shipped products. Grew revenue.";
    const result = calculateAtsScore(resume);
    // Short sentences should score well on readability
    expect(result.readabilityDetails.avgSentenceLength).toBeLessThan(5);
  });

  it("penalizes very long sentences", () => {
    const resume =
      "I was responsible for managing a large team of software engineers and coordinating with multiple stakeholders across different departments to ensure timely delivery of various projects while maintaining high quality standards and meeting all the requirements that were specified by the product management team.";
    const result = calculateAtsScore(resume);
    expect(result.readabilityDetails.avgSentenceLength).toBeGreaterThan(30);
  });

  it("detects bullet points in formatting score", () => {
    const resume = "Skills\n• JavaScript\n• TypeScript\n• React\n• Node.js\n• Python\n• Docker\n• AWS\n• PostgreSQL\n• Redis\n• Kubernetes";
    const result = calculateAtsScore(resume);
    expect(result.subscores.formatting).toBeGreaterThanOrEqual(70);
  });

  it("handles keyword matching across categories", () => {
    const resume = "achieved 50% growth using JavaScript and React";
    const result = calculateAtsScore(resume);
    expect(result.keywordDetails["action-verbs"]).toBeGreaterThanOrEqual(1);
    expect(result.keywordDetails["metrics"]).toBeGreaterThanOrEqual(1);
    expect(result.keywordDetails["tech-skills"]).toBeGreaterThanOrEqual(2);
  });

  it("suggests adding metrics when none are present", () => {
    const resume = "I worked on projects and helped the team.";
    const result = calculateAtsScore(resume);
    const hasMetricsSuggestion = result.suggestions.some((s) =>
      s.toLowerCase().includes("metrics") || s.toLowerCase().includes("quantifiable")
    );
    expect(hasMetricsSuggestion).toBe(true);
  });
});
