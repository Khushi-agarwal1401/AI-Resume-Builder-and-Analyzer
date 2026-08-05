import { describe, it, expect } from "vitest";
import {
  normalizeBullet,
  bulletsEqual,
  bulletsSimilar,
  applyBulletRewrites,
  parseBulletPairs,
  type ExperienceEntry,
} from "./bullet-matcher";

function exp(overrides: Partial<ExperienceEntry> = {}): ExperienceEntry {
  return {
    company: "Acme",
    role: "Engineer",
    responsibilities: [],
    achievements: [],
    ...overrides,
  };
}

describe("normalizeBullet", () => {
  it("lowercases, trims, collapses whitespace, and drops trailing punctuation", () => {
    expect(normalizeBullet("  Built REST APIs.  ")).toBe("built rest apis");
    expect(normalizeBullet("Led  a  team!")).toBe("led a team");
  });
});

describe("bulletsEqual", () => {
  it("matches identical bullets", () => {
    expect(bulletsEqual("Built APIs.", "Built APIs.")).toBe(true);
  });

  it("matches across casing and trailing punctuation", () => {
    expect(bulletsEqual("built apis.", "Built APIs")).toBe(true);
  });

  it("rejects empty strings", () => {
    expect(bulletsEqual("", "Anything")).toBe(false);
    expect(bulletsEqual("   ", "   ")).toBe(false);
  });

  it("does not treat containment as equality", () => {
    expect(bulletsEqual("Built REST APIs", "Built REST")).toBe(false);
  });
});

describe("bulletsSimilar", () => {
  it("matches containment either way", () => {
    expect(bulletsSimilar("Developed REST APIs serving 300K users", "Developed REST APIs")).toBe(true);
    expect(bulletsSimilar("Developed REST APIs", "Developed REST APIs serving 300K users")).toBe(true);
  });

  it("matches on high word overlap (dropped short words)", () => {
    expect(bulletsSimilar("Led a team of 6 engineers", "Led team of 6 engineers")).toBe(true);
  });

  it("rejects unrelated bullets sharing only a common word", () => {
    expect(bulletsSimilar("Managed team budget", "Team building event")).toBe(false);
  });

  it("rejects empty inputs", () => {
    expect(bulletsSimilar("", "Anything")).toBe(false);
  });
});

