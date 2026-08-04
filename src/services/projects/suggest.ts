/**
 * Deterministic project-suggestion engine.
 *
 * Used as a fallback when the AI service is unavailable or returns garbage:
 * ranks a candidate's GitHub repos against a job posting using lightweight
 * keyword matching, then suggests "additions" — repos that cover skill gaps in
 * the top-ranked set even if they aren't the strongest overall matches.
 */

export interface RepoCandidate {
  name: string;
  description?: string;
  language?: string | null;
}

export interface ProjectRanking {
  repo: string;
  score: number;
  reason: string;
}

export interface ProjectSuggestion {
  repo: string;
  reason: string;
}

export interface ProjectSuggestions {
  rankings: ProjectRanking[];
  suggestedAdditions: ProjectSuggestion[];
}

/** Tokenize text into lowercase keywords (>=3 chars), dropping stopwords. */
const STOPWORDS = new Set([
  "the", "and", "for", "with", "you", "are", "your", "our", "this", "that",
  "from", "have", "will", "can", "into", "their", "they", "them", "job",
  "role", "work", "team", "candidate", "candidates", "will", "must", "able",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

/** Number of job tokens present in a repo's combined text (name+desc+language). */
function tokenHits(repo: RepoCandidate, tokens: string[]): Set<string> {
  const haystack = `${repo.name} ${repo.description || ""} ${repo.language || ""}`.toLowerCase();
  const hits = new Set<string>();
  for (const t of tokens) {
    if (haystack.includes(t)) hits.add(t);
  }
  return hits;
}

/**
 * Deterministically rank repos against a job posting.
 * Score = 2 per name hit + 1 per description/language hit, capped at 100.
 */
export function rankReposAgainstJob(
  repos: RepoCandidate[],
  jobText: string
): ProjectRanking[] {
  const tokens = tokenize(jobText);
  const scored = repos
    .map((repo) => {
      const hits = tokenHits(repo, tokens);
      const nameHits = [...hits].filter((t) =>
        repo.name.toLowerCase().includes(t)
      ).length;
      const score = Math.min(100, Math.round((nameHits * 2 + (hits.size - nameHits)) / Math.max(tokens.length, 1) * 100));
      return { repo, hits, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored.map(({ repo, hits, score }) => ({
    repo: repo.name,
    score,
    reason:
      hits.size > 0
        ? `Matches ${hits.size} keyword${hits.size === 1 ? "" : "s"} from the job posting (${[...hits].slice(0, 5).join(", ")})${hits.size > 5 ? "…" : ""}.`
        : "No direct keyword overlap — consider including only if it demonstrates a core skill.",
  }));
}

/**
 * Deterministically suggest additions: repos that cover keywords the top-ranked
 * set misses (skill gaps), so the user can boost their application.
 */
export function suggestProjectAdditions(
  repos: RepoCandidate[],
  jobText: string,
  topRankings: ProjectRanking[],
  maxAdditions = 3
): ProjectSuggestion[] {
  const tokens = tokenize(jobText);
  const rankedNames = new Set(topRankings.map((r) => r.repo));
  const topHits = new Set<string>();
  for (const r of repos) {
    if (rankedNames.has(r.name)) {
      for (const t of tokenHits(r, tokens)) topHits.add(t);
    }
  }

  // Repos that cover the most uncovered keywords.
  const gapCoverers = repos
    .filter((r) => !rankedNames.has(r.name))
    .map((r) => {
      const hits = [...tokenHits(r, tokens)].filter((t) => !topHits.has(t));
      return { repo: r, hits };
    })
    .filter((r) => r.hits.length > 0)
    .sort((a, b) => b.hits.length - a.hits.length);

  return gapCoverers.slice(0, maxAdditions).map(({ repo, hits }) => ({
    repo: repo.name,
    reason: `Adds coverage for ${hits.slice(0, 3).join(", ")} — a skill gap the job posting asks for.`,
  }));
}

/** Full deterministic pipeline used by the API fallback. */
export function suggestProjectsDeterministic(
  repos: RepoCandidate[],
  jobText: string
): ProjectSuggestions {
  const rankings = rankReposAgainstJob(repos, jobText).filter((r) => r.score > 0);
  return {
    rankings: rankings.slice(0, 5),
    suggestedAdditions: suggestProjectAdditions(repos, jobText, rankings),
  };
}
