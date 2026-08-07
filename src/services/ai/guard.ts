/**
 * AI output/input guards (A-04, A-14):
 * - sanitizeUserContent: strip prompt-injection attempts before embedding
 *   user-supplied content into prompts, and enforce a size budget.
 * - validateNumericClaims: flag numeric claims in AI output that cannot be
 *   traced back to the source material (anti-fabrication guard).
 */

const MAX_INPUT_CHARS = 12_000;
const MAX_CONTEXT_CHARS = 30_000;

export { MAX_INPUT_CHARS, MAX_CONTEXT_CHARS };

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions|prompts?|messages|commands)/gi,
  /disregard\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions|prompts?|messages)/gi,
  /forget\s+(everything|all)\s+(above|previously|before)/gi,
  /system\s+prompt/gi,
  /you\s+are\s+(now|instead|really)\s+/gi,
  /act\s+as\s+(if\s+you\s+were|a\s+different|an?\s+unrestricted)/gi,
  /<\|im_start\|>|<\|im_end\|>|<\|system\|>/gi,
  /do\s+not\s+(follow|obey|comply\s+with)\s+(any\s+)?(instructions|the\s+above)/gi,
  /new\s+instructions?\s*:/gi,
];

/** Strip known instruction-override phrases and control sequences. */
export function sanitizeUserContent(raw: string): string {
  if (!raw) return "";
  let text = raw.replace(/\u0000/g, "");
  for (const pattern of INJECTION_PATTERNS) {
    text = text.replace(pattern, "");
  }
  return text.trim();
}

/**
 * Enforce the prompt size budget. Returns a sanitized, length-capped string,
 * or null when the content is too large to use at all (input over 2x budget).
 */
export function capContent(raw: string, isContext = false): string | null {
  if (!raw) return "";
  const sanitized = sanitizeUserContent(raw);
  const max = isContext ? MAX_CONTEXT_CHARS : MAX_INPUT_CHARS;
  if (sanitized.length > max * 2) return null;
  if (sanitized.length > max) return sanitized.slice(0, max);
  return sanitized;
}

const NUMERIC_CLAIM_PATTERNS: RegExp[] = [
  /\d+(?:\.\d+)?%/g,
  /\$\s?\d+(?:[.,]\d{3})*(?:\.\d+)?/g,
  /\d+(?:\.\d+)?\s*\+?\s*(?:years|yrs|months|weeks|days?|hours?)\b/gi,
  /\d+(?:\.\d+)?\s*\+?\s*(?:users|customers|clients|members|people|employees|students|downloads|views|visits|requests|messages|reviews|orders|sales|projects|features|bugs|tasks|commits|lines|queries|responses|conversions|registrations|signups|subscriptions)\b/gi,
  /\b(?:top|bottom|over|under)\s\d+/gi,
];

/** Extract untraceable numeric claims: numbers in output not present in source. */
export function validateNumericClaims(output: string, source: string): string[] {
  if (!output) return [];

  const sourceLower = source.toLowerCase();
  const warnings: string[] = [];
  const seen = new Set<string>();

  for (const pattern of NUMERIC_CLAIM_PATTERNS) {
    const matches = output.match(pattern) || [];
    for (const match of matches) {
      const normalized = match.toLowerCase().trim();
      if (seen.has(normalized)) continue;
      seen.add(normalized);

      const numberOnly = normalized.replace(/[^\d.,]/g, "");
      if (!numberOnly) continue;

      // Traceable if the exact claim or its number appears in the source
      const traceable =
        sourceLower.includes(normalized) || sourceLower.includes(numberOnly);
      if (!traceable) {
        warnings.push(
          `"${match}" looks like a metric that does not appear in your input. ` +
            "AI cannot verify it — replace it with a real number from your experience or remove it."
        );
      }
    }
  }

  return warnings;
}
