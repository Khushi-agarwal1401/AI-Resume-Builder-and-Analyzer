import { describe, it, expect } from "vitest";
import { parseOptimizedResume, normalizeAiMarkdown } from "./parse-optimized-resume";

const AI_OUTPUT = `# Jane Doe
New York, NY | jane@acme.com | (555) 123-4567 | linkedin.com/in/jane

## PROFESSIONAL SUMMARY
Senior frontend engineer with 6 years of experience building React, TypeScript, and Node.js applications.

## TECHNICAL SKILLS
* **Languages:** JavaScript, TypeScript, Python
* **Frameworks & Libraries:** React, Next.js, Node.js
* **Cloud & DevOps:** AWS, Docker, Git, CI/CD

## PROFESSIONAL EXPERIENCE
**Acme Corp** | Senior Frontend Engineer | Jan 2020 – Present
* Built a design system used by 40+ developers
* Led migration from Webpack to Vite

**Beta Labs** | Frontend Developer | 2017 – 2019
* Shipped mobile-first features used by 2M users

## EDUCATION
**State University**
Bachelor of Science in Computer Science

## PROJECTS
**resume-builder**
AI resume builder with real-time preview
`;

describe("parseOptimizedResume (ATS keyword optimizer output)", () => {
  it("extracts the summary cleanly without markdown", () => {
    const r = parseOptimizedResume(AI_OUTPUT);
    expect(r.summary).toBe(
      "Senior frontend engineer with 6 years of experience building React, TypeScript, and Node.js applications."
    );
  });

  it("groups skills by label into the right buckets", () => {
    const r = parseOptimizedResume(AI_OUTPUT);
    expect(r.skills.technical).toEqual(["JavaScript", "TypeScript", "Python"]);
    expect(r.skills.frameworks).toEqual(["React", "Next.js", "Node.js"]);
    expect(r.skills.tools).toContain("AWS");
    expect(r.skills.tools).toContain("CI/CD");
    // No label prefixes leaked into skill names.
    expect(r.skills.technical.some((s) => s.includes("Languages"))).toBe(false);
  });

  it("parses experience with company, role, dates and responsibilities", () => {
    const r = parseOptimizedResume(AI_OUTPUT);
    expect(r.experience).toHaveLength(2);

    const acme = r.experience[0];
    expect(acme.company).toBe("Acme Corp");
    expect(acme.role).toBe("Senior Frontend Engineer");
    expect(acme.startDate).toContain("Jan 2020");
    expect(acme.current).toBe(true);
    expect(acme.responsibilities).toEqual([
      "Built a design system used by 40+ developers",
      "Led migration from Webpack to Vite",
    ]);

    const beta = r.experience[1];
    expect(beta.company).toBe("Beta Labs");
    expect(beta.current).toBe(false);
    expect(beta.endDate).toContain("2019");
  });

  it("merges education institution + degree into one entry", () => {
    const r = parseOptimizedResume(AI_OUTPUT);
    expect(r.education).toHaveLength(1);
    expect(r.education[0].institution).toBe("State University");
    expect(r.education[0].degree).toBe("Bachelor of Science in Computer Science");
  });

  it("extracts project names", () => {
    const r = parseOptimizedResume(AI_OUTPUT);
    expect(r.projects[0].name).toBe("resume-builder");
    expect(r.projects[0].description).toContain("AI resume builder");
  });

  it("tolerates missing sections", () => {
    const r = parseOptimizedResume("# No Name\n\n## PROFESSIONAL SUMMARY\nShort summary here.");
    expect(r.summary).toBe("Short summary here.");
    expect(r.experience).toEqual([]);
    expect(r.skills.technical).toEqual([]);
  });

  it("handles 'Role at Company' headers too", () => {
    const r = parseOptimizedResume(
      "## PROFESSIONAL EXPERIENCE\nSenior Engineer at Acme Corp (Jan 2020 - Present)\n- Built internal tooling"
    );
    expect(r.experience[0].company).toBe("Acme Corp");
    expect(r.experience[0].role).toBe("Senior Engineer");
    expect(r.experience[0].responsibilities).toEqual(["Built internal tooling"]);
  });

  it("extracts YYYY-MM dates (the AI's common format) so company keeps its own field", () => {
    const r = parseOptimizedResume(
      "## PROFESSIONAL EXPERIENCE\nFull Stack Developer at TechCorp, Remote (2021-01 - Present)\n- Developed full-stack apps with React"
    );
    expect(r.experience[0].company).toBe("TechCorp");
    expect(r.experience[0].role).toBe("Full Stack Developer");
    expect(r.experience[0].location).toBe("Remote");
    expect(r.experience[0].startDate).toBe("2021-01");
    expect(r.experience[0].current).toBe(true);
  });

  it("still splits YYYY-YYYY year spans correctly", () => {
    const r = parseOptimizedResume(
      "## PROFESSIONAL EXPERIENCE\nBeta Labs | Frontend Developer | 2017 - 2019\n- Shipped features"
    );
    expect(r.experience[0].startDate).toBe("2017");
    expect(r.experience[0].endDate).toBe("2019");
    expect(r.experience[0].company).toBe("Beta Labs");
  });
});

describe("normalizeAiMarkdown", () => {
  it("strips heading markers and bold, keeping bullets", () => {
    const out = normalizeAiMarkdown("## PROFESSIONAL SUMMARY\n**Acme Corp** | Role\n* bullet");
    expect(out).toContain("PROFESSIONAL SUMMARY");
    expect(out).toContain("Acme Corp | Role");
    expect(out).toContain("• bullet");
    expect(out).not.toContain("**");
    expect(out).not.toContain("##");
  });
});
