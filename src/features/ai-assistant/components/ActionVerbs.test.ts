import { describe, it, expect } from "vitest";
import { findWeakVerbs } from "./ActionVerbs";

describe("findWeakVerbs", () => {
  it("returns empty array for empty text", () => {
    const results = findWeakVerbs("");
    expect(results).toEqual([]);
  });

  it("returns empty array for undefined text", () => {
    const results = findWeakVerbs(undefined as unknown as string);
    expect(results).toEqual([]);
  });

  it("returns empty array for text with no weak verbs", () => {
    const results = findWeakVerbs(
      "Engineered scalable microservices architecture deployed via Kubernetes."
    );
    expect(results).toEqual([]);
  });

  it("detects basic weak verb 'was'", () => {
    const results = findWeakVerbs("I was responsible for the frontend.");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((r) => r.word === "was")).toBe(true);
  });

  it("detects 'made' as a weak verb", () => {
    const results = findWeakVerbs("I made improvements to the system.");
    expect(results.some((r) => r.word === "made")).toBe(true);
  });

  it("detects 'responsible for' as a weak phrase", () => {
    const results = findWeakVerbs("I was responsible for managing the team.");
    expect(results.some((r) => r.word === "responsible for")).toBe(true);
  });

  it("is case insensitive", () => {
    const results = findWeakVerbs("I Worked on the API layer.");
    expect(results.some((r) => r.word === "worked")).toBe(true);
  });

  it("handles mixed case input", () => {
    const results = findWeakVerbs("I WAS the lead developer.");
    expect(results.some((r) => r.word === "was")).toBe(true);
  });

  it("detects multiple weak verbs in the same text", () => {
    const results = findWeakVerbs("I was responsible for the project. I helped the team. I used React.");
    const uniqueWords = new Set(results.map((r) => r.word));
    expect(uniqueWords.has("was")).toBe(true);
    expect(uniqueWords.has("helped")).toBe(true);
    expect(uniqueWords.has("used")).toBe(true);
  });

  it("limits results to 15 findings", () => {
    // Create text with many weak verb occurrences
    const text = Array.from({ length: 30 }, (_, i) => `I was responsible for task ${i}.`).join(" ");
    const results = findWeakVerbs(text);
    expect(results.length).toBeLessThanOrEqual(15);
  });

  it("detects 'duties included' phrase", () => {
    const results = findWeakVerbs("My duties included managing budgets.");
    expect(results.some((r) => r.word === "duties included")).toBe(true);
  });

  it("detects 'in charge of' phrase", () => {
    const results = findWeakVerbs("I was in charge of the engineering team.");
    expect(results.some((r) => r.word === "in charge of")).toBe(true);
  });

  it("provides surrounding context for each finding", () => {
    const results = findWeakVerbs("I was responsible for the frontend application.");
    const wasEntry = results.find((r) => r.word === "was");
    expect(wasEntry).toBeDefined();
    expect(wasEntry!.context.length).toBeGreaterThan(0);
    expect(wasEntry!.context.toLowerCase()).toContain("was");
  });

  it("context includes text before and after the weak verb", () => {
    const text = "Previously, I was responsible for leading a team of engineers at Acme Corp.";
    const results = findWeakVerbs(text);
    const wasEntry = results.find((r) => r.word === "was");
    expect(wasEntry).toBeDefined();
    // Context should include surrounding text
    expect(wasEntry!.context).toContain("responsible");
  });

  it("truncates context with ellipsis for text before the match", () => {
    const text = "A very long prefix text that goes beyond the context window " +
      "and continues to fill up space before the weak verb appears. " +
      "I was the lead developer on this project.";
    const results = findWeakVerbs(text);
    const wasEntry = results.find((r) => r.word === "was");
    expect(wasEntry).toBeDefined();
    expect(wasEntry!.context).toMatch(/^\.\.\./);
  });

  it("truncates context with ellipsis for text after the match", () => {
    const text = "I was the lead developer on this incredibly long project " +
      "that spans multiple sentences and goes well beyond the context window " +
      "to ensure proper truncation behavior is tested.";
    const results = findWeakVerbs(text);
    const wasEntry = results.find((r) => r.word === "was");
    expect(wasEntry).toBeDefined();
    expect(wasEntry!.context).toMatch(/\.\.\.$/);
  });

  it("provides correct character index for each finding", () => {
    const text = "I was responsible. I helped the team.";
    const results = findWeakVerbs(text);
    const wasEntry = results.find((r) => r.word === "was");
    const helpedEntry = results.find((r) => r.word === "helped");
    expect(wasEntry).toBeDefined();
    expect(helpedEntry).toBeDefined();
    expect(wasEntry!.index).toBeLessThan(helpedEntry!.index);
  });

  it("detects 'made' inside longer sentences", () => {
    const results = findWeakVerbs("Our team made significant progress on the migration project last quarter.");
    expect(results.some((r) => r.word === "made")).toBe(true);
  });

  it("handles text with only strong action verbs", () => {
    const results = findWeakVerbs(
      "Spearheaded the migration to microservices. " +
      "Architected a fault-tolerant system. " +
      "Engineered real-time data pipelines."
    );
    expect(results.length).toBe(0);
  });

  it("does not flag strong verbs as weak", () => {
    const results = findWeakVerbs(
      "Led a team of developers. " +
      "Delivered the project on time."
    );
    // "Led" should not match "lead" or "made"
    // "Delivered" should not match anything
    const weakWords = results.map((r) => r.word);
    expect(weakWords).not.toContain("led");
    expect(weakWords).not.toContain("delivered");
  });
});