describe("applyBulletRewrites", () => {
  it("replaces an exact match in responsibilities", () => {
    const experience = [exp({ responsibilities: ["Built REST APIs"] })];
    const result = applyBulletRewrites(experience, [
      { original: "Built REST APIs", rewrite: "Architected REST APIs serving 1M requests" },
    ]);

    expect(result.applied).toEqual(["Built REST APIs"]);
    expect(result.notFound).toEqual([]);
    expect(experience[0].responsibilities[0]).toBe("Architected REST APIs serving 1M requests");
  });

  it("replaces an exact match in achievements", () => {
    const experience = [exp({ achievements: ["Led team"] })];
    const result = applyBulletRewrites(experience, [
      { original: "Led team", rewrite: "Led team of 8 engineers" },
    ]);

    expect(result.applied).toEqual(["Led team"]);
    expect(experience[0].achievements[0]).toBe("Led team of 8 engineers");
  });

  it("prefers a global exact match over a fuzzy match in an earlier entry", () => {
    const experience = [
      exp({ responsibilities: ["Built REST APIs serving 300K users"] }), // fuzzy only
      exp({ responsibilities: ["Built REST APIs"] }), // exact
    ];
    const result = applyBulletRewrites(experience, [
      { original: "Built REST APIs", rewrite: "Architected the API layer" },
    ]);

    expect(result.applied).toEqual(["Built REST APIs"]);
    // The exact match (entry 2) wins, not the fuzzy one (entry 1).
    expect(experience[0].responsibilities[0]).toBe("Built REST APIs serving 300K users");
    expect(experience[1].responsibilities[0]).toBe("Architected the API layer");
  });

  it("falls back to a fuzzy match when no exact match exists", () => {
    const experience = [exp({ responsibilities: ["QA testing and wrote test cases for the app"] })];
    const result = applyBulletRewrites(experience, [
      { original: "QA testing and wrote test cases", rewrite: "Automated QA testing reducing defects by 40%" },
    ]);

    expect(result.applied.length).toBe(1);
    expect(experience[0].responsibilities[0]).toBe("Automated QA testing reducing defects by 40%");
  });

  it("applies each pair at most once", () => {
    const experience = [
      exp({ responsibilities: ["Built REST APIs"] }),
      exp({ responsibilities: ["Built REST APIs"] }),
    ];
    const result = applyBulletRewrites(experience, [
      { original: "Built REST APIs", rewrite: "Rewritten once" },
    ]);

    expect(result.applied).toEqual(["Built REST APIs"]);
    const rewritten = experience.flatMap((e) => e.responsibilities).filter((r) => r === "Rewritten once");
    expect(rewritten.length).toBe(1);
  });

  it("dedupes pairs whose rewrite already exists on the resume", () => {
    const experience = [exp({ responsibilities: ["Architected the API layer"] })];
    const result = applyBulletRewrites(experience, [
      { original: "Built APIs", rewrite: "Architected the API layer" },
    ]);

    expect(result.applied).toEqual([]);
    expect(result.alreadyPresent).toEqual(["Built APIs"]);
  });

  it("reports unmatched bullets as notFound", () => {
    const experience = [exp({ responsibilities: ["Built REST APIs"] })];
    const result = applyBulletRewrites(experience, [
      { original: "Completely unrelated bullet", rewrite: "A rewrite" },
    ]);

    expect(result.applied).toEqual([]);
    expect(result.notFound).toEqual(["Completely unrelated bullet"]);
    expect(experience[0].responsibilities[0]).toBe("Built REST APIs");
  });

  it("handles multiple pairs and multiple entries without cross-contamination", () => {
    const experience = [
      exp({ responsibilities: ["Built REST APIs", "Helped with QA"] }),
      exp({ responsibilities: ["Wrote docs"], achievements: ["Led team"] }),
    ];
    const result = applyBulletRewrites(experience, [
      { original: "Built REST APIs", rewrite: "R1" },
      { original: "Helped with QA", rewrite: "R2" },
      { original: "Led team", rewrite: "R3" },
      { original: "Does not exist", rewrite: "R4" },
    ]);

    expect(result.applied).toEqual(["Built REST APIs", "Helped with QA", "Led team"]);
    expect(result.notFound).toEqual(["Does not exist"]);
    expect(experience[0].responsibilities[0]).toBe("R1");
    expect(experience[0].responsibilities[1]).toBe("R2");
    expect(experience[1].achievements[0]).toBe("R3");
    expect(experience[1].responsibilities[0]).toBe("Wrote docs"); // untouched
  });

  it("preserves other entry fields when rewriting", () => {
    const experience = [
      exp({ company: "TechNova", role: "Senior Engineer", responsibilities: ["Built APIs"] }),
    ];
    applyBulletRewrites(experience, [{ original: "Built APIs", rewrite: "Rewritten" }]);

    expect(experience[0].company).toBe("TechNova");
    expect(experience[0].role).toBe("Senior Engineer");
  });

  it("returns the mutated experience array", () => {
    const experience = [exp({ responsibilities: ["Built APIs"] })];
    const result = applyBulletRewrites(experience, [{ original: "Built APIs", rewrite: "Rewritten" }]);
    expect(result.experience).toBe(experience);
  });
});

describe("parseBulletPairs", () => {
  it("parses valid pairs and trims", () => {
    const pairs = parseBulletPairs([
      { original: "  Built APIs  ", rewrite: "  Rewritten  " },
    ]);
    expect(pairs).toEqual([{ original: "Built APIs", rewrite: "Rewritten" }]);
  });

  it("drops pairs without a non-empty original", () => {
    const pairs = parseBulletPairs([
      { original: "ok", rewrite: "r" },
      { original: "", rewrite: "r" },
      { original: "   ", rewrite: "r" },
      { original: 42, rewrite: "r" },
      { original: null, rewrite: "r" },
    ]);
    expect(pairs).toEqual([{ original: "ok", rewrite: "r" }]);
  });

  it("caps at 20 pairs and truncates long strings", () => {
    const raw = Array.from({ length: 30 }, (_, i) => ({ original: `o${i}`, rewrite: "r" }));
    const pairs = parseBulletPairs(raw);
    expect(pairs.length).toBe(20);
    expect(parseBulletPairs([{ original: "x".repeat(600), rewrite: "y".repeat(600) }])).toEqual([
      { original: "x".repeat(500), rewrite: "y".repeat(500) },
    ]);
  });

  it("returns [] for non-array input", () => {
    expect(parseBulletPairs(null)).toEqual([]);
    expect(parseBulletPairs("nope")).toEqual([]);
    expect(parseBulletPairs(undefined)).toEqual([]);
  });
});
