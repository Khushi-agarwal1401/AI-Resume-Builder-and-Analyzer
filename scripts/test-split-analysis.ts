// Verify splitAtAnalysisMarker handles realistic AI output formats.
// Mirrors the regex in src/app/tools/application-kit/page.tsx
function splitAtAnalysisMarker(output: string): { content: string; analysis: string | null } {
  const marker = output.search(/(?:^|\n)\s*(?:#{1,6}\s+|\*\*\s*)?(?:[A-Z][A-Za-z' -]*\s+)?Analysis(?:\s*:)?(?:\s*\*\*)?\s*(?=\n|$)/i);
  if (marker === -1) return { content: output.trim(), analysis: null };
  return {
    content: output.slice(0, marker).trim(),
    analysis: output.slice(marker).trim(),
  };
}

const cases: { name: string; output: string }[] = [
  {
    name: "plain colon heading",
    output: "Subject: Software Engineer at Acme\n\nDear Hiring Manager,\n\nI would be a great fit.\n\nSincerely,\nRiya Sharma\n\nEmail Analysis:\n\n### Strengths\n- Direct hook",
  },
  {
    name: "bold markdown heading",
    output: "Dear Hiring Manager,\n\nI am writing...\n\nSincerely,\nRiya\n\n**Email Analysis:**\n\n### Personalization Score\n8/10",
  },
  {
    name: "markdown h2 heading no colon",
    output: "Subject: Re: Role\n\nHi,\n\nI am a fit.\n\nBest,\nRiya\n\n## Message Analysis\n\n### Job Fit\nStrong",
  },
  {
    name: "no analysis at all",
    output: "Subject: Application\n\nDear Hiring Manager,\n\nThanks for your time.\n\nBest,\nRiya",
  },
  {
    name: "sentence containing analysis mid-line (must not split)",
    output: "Dear Hiring Manager,\n\nMy analysis of the role shows I fit well.\n\nSincerely,\nRiya",
  },
  {
    name: "linkedin message analysis",
    output: "Hi Priya,\n\nI saw the Senior Full Stack role at Finlytics and my React/Node background maps well to it. I led a payments migration at PayFast handling 50k merchants. Would love to chat about your team's current challenges.\n\nBest,\nRiya\n\nLinkedIn Message Analysis:\n\n### Recruiter Risk\nNone found",
  },
];

let failures = 0;
for (const c of cases) {
  const { content, analysis } = splitAtAnalysisMarker(c.output);
  const hasAnalysis = analysis !== null;
  console.log(`\n=== ${c.name} ===`);
  console.log(`analysis extracted: ${hasAnalysis}`);
  console.log(`content ends with: "...${content.slice(-60)}"`);
  if (analysis) console.log(`analysis starts with: "${analysis.slice(0, 60)}..."`);

  const expectedHas = !["no analysis at all", "sentence containing analysis mid-line (must not split)"].includes(c.name);
  if (hasAnalysis !== expectedHas) {
    console.log(`✗ MISMATCH: expected analysis=${expectedHas}`);
    failures++;
  } else if (hasAnalysis && c.name === "sentence containing analysis mid-line (must not split)") {
    console.log("✗ MISMATCH: split on a mid-sentence word");
    failures++;
  }
}
console.log(`\n${failures === 0 ? "ALL PASS" : `${failures} FAILURES`}`);
process.exit(failures === 0 ? 0 : 1);
