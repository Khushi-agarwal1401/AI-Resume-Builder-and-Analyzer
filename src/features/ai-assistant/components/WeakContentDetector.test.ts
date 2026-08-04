import { describe, it, expect } from "vitest";
import { detectWeakContent } from "./WeakContentDetector";

describe("detectWeakContent", () => {
  it("returns empty array for empty text", () => {
    const results = detectWeakContent("");
    expect(results).toEqual([]);
  });

  it("returns empty array for undefined text", () => {
    const results = detectWeakContent(undefined as unknown as string);
    expect(results).toEqual([]);
  });

  it("returns empty array for clean text with no weak phrases", () => {
    const results = detectWeakContent(
      "Engineered scalable solutions using modern frameworks."
    );
    expect(results).toEqual([]);
  });

  it("detects 'hardworking' as a weak phrase", () => {
    const results = detectWeakContent(
      "Hardworking professional with 5 years of experience."
    );
    expect(results.some((r) => r.phrase === "hardworking")).toBe(true);
  });

  it("detects 'team player' as a weak phrase", () => {
    const results = detectWeakContent("I am a team player.");
    expect(results.some((r) => r.phrase === "team player")).toBe(true);
  });

  it("detects 'good communication skills' as a weak phrase", () => {
    const results = detectWeakContent(
      "I have good communication skills."
    );
    expect(results.some((r) => r.phrase === "good communication skills")).toBe(true);
  });

  it("is case insensitive", () => {
    const results = detectWeakContent("TEAM PLAYER with strong leadership.");
    expect(results.some((r) => r.phrase === "team player")).toBe(true);
  });

  it("handles mixed case", () => {
    const results = detectWeakContent("I Am A Team Player.");
    expect(results.some((r) => r.phrase === "team player")).toBe(true);
  });

  it("detects multiple weak phrases in the same text", () => {
    const results = detectWeakContent(
      "Hardworking team player with good communication skills. Detail oriented self motivated individual."
    );
    const phrases = results.map((r) => r.phrase);
    expect(phrases).toContain("hardworking");
    expect(phrases).toContain("team player");
    expect(phrases).toContain("good communication skills");
    expect(phrases).toContain("detail oriented");
    expect(phrases).toContain("self motivated");
  });

  it("limits results to 12 findings", () => {
    const text = Array.from({ length: 20 }, (_, i) => `Hardworking team player ${i}.`).join(" ");
    const results = detectWeakContent(text);
    expect(results.length).toBeLessThanOrEqual(12);
  });

  it("provides alternative for each weak phrase found", () => {
    const results = detectWeakContent("I am a hardworking team player.");
    results.forEach((r) => {
      expect(r.alternative).toBeTruthy();
      expect(r.alternative.length).toBeGreaterThan(0);
    });
  });

  it("returns the correct alternative for 'hardworking'", () => {
    const results = detectWeakContent("Hardworking professional.");
    const entry = results.find((r) => r.phrase === "hardworking");
    expect(entry).toBeDefined();
    expect(entry!.alternative).toContain("results-oriented");
  });

  it("returns the correct alternative for 'team player'", () => {
    const results = detectWeakContent("Team player with experience.");
    const entry = results.find((r) => r.phrase === "team player");
    expect(entry).toBeDefined();
    expect(entry!.alternative).toContain("cross-functionally");
  });

  it("provides surrounding context for each finding", () => {
    const results = detectWeakContent(
      "I describe myself as a hardworking professional who delivers results."
    );
    const entry = results.find((r) => r.phrase === "hardworking");
    expect(entry).toBeDefined();
    expect(entry!.context.length).toBeGreaterThan(0);
    expect(entry!.context.toLowerCase()).toContain("hardworking");
  });

  it("context truncates with ellipsis before when text exceeds window", () => {
    const text = "A very long introductory sentence that goes well beyond " +
      "the expected context window length. " +
      "I am a hardworking professional.";
    const results = detectWeakContent(text);
    const entry = results.find((r) => r.phrase === "hardworking");
    expect(entry).toBeDefined();
    expect(entry!.context).toMatch(/^\.\.\./);
  });

  it("context truncates with ellipsis after when text exceeds window", () => {
    const text = "I am a hardworking professional who consistently delivers " +
      "exceptional results across multiple projects and teams.";
    const results = detectWeakContent(text);
    const entry = results.find((r) => r.phrase === "hardworking");
    expect(entry).toBeDefined();
    expect(entry!.context).toMatch(/\.\.\.$/);
  });

  it("detects 'proven track record' as a weak phrase", () => {
    const results = detectWeakContent("I have a proven track record of success.");
    expect(results.some((r) => r.phrase === "proven track record")).toBe(true);
  });

  it("detects 'think outside the box'", () => {
    const results = detectWeakContent("I like to think outside the box.");
    expect(results.some((r) => r.phrase === "think outside the box")).toBe(true);
  });

  it("detects 'excellent verbal and written communication'", () => {
    const results = detectWeakContent(
      "Excellent verbal and written communication skills."
    );
    expect(results.some((r) => r.phrase === "excellent verbal and written communication")).toBe(true);
  });

  it("detects 'familiar with'", () => {
    const results = detectWeakContent("Familiar with React and TypeScript.");
    expect(results.some((r) => r.phrase === "familiar with")).toBe(true);
  });

  it("detects 'exposure to'", () => {
    const results = detectWeakContent("Exposure to cloud technologies.");
    expect(results.some((r) => r.phrase === "exposure to")).toBe(true);
  });

  it("detects 'knowledge of'", () => {
    const results = detectWeakContent("Knowledge of Python and SQL.");
    expect(results.some((r) => r.phrase === "knowledge of")).toBe(true);
  });

  it("detects 'various' as a weak word", () => {
    const results = detectWeakContent("Worked on various projects.");
    expect(results.some((r) => r.phrase === "various")).toBe(true);
  });

  it("detects 'etc' as a weak word", () => {
    const results = detectWeakContent("Experience with React, Node, etc.");
    expect(results.some((r) => r.phrase === "etc")).toBe(true);
  });

  it("detects 'things' as a weak word", () => {
    const results = detectWeakContent("Built many things for the company.");
    expect(results.some((r) => r.phrase === "things")).toBe(true);
  });

  it("detects 'responsible for' in resume context", () => {
    const results = detectWeakContent(
      "Responsible for managing the team's deliverables."
    );
    expect(results.some((r) => r.phrase === "responsible for")).toBe(true);
  });

  it("detects 'duties included'", () => {
    const results = detectWeakContent("My duties included code review.");
    expect(results.some((r) => r.phrase === "duties included")).toBe(true);
  });

  it("detects 'helped with'", () => {
    const results = detectWeakContent("Helped with the migration process.");
    expect(results.some((r) => r.phrase === "helped with")).toBe(true);
  });

  it("detects 'participated in'", () => {
    const results = detectWeakContent("Participated in sprint planning.");
    expect(results.some((r) => r.phrase === "participated in")).toBe(true);
  });

  it("detects 'results driven'", () => {
    const results = detectWeakContent("Results driven professional.");
    expect(results.some((r) => r.phrase === "results driven")).toBe(true);
  });

  it("handles resume-like text with multiple weak phrases", () => {
    const resumeText = `
      Hardworking software engineer with good communication skills.
      Team player with proven track record of delivering projects.
      Detail oriented and self motivated individual.
      Familiar with React, Node.js, etc.
      Responsible for various tasks.
    `;
    const results = detectWeakContent(resumeText);
    const phrases = results.map((r) => r.phrase);

    // Should detect at least these common resume clichés
    expect(phrases).toContain("hardworking");
    expect(phrases).toContain("good communication skills");
    expect(phrases).toContain("team player");
    expect(phrases).toContain("proven track record");
    expect(phrases).toContain("detail oriented");
    expect(phrases).toContain("self motivated");
    expect(phrases).toContain("familiar with");
    expect(phrases).toContain("responsible for");
    expect(phrases).toContain("various");
  });

  it("does not flag text with strong professional language", () => {
    const results = detectWeakContent(
      "Delivered 40% cost reduction through infrastructure optimization. " +
      "Led cross-functional team of 12 engineers to launch product ahead of schedule."
    );
    expect(results.length).toBe(0);
  });
});
