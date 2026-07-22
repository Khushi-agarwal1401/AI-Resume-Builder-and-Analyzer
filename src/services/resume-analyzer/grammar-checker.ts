export interface GrammarIssue {
  type: "spelling" | "grammar" | "style" | "passive-voice" | "weak-word";
  text: string;
  suggestion: string;
  severity: "high" | "medium" | "low";
}

const COMMON_MISTAKES: [RegExp, string, string][] = [
  [/\b(responsible for)\b/gi, "responsible for", "Try 'Managed', 'Led', or 'Owned' instead of 'Responsible for'"],
  [/\b(handled)\b/gi, "handled", "Use 'Managed', 'Operated', or 'Directed' instead of 'Handled'"],
  [/\b(worked on)\b/gi, "worked on", "Use 'Developed', 'Built', or 'Implemented' instead of 'Worked on'"],
  [/\b(was responsible for)\b/gi, "was responsible for", "Passive voice — rephrase to active voice"],
  [/\b(were responsible for)\b/gi, "were responsible for", "Passive voice — rephrase to active voice"],
  [/\b(was involved in)\b/gi, "was involved in", "Passive voice — rephrase with your specific contribution"],
  [/\b(duties included)\b/gi, "duties included", "Use action verbs instead of listing duties"],
  [/\b(responsibilities included)\b/gi, "responsibilities included", "Use action verbs instead of listing responsibilities"],
  [/\b(very)\b/gi, "very", "Replace 'very' with a stronger word or remove it"],
  [/\b(utilize)\b/gi, "utilize", "Use 'Use' instead of 'Utilize' for clarity"],
  [/\b(utilized)\b/gi, "utilized", "Use 'Used' instead of 'Utilized'"],
];

const PASSIVE_PATTERNS = [
  /\b(was|were|been|being)\s+(\w+ed)\b/gi,
  /\b(is|are|am)\s+(\w+ed)\b/gi,
];

const WEAK_WORDS = [
  /\b(good)\b/gi, /\b(nice)\b/gi, /\b(great)\b/gi, /\b(really)\b/gi,
  /\b(basically)\b/gi, /\b(essentially)\b/gi, /\b(maybe)\b/gi, /\b(perhaps)\b/gi,
];

export function checkGrammar(text: string): GrammarIssue[] {
  const issues: GrammarIssue[] = [];
  const lines = text.split("\n");

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];

    for (const [pattern, , suggestion] of COMMON_MISTAKES) {
      const matchResult = line.match(pattern);
      if (matchResult) {
        issues.push({
          type: matchResult[0] !== matchResult.input ? "grammar" : "style",
          text: matchResult[0],
          suggestion,
          severity: "medium",
        });
      }
    }

    for (const pattern of PASSIVE_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        issues.push({
          type: "passive-voice",
          text: match[0],
          suggestion: `Rewrite '${match[0]}' in active voice`,
          severity: "low",
        });
      }
    }

    for (const pattern of WEAK_WORDS) {
      const match = line.match(pattern);
      if (match) {
        issues.push({
          type: "weak-word",
          text: match[0],
          suggestion: `Replace '${match[0]}' with a more descriptive word`,
          severity: "low",
        });
      }
    }
  }

  const seen = new Set<string>();
  return issues.filter((i) => {
    const key = i.text + i.suggestion;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function calculateGrammarScore(issues: GrammarIssue[]): number {
  if (issues.length === 0) return 100;
  const high = issues.filter((i) => i.severity === "high").length;
  const medium = issues.filter((i) => i.severity === "medium").length;
  const low = issues.filter((i) => i.severity === "low").length;
  const deductions = high * 15 + medium * 5 + low * 2;
  return Math.max(0, Math.min(100, 100 - deductions));
}
