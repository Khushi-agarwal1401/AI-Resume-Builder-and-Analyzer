import { describe, it, expect } from "vitest";
import { cleanRewriteOutput, cleanResumeRewrite } from "./cleanRewrite";

describe("cleanRewriteOutput", () => {
  it("strips the reported meta response and keeps the first version only", () => {
    const raw = `Here's a rewritten version of the section with action verbs:

Section: Results-driven software engineer driving the development of scalable web applications, leveraging technical expertise to design, build, and deliver high-quality solutions that meet evolving business needs.

Alternatively, you could also use:

Section: Accomplished software engineer specializing in crafting scalable web applications, utilizing expertise in software development to architect, develop, and deploy innovative solutions that drive business growth.

These rewritten versions aim to make a stronger impact by using action verbs like "driving", "design", "build", "deliver", "leveraging", "architect", "develop", and "deploy" to convey a sense of proactive involvement and technical expertise.`;

    const out = cleanRewriteOutput(raw);
    expect(out).toContain("Results-driven software engineer");
    expect(out).not.toContain("Alternatively");
    expect(out).not.toContain("Accomplished software engineer");
    expect(out).not.toContain("These rewritten versions");
    expect(out).not.toContain("Section:");
    expect(out).not.toContain("Here's a rewritten version");
  });

  it("strips a single-line preamble and label", () => {
    const raw = `Here is the improved summary:

Summary: Senior full-stack developer with 6 years of experience building scalable React and Node.js applications.`;

    const out = cleanRewriteOutput(raw);
    expect(out).toBe("Senior full-stack developer with 6 years of experience building scalable React and Node.js applications.");
  });

  it("strips inline preamble on the same line", () => {
    const raw = `Here's the improved version of your summary: Results-driven engineer with deep experience in distributed systems.`;

    const out = cleanRewriteOutput(raw);
    expect(out).toBe("Results-driven engineer with deep experience in distributed systems.");
  });

  it("cuts trailing explanation paragraphs", () => {
    const raw = `Results-driven software engineer with 5 years of experience.

This rewritten version aims to make the summary more impactful by using stronger language. Please let me know if you need any changes.`;

    const out = cleanRewriteOutput(raw);
    expect(out).toBe("Results-driven software engineer with 5 years of experience.");
    expect(out).not.toContain("This rewritten version");
  });

  it("handles markdown-bold labels", () => {
    const raw = `**Section:** Results-driven engineer delivering high-quality solutions.`;

    const out = cleanRewriteOutput(raw);
    expect(out).toBe("Results-driven engineer delivering high-quality solutions.");
  });

  it("leaves already-clean output untouched", () => {
    const clean = "Results-driven engineer with 5 years of experience in scalable web applications.";
    expect(cleanRewriteOutput(clean)).toBe(clean);
  });

  it("returns empty string for empty or whitespace input", () => {
    expect(cleanRewriteOutput("")).toBe("");
    expect(cleanRewriteOutput("   \n  ")).toBe("");
  });
});

describe("cleanResumeRewrite", () => {
  it("strips the leading preamble and the trailing Note: paragraph, keeping the resume", () => {
    const raw = `Here is the optimized resume:

**Professional Summary:**
Highly experienced Senior Full Stack Developer with 4 years of experience building scalable web applications using React, TypeScript, and Node.js, deployed on AWS.

**Experience:**

* **Senior Full Stack Developer, Acme Corp (2022 - Present)**
\t+ Built scalable REST APIs in Node.js, serving 50k daily users

**Education:**

* **B.Tech in Computer Science, State University (2016 - 2020)**

Note: I've incorporated the strongest relevant keywords from the job description, while ensuring the resume remains natural and easy to read. The goal is to showcase the candidate's experience and skills in a clear and concise manner, without unnecessary keyword-stuffing or repetition.`;

    const out = cleanResumeRewrite(raw);
    expect(out).toContain("**Professional Summary:**");
    expect(out).toContain("Highly experienced Senior Full Stack Developer");
    expect(out).toContain("**Experience:**");
    expect(out).toContain("Built scalable REST APIs");
    expect(out).toContain("**Education:**");
    expect(out).toContain("B.Tech in Computer Science");
    expect(out).not.toContain("Here is the optimized resume");
    expect(out).not.toContain("Note: I've incorporated");
    expect(out).not.toContain("keyword-stuffing");
  });

  it("strips other trailing meta openers", () => {
    const raw = `**Professional Summary:**
Results-driven engineer with 5 years of experience.

I hope this helps you tailor your resume to the role. Let me know if you need any changes.`;

    const out = cleanResumeRewrite(raw);
    expect(out).toContain("Results-driven engineer");
    expect(out).not.toContain("I hope this helps");
    expect(out).not.toContain("Let me know");
  });

  it("removes a trailing 'the above...' meta paragraph but keeps resume content", () => {
    const raw = `**Skills:**
* **Technical:** JavaScript, TypeScript

The above skills are supported by my experience.`;

    // "The above skills are..." is the LAST paragraph, so it is a trailing
    // note and is removed while the resume sections stay intact.
    const out = cleanResumeRewrite(raw);
    expect(out).toContain("**Skills:**");
    expect(out).toContain("JavaScript, TypeScript");
    expect(out).not.toContain("The above skills");
  });

  it("leaves a clean resume untouched", () => {
    const clean = `**Professional Summary:**
Results-driven engineer with 5 years of experience.

**Experience:**
* Built REST APIs`;
    expect(cleanResumeRewrite(clean)).toBe(clean);
  });

  it("returns empty string for empty or whitespace input", () => {
    expect(cleanResumeRewrite("")).toBe("");
    expect(cleanResumeRewrite("   \n  ")).toBe("");
  });
});
