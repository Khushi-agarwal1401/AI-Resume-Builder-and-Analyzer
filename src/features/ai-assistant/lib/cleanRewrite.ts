/**
 * Cleans AI section-rewrite output so only the actual rewritten text remains.
 *
 * Weaker models frequently wrap the rewrite in meta text, e.g.:
 *
 *   "Here's a rewritten version of the section with action verbs:
 *
 *    Section: Results-driven software engineer driving the development of...
 *
 *    Alternatively, you could also use:
 *
 *    Section: Accomplished software engineer specializing in crafting...
 *
 *    These rewritten versions aim to make a stronger impact by using action
 *    verbs like "driving", "design", "build"..."
 *
 * We keep the FIRST version and drop every piece of meta text around it.
 */

/** Single-line preamble like "Here's a rewritten version of the section with action verbs:" */
const PREAMBLE_LINE = /^(?:here'?s|here is|below is|this is|sure!?|sure,?|of course!?|ok(?:ay)?,?|absolutely!?|i'?ve (?:rewritten|improved|updated)|i have (?:rewritten|improved|updated)|take a look at this|check out this|please find|attached is)[^:]*:?\s*$/i;

/** Inline preamble when model puts everything on one line: "Here's the improved summary: <text>" */
const INLINE_PREAMBLE = /^(?:here'?s|here is|below is|this is) (?:a |an |the )?(?:rewritten|improved|updated|new|better) (?:version|summary|section|draft) of[^:]{0,80}?:\s*/i;

/** Label prefix on the content line itself: "Section: <text>", "**Section:** <text>" */
const LABEL_PREFIX = /^\s*(?:\*\*)?(?:section|summary|professional summary|original|rewritten|improved|updated|version|new version)(?:\*\*)?\s*:\s*(?:\*\*)?/i;

/** "Alternatively, you could also use:" — everything after this is a second version + meta. */
const ALTERNATIVES_MARKER = /\balternatively\b/i;

/** Trailing explanatory paragraph openers, e.g. "These rewritten versions aim to..." */
const TRAILING_META = /^(?:these (?:rewritten|improved|versions?)|this (?:rewritten|improved|version|draft)|the (?:rewritten|improved|version|draft)|i hope|hope this|let me know|feel free to|if you (?:need|want)|please (?:let|feel)|would you like|that'?s (?:a|the)|both versions?|the first version|the second version|here are|above are|the above)\b/i;

export function cleanRewriteOutput(raw: string): string {
  let text = raw?.trim() ?? "";
  if (!text) return "";

  // Keep only the first version when the model offers alternatives.
  const altIdx = text.search(ALTERNATIVES_MARKER);
  if (altIdx !== -1) text = text.slice(0, altIdx).trim();

  // Strip leading single-line preamble ("Here's a rewritten version...:").
  let lines = text.split("\n");
  while (lines.length > 1 && PREAMBLE_LINE.test(lines[0].trim())) {
    lines.shift();
  }
  text = lines.join("\n").trim();

  // Strip inline preamble on the same line ("Here's the improved summary: ...").
  text = text.replace(INLINE_PREAMBLE, "").trim();

  // Remove a leading "Section:" / "**Summary:**" style label.
  text = text.replace(LABEL_PREFIX, "").trim();

  // Cut trailing meta paragraphs ("These rewritten versions aim to...").
  lines = text.split("\n");
  const cutIdx = lines.findIndex((l) => TRAILING_META.test(l.trim()));
  if (cutIdx !== -1) lines = lines.slice(0, cutIdx);
  text = lines.join("\n").trim();

  // Collapse 3+ blank lines and drop trailing whitespace.
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

/** Trailing explanatory note openers the model appends after a full resume
 *  rewrite, e.g. "Note: I've incorporated the strongest relevant keywords...". */
const TRAILING_NOTE = /^(?:\*\*)?(?:note\b|note that|i'?ve incorporated|i have incorporated|i incorporated|i hope|hope this|let me know|please let me know|feel free to|the keywords? (?:were|are)|these keywords? (?:were|are)|above is|the above)\b/i;

/**
 * Cleans full-resume rewrite output (ATS keyword optimization, resume
 * optimizer) so only the resume itself remains.
 *
 * Unlike `cleanRewriteOutput` — which is for single sections and strips a
 * leading label like "Section:" — this keeps ALL resume content, including
 * section headings like "**Professional Summary:**". It only:
 *   1. drops a leading single-line preamble ("Here is the optimized resume:"),
 *   2. removes trailing note/explanation paragraphs the model adds after the
 *      resume (end-anchored, so mid-resume content is never touched).
 */
export function cleanResumeRewrite(raw: string): string {
  let text = raw?.trim() ?? "";
  if (!text) return "";

  // Strip a leading single-line preamble ("Here is the optimized resume:").
  const lines = text.split("\n");
  while (lines.length > 1 && PREAMBLE_LINE.test(lines[0].trim())) {
    lines.shift();
  }
  text = lines.join("\n").trim();

  // End-anchored: pop trailing note/explanation paragraphs only.
  const paragraphs = text.split(/\n\s*\n/);
  while (paragraphs.length > 1 && TRAILING_NOTE.test(paragraphs[paragraphs.length - 1].trim())) {
    paragraphs.pop();
  }
  text = paragraphs.join("\n\n").trim();

  return text.replace(/\n{3,}/g, "\n\n").trim();
}
