import { describe, it, expect } from "vitest";

/**
 * Mirror of the tryParseJson helper in the analyze-jd route.
 * Tested independently since the route is not directly importable for unit tests.
 */
function tryParseJson(text: string): Record<string, unknown> | null {
  try {
    const cleaned = text
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

/**
 * Mirror of the result mapping logic from the analyze-jd route.
 * Tests that AI output is correctly mapped to the response shape.
 */
function mapAiToResult(
  aiOutput: string,
  fallback: {
    matchPercentage: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    missingSkills: string[];
    missingTools: string[];
    experienceGap: string | null;
  }
) {
  const aiData: Record<string, unknown> | null = aiOutput
    ? (tryParseJson(aiOutput) as Record<string, unknown> | null)
    : null;

  return {
    matchPercentage: (aiData?.matchPercentage as number) ?? fallback.matchPercentage,
    overallMatch: (aiData?.matchPercentage as number) ?? fallback.matchPercentage,
    overallAssessment: (aiData?.overallAssessment as string) || null,
    matchedKeywords: (aiData?.matchedKeywords as string[]) || fallback.matchedKeywords,
    missingKeywords: (aiData?.missingKeywords as string[]) || fallback.missingKeywords,
    missingSkills: (aiData?.missingSkills as string[]) || fallback.missingSkills,
    missingTools: (aiData?.missingTools as string[]) || fallback.missingTools,
    experienceGap: (aiData?.experienceGap as string) || fallback.experienceGap,
    strengths: (aiData?.strengths as string[]) || [],
    weaknesses: (aiData?.weaknesses as string[]) || [],
    actionableSuggestions: (aiData?.actionableSuggestions as string[]) || (aiData?.suggestions as string[]) || [],
    rewrittenBullets: (aiData?.rewrittenBullets as string[]) || [],
    aiSuggestions: (aiData?.actionableSuggestions as string[]) || (aiData?.suggestions as string[]) || [],
  };
}

// ─── tryParseJson ───────────────────────────────────────────────────────────

describe("tryParseJson", () => {
  it("parses valid JSON", () => {
    const result = tryParseJson('{"matchPercentage": 75}');
    expect(result).toEqual({ matchPercentage: 75 });
  });

  it("parses JSON wrapped in markdown code fences", () => {
    const input = '```json\n{"matchPercentage": 80, "strengths": ["React"]}\n```';
    const result = tryParseJson(input);
    expect(result).toEqual({ matchPercentage: 80, strengths: ["React"] });
  });

  it("parses JSON wrapped in bare code fences", () => {
    const input = '```\n{"matchPercentage": 60}\n```';
    const result = tryParseJson(input);
    expect(result).toEqual({ matchPercentage: 60 });
  });

  it("handles leading/trailing whitespace", () => {
    const result = tryParseJson('  {"matchPercentage": 50}  ');
    expect(result).toEqual({ matchPercentage: 50 });
  });

  it("returns null for invalid JSON", () => {
    expect(tryParseJson("not json at all")).toBeNull();
    expect(tryParseJson("{incomplete")).toBeNull();
    expect(tryParseJson("")).toBeNull();
  });

  it("parses complex AI output with all new fields", () => {
    const aiOutput = JSON.stringify({
      matchPercentage: 72,
      overallAssessment: "Strong candidate with relevant frontend experience.",
      matchedKeywords: ["react", "typescript", "node.js"],
      missingKeywords: ["docker", "kubernetes"],
      missingSkills: ["docker"],
      missingTools: ["kubernetes"],
      experienceGap: "Job requires 5+ years, resume shows 3 years",
      strengths: ["Strong React skills", "Good TypeScript knowledge"],
      weaknesses: ["Missing DevOps experience"],
      actionableSuggestions: ["Add Docker to your skillset", "Learn Kubernetes basics"],
      rewrittenBullets: ["Built 5+ React apps with TypeScript"],
    });
    const result = tryParseJson(aiOutput);
    expect(result).not.toBeNull();
    expect(result!.matchPercentage).toBe(72);
    expect(result!.strengths).toEqual(["Strong React skills", "Good TypeScript knowledge"]);
    expect(result!.actionableSuggestions).toEqual(["Add Docker to your skillset", "Learn Kubernetes basics"]);
  });
});

// ─── Result mapping ─────────────────────────────────────────────────────────

describe("mapAiToResult", () => {
  const fallback = {
    matchPercentage: 45,
    matchedKeywords: ["react"],
    missingKeywords: ["docker", "kubernetes"],
    missingSkills: ["docker"],
    missingTools: ["kubernetes"],
    experienceGap: null as string | null,
  };

  it("uses AI data when available", () => {
    const aiOutput = JSON.stringify({
      matchPercentage: 85,
      overallAssessment: "Excellent match for this role.",
      matchedKeywords: ["react", "typescript", "node.js"],
      missingKeywords: ["docker"],
      missingSkills: ["docker"],
      missingTools: [],
      experienceGap: "No experience gap",
      strengths: ["Strong React"],
      weaknesses: ["No DevOps"],
      actionableSuggestions: ["Learn Docker"],
      rewrittenBullets: ["Built React apps"],
    });

    const result = mapAiToResult(aiOutput, fallback);
    expect(result.matchPercentage).toBe(85);
    expect(result.overallMatch).toBe(85);
    expect(result.overallAssessment).toBe("Excellent match for this role.");
    expect(result.matchedKeywords).toEqual(["react", "typescript", "node.js"]);
    expect(result.missingKeywords).toEqual(["docker"]);
    expect(result.strengths).toEqual(["Strong React"]);
    expect(result.weaknesses).toEqual(["No DevOps"]);
    expect(result.actionableSuggestions).toEqual(["Learn Docker"]);
    expect(result.rewrittenBullets).toEqual(["Built React apps"]);
  });

  it("falls back to engine results when AI output is empty", () => {
    const result = mapAiToResult("", fallback);
    expect(result.matchPercentage).toBe(45); // fallback
    expect(result.overallAssessment).toBeNull();
    expect(result.matchedKeywords).toEqual(["react"]); // fallback
    expect(result.missingKeywords).toEqual(["docker", "kubernetes"]); // fallback
    expect(result.missingSkills).toEqual(["docker"]); // fallback
    expect(result.missingTools).toEqual(["kubernetes"]); // fallback
    expect(result.strengths).toEqual([]);
    expect(result.weaknesses).toEqual([]);
    expect(result.actionableSuggestions).toEqual([]);
  });

  it("falls back when AI output is invalid JSON", () => {
    const result = mapAiToResult("this is not json", fallback);
    expect(result.matchPercentage).toBe(45); // fallback
    expect(result.overallAssessment).toBeNull();
  });

  it("supports legacy 'suggestions' field from older AI prompts", () => {
    const aiOutput = JSON.stringify({
      matchPercentage: 60,
      suggestions: ["Add Docker", "Learn Kubernetes"],
    });
    const result = mapAiToResult(aiOutput, fallback);
    // suggestions should map to actionableSuggestions and aiSuggestions
    expect(result.actionableSuggestions).toEqual(["Add Docker", "Learn Kubernetes"]);
    expect(result.aiSuggestions).toEqual(["Add Docker", "Learn Kubernetes"]);
    // actionableSuggestions takes priority over suggestions
    expect(result.actionableSuggestions).toEqual(["Add Docker", "Learn Kubernetes"]);
  });

  it("actionableSuggestions takes priority over suggestions", () => {
    const aiOutput = JSON.stringify({
      matchPercentage: 60,
      suggestions: ["Old suggestion"],
      actionableSuggestions: ["New suggestion"],
    });
    const result = mapAiToResult(aiOutput, fallback);
    expect(result.actionableSuggestions).toEqual(["New suggestion"]);
    expect(result.aiSuggestions).toEqual(["New suggestion"]);
  });

  it("defaults empty arrays for missing AI fields", () => {
    const aiOutput = JSON.stringify({ matchPercentage: 50 });
    const result = mapAiToResult(aiOutput, fallback);
    expect(result.strengths).toEqual([]);
    expect(result.weaknesses).toEqual([]);
    expect(result.actionableSuggestions).toEqual([]);
    expect(result.rewrittenBullets).toEqual([]);
    expect(result.overallAssessment).toBeNull();
  });

  it("handles partial AI output gracefully", () => {
    const aiOutput = JSON.stringify({
      matchPercentage: 70,
      strengths: ["Good skills"],
      // missing weaknesses, suggestions, etc.
    });
    const result = mapAiToResult(aiOutput, fallback);
    expect(result.matchPercentage).toBe(70);
    expect(result.strengths).toEqual(["Good skills"]);
    expect(result.weaknesses).toEqual([]);
    // Falls back to engine for missingKeywords etc.
    expect(result.missingKeywords).toEqual(["docker", "kubernetes"]);
  });
});
