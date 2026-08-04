import { describe, it, expect } from "vitest";
import {
  tokenize,
  rankReposAgainstJob,
  suggestProjectAdditions,
  suggestProjectsDeterministic,
} from "./suggest";

const REPOS = [
  { name: "react-dashboard", description: "Admin dashboard with charts and tables", language: "TypeScript" },
  { name: "ml-classifier", description: "Image classification with tensorflow", language: "Python" },
  { name: "portfolio-site", description: "Personal portfolio and blog", language: "JavaScript" },
  { name: "spring-api", description: "REST API backend with Spring Boot", language: "Java" },
  { name: "ci-pipeline", description: "Deployment pipelines and docker", language: "Go" },
];

describe("tokenize", () => {
  it("lowercases and drops stopwords and short tokens", () => {
    const tokens = tokenize("Build a React dashboard for the team with charts");
    expect(tokens).toContain("react");
    expect(tokens).toContain("dashboard");
    expect(tokens).toContain("charts");
    expect(tokens).not.toContain("the");
    expect(tokens).not.toContain("for");
    expect(tokens).not.toContain("team");
  });

  it("handles punctuation and hyphens", () => {
    const tokens = tokenize("machine-learning & data science, 2024");
    expect(tokens).toContain("machine");
    expect(tokens).toContain("learning");
    expect(tokens).toContain("data");
  });
});

describe("rankReposAgainstJob", () => {
  it("ranks the most keyword-relevant repo first", () => {
    const job = "Senior React developer building dashboards and charts with TypeScript";
    const rankings = rankReposAgainstJob(REPOS, job);
    expect(rankings[0].repo).toBe("react-dashboard");
    expect(rankings[0].score).toBeGreaterThan(rankings[1].score);
  });

  it("returns zero scores when nothing matches", () => {
    const job = "Nuclear reactor safety inspector for offshore rigs";
    const rankings = rankReposAgainstJob(REPOS, job);
    expect(rankings.every((r) => r.score === 0)).toBe(true);
  });

  it("never mutates input repos", () => {
    const before = JSON.stringify(REPOS);
    rankReposAgainstJob(REPOS, "React dashboard");
    expect(JSON.stringify(REPOS)).toBe(before);
  });
});

describe("suggestProjectAdditions", () => {
  it("suggests repos that fill keywords the ranked set misses", () => {
    const job = "React dashboard developer with Python machine learning";
    // Pretend only react-dashboard made the ranked cut — the ML repo covers
    // python/learning that react-dashboard doesn't, so it should be suggested.
    const topRankings = rankReposAgainstJob(REPOS, job).slice(0, 1);
    const additions = suggestProjectAdditions(REPOS, job, topRankings);
    expect(additions.some((a) => a.repo === "ml-classifier")).toBe(true);
  });

  it("never suggests repos already in the ranked set", () => {
    const job = "React dashboard developer with Python machine learning";
    const topRankings = rankReposAgainstJob(REPOS, job);
    const additions = suggestProjectAdditions(REPOS, job, topRankings);
    const rankedNames = new Set(topRankings.map((r) => r.repo));
    expect(additions.every((a) => !rankedNames.has(a.repo))).toBe(true);
  });

  it("caps the number of additions", () => {
    const job = "Full stack developer react python java go dashboard api";
    const topRankings = rankReposAgainstJob(REPOS, job).slice(0, 1);
    const additions = suggestProjectAdditions(REPOS, job, topRankings, 3);
    expect(additions.length).toBeLessThanOrEqual(3);
  });
});

describe("suggestProjectsDeterministic", () => {
  it("returns ranked + additions", () => {
    const result = suggestProjectsDeterministic(
      REPOS,
      "React dashboard developer with machine learning"
    );
    expect(result.rankings.length).toBeGreaterThan(0);
    expect(result.rankings[0].repo).toBe("react-dashboard");
    expect(Array.isArray(result.suggestedAdditions)).toBe(true);
  });

  it("returns empty rankings when no match", () => {
    const result = suggestProjectsDeterministic(REPOS, "farmer market vendor");
    expect(result.rankings).toEqual([]);
    expect(result.suggestedAdditions).toEqual([]);
  });
});
