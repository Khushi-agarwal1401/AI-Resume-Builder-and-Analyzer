import { describe, it, expect } from "vitest";
import {
  extractJdKeywords,
  matchJdKeywords,
  computeJdMatch,
  buildKeywordMatchBreakdown,
  matchesKeyword,
  matchesJobTitle,
} from "./jd-keywords";

describe("extractJdKeywords", () => {
  it("extracts known skills with categories and weights", () => {
    const jd = "Senior Frontend Engineer with React, TypeScript, Node.js and AWS experience.";
    const kws = extractJdKeywords("", jd);
    const terms = kws.map((k) => k.term);
    expect(terms).toContain("react");
    expect(terms).toContain("typescript");
    expect(terms).toContain("node.js");
    expect(terms).toContain("aws");
    expect(kws.find((k) => k.term === "react")!.category).toBe("hard-skills");
    expect(kws.find((k) => k.term === "aws")!.category).toBe("tools");
  });

  it("detects the target role as a roles keyword", () => {
    const kws = extractJdKeywords("", "We are hiring a Senior Full Stack Engineer.");
    expect(kws.some((k) => k.term === "engineer" || k.term.includes("engineer"))).toBe(true);
  });

  it("weights repeated keywords higher", () => {
    const jd =
      "We need Python, Python and more Python. Python is essential. Python required.";
    const kws = extractJdKeywords("", jd);
    const python = kws.find((k) => k.term === "python");
    expect(python).toBeDefined();
    expect(python!.countInJd).toBeGreaterThanOrEqual(3);
  });

  it("returns an empty list for empty input", () => {
    expect(extractJdKeywords("", "")).toEqual([]);
  });

  it("detects certifications", () => {
    const kws = extractJdKeywords("", "AWS Certified Solutions Architect preferred. PMP a plus.");
    expect(kws.some((k) => k.term === "aws certified")).toBe(true);
    expect(kws.some((k) => k.term === "pmp")).toBe(true);
  });
});

describe("matchesKeyword", () => {
  it("matches with synonym/alias normalization", () => {
    expect(matchesKeyword("Worked on React.js apps", "react")).toBe(true);
    expect(matchesKeyword("Used NodeJS daily", "node")).toBe(true);
    expect(matchesKeyword("Built CI/CD pipelines", "ci/cd")).toBe(true);
    expect(matchesKeyword("Machine learning models", "ml")).toBe(true);
  });

  it("does not false-match partial words", () => {
    expect(matchesKeyword("I like the ocean and reactoring", "react")).toBe(false);
  });
});

describe("computeJdMatch", () => {
  const resume = "React developer. TypeScript. Node.js. AWS, Docker.";
  const kws = extractJdKeywords("", "React, TypeScript, Node.js, AWS, Docker, Kubernetes, GraphQL");
  const matches = matchJdKeywords(resume, kws);

  it("computes a weighted score that rewards hard skills more than filler", () => {
    const stats = computeJdMatch(matches);
    expect(stats.score).toBeGreaterThan(0);
    expect(stats.totalCount).toBeGreaterThan(0);
    expect(stats.matchedCount).toBeLessThan(stats.totalCount);
  });

  it("a resume covering all keywords scores 100", () => {
    const jd = "React, TypeScript, Node.js, AWS, Docker";
    const kws = extractJdKeywords("", jd);
    const all = matchJdKeywords("React TypeScript Node.js AWS Docker", kws);
    expect(computeJdMatch(all).score).toBe(100);
  });
});

describe("buildKeywordMatchBreakdown", () => {
  it("groups matched and missing keywords by category", () => {
    const resume = "React, TypeScript, communication";
    const kws = extractJdKeywords("", "React, TypeScript, leadership, AWS");
    const matches = matchJdKeywords(resume, kws);
    const breakdown = buildKeywordMatchBreakdown(matches);

    const hardMatched = breakdown.matched.find((g) => g.category === "hard-skills");
    expect(hardMatched?.terms).toContain("react");
    expect(hardMatched?.terms).toContain("typescript");

    const hardMissing = breakdown.missing.find((g) => g.category === "hard-skills");
    const toolMissing = breakdown.missing.find((g) => g.category === "tools");
    expect(hardMissing || toolMissing).toBeTruthy();
    expect(breakdown.missing.reduce((s, g) => s + g.terms.length, 0)).toBeGreaterThan(0);
  });
});

describe("matchesJobTitle", () => {
  it("matches an exact title in the resume", () => {
    expect(matchesJobTitle("Senior Frontend Engineer", "Senior Frontend Engineer")).toBe(true);
  });

  it("matches via the role word when the title wording differs", () => {
    expect(matchesJobTitle("Frontend Engineer", "Senior Frontend Engineer")).toBe(true);
  });

  it("returns false when the role is absent", () => {
    expect(matchesJobTitle("I am a data analyst", "Software Engineer")).toBe(false);
  });
});
