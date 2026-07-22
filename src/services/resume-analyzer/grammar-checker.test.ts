import { describe, it, expect } from "vitest";
import { checkGrammar, calculateGrammarScore, type GrammarIssue } from "./grammar-checker";

describe("checkGrammar", () => {
  it("returns empty array for clean text", () => {
    const issues = checkGrammar("I built a responsive web application using React and TypeScript.");
    expect(issues.length).toBe(0);
  });

  it("flags 'responsible for' as a weak phrase", () => {
    const issues = checkGrammar("I was responsible for managing the team.");
    const hasIssue = issues.some((i) => i.text.toLowerCase().includes("responsible for"));
    expect(hasIssue).toBe(true);
  });

  it("flags 'handled' as a weak word", () => {
    const issues = checkGrammar("I handled customer requests.");
    const hasIssue = issues.some((i) => i.text.toLowerCase() === "handled");
    expect(hasIssue).toBe(true);
  });

  it("flags 'worked on' as a weak phrase", () => {
    const issues = checkGrammar("I worked on the frontend application.");
    const hasIssue = issues.some((i) => i.text.toLowerCase().includes("worked on"));
    expect(hasIssue).toBe(true);
  });

  it("flags passive voice constructions with -ed verbs", () => {
    const issues = checkGrammar("The application was created by the team.");
    const hasPassive = issues.some((i) => i.type === "passive-voice");
    expect(hasPassive).toBe(true);
  });

  it("flags weak words like 'good', 'nice', 'really'", () => {
    const issues = checkGrammar("I did a really good job on the project. It was nice work.");
    const weakWordIssues = issues.filter((i) => i.type === "weak-word");
    expect(weakWordIssues.length).toBeGreaterThanOrEqual(1);
  });

  it("deduplicates identical issues across lines", () => {
    const issues = checkGrammar("responsible for feature X\nresponsible for feature Y");
    // Should deduplicate the two identical "responsible for" issues
    const respIssues = issues.filter((i) => i.text === "responsible for");
    expect(respIssues.length).toBe(1);
  });

  it("handles empty text", () => {
    const issues = checkGrammar("");
    expect(issues).toEqual([]);
  });
});

describe("calculateGrammarScore", () => {
  it("returns 100 for no issues", () => {
    expect(calculateGrammarScore([])).toBe(100);
  });

  it("deducts more for high severity issues", () => {
    const highIssues: GrammarIssue[] = [
      { type: "grammar", text: "test", suggestion: "fix", severity: "high" },
    ];
    const lowIssues: GrammarIssue[] = [
      { type: "grammar", text: "test", suggestion: "fix", severity: "low" },
    ];
    expect(calculateGrammarScore(highIssues)).toBeLessThan(calculateGrammarScore(lowIssues));
  });

  it("returns minimum 0 for many issues", () => {
    const manyIssues: GrammarIssue[] = Array.from({ length: 20 }, (_, i) => ({
      type: "grammar" as const,
      text: `issue ${i}`,
      suggestion: "fix",
      severity: "high" as const,
    }));
    expect(calculateGrammarScore(manyIssues)).toBe(0);
  });
});
