import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPrompt, invalidatePrompt } from "./prompts";
import { generateLocalFallback, LOCAL_FALLBACK_NOTICE } from "./local-fallback";

// No `prompts` row in the DB → getPrompt falls back to DEFAULT_PROMPTS.
vi.mock("@/lib/db/server", () => ({
  createServerClient: vi.fn().mockResolvedValue({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(async () => ({ data: null, error: null })),
        })),
      })),
    })),
  }),
}));

beforeEach(() => {
  // The module caches resolved templates for 60s — clear between tests.
  invalidatePrompt();
});

describe("ats-keyword-optimization prompt", () => {
  it("resolves the full ATS keyword optimization template from the defaults", async () => {
    const template = await getPrompt("ats-keyword-optimization");

    // Core instructions from the prompt definition.
    expect(template).toContain("expert ATS optimization specialist");
    expect(template).toContain("Identify the most important:");
    expect(template).toContain("Job-role keywords");
    expect(template).toContain("naturally incorporate the strongest relevant keywords");
    expect(template).toContain("Professional Summary");
    expect(template).toContain("## Critical Rules");
    expect(template).toContain("Only use keywords supported by the candidate's actual background");
    expect(template).toContain("Do not keyword-stuff");
    expect(template).toContain("Do not create an artificial \"ATS keyword\" paragraph");
    expect(template).toContain("The goal is not maximum keyword count");
  });

  it("keeps the {input}/{context} placeholders the AI client fills in", async () => {
    const template = await getPrompt("ats-keyword-optimization");

    expect(template).toContain("Candidate's resume:\n{context}");
    expect(template).toContain("Target role / job description:\n{input}");
  });

  it("is a distinct action — not the add-keywords suggestion prompt", async () => {
    const template = await getPrompt("ats-keyword-optimization");
    const addKeywords = await getPrompt("add-keywords");

    expect(template).not.toBe(addKeywords);
    expect(template).not.toContain("suggest which to add to the resume");
  });
});

describe("ats-keyword-optimization local fallback", () => {
  it("returns the resume unchanged with the offline notice when no AI is available", () => {
    const resume = "Full-stack developer with 4 years of experience.\nSkills: React, Node.js, AWS";

    const output = generateLocalFallback({
      action: "ats-keyword-optimization",
      input: "Senior Full Stack Engineer",
      context: resume,
    });

    expect(output).toBe(resume.trim() + LOCAL_FALLBACK_NOTICE);
    expect(output).toContain("Generated locally");
  });

  it("handles an empty resume gracefully", () => {
    const output = generateLocalFallback({
      action: "ats-keyword-optimization",
      input: "Frontend Developer",
      context: "",
    });

    expect(output).toContain("No resume data provided to optimize");
    expect(output).toContain("Generated locally");
  });

  it("never fabricates keywords in the offline path — it echoes only the user's data", () => {
    const resume = "Data analyst using SQL and Excel.";
    const output = generateLocalFallback({
      action: "ats-keyword-optimization",
      input: "Senior Data Analyst — must know Python, Tableau, Airflow",
      context: resume,
    });

    expect(output).toBe(resume.trim() + LOCAL_FALLBACK_NOTICE);
    // JD-only skills must NOT appear — they aren't in the candidate's background.
    expect(output).not.toContain("Python");
    expect(output).not.toContain("Tableau");
  });
});
