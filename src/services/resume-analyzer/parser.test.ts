import { describe, it, expect } from "vitest";
import { extractSections, detectMissingSections, extractEmail, extractPhone, extractLinks } from "./parser";

describe("extractSections", () => {
  it("extracts sections from a well-structured resume", () => {
    const text = "Summary\nHello\nExperience\nWorked\nEducation\nSchool\nSkills\nCoding";

    const sections = extractSections(text);
    expect(sections.summary?.trim()).toBe("Hello");
    expect(sections.experience?.trim()).toBe("Worked");
    expect(sections.education?.trim()).toBe("School");
    expect(sections.skills?.trim()).toBe("Coding");
  });

  it("returns empty object for text with no section headers", () => {
    const sections = extractSections("Just some random text with no clear sections");
    expect(Object.keys(sections).length).toBe(0);
  });
});

describe("detectMissingSections", () => {
  it("detects when all required sections are present", () => {
    const text = "Summary\nHello\nExperience\nWorked\nEducation\nSchool\nSkills\nCoding";
    const { present, missing } = detectMissingSections(text);
    expect(present.length).toBeGreaterThanOrEqual(4);
    expect(missing.length).toBe(0);
  });

  it("flags missing summary", () => {
    const text = "Experience\nWorked\nEducation\nSchool\nSkills\nCoding";
    const { missing } = detectMissingSections(text);
    expect(missing).toContain("summary");
  });
});

describe("extractEmail", () => {
  it("extracts email from text", () => {
    expect(extractEmail("Contact me at john@example.com")).toBe("john@example.com");
  });

  it("returns null when no email is present", () => {
    expect(extractEmail("No email here")).toBeNull();
  });
});

describe("extractPhone", () => {
  it("extracts US phone number", () => {
    expect(extractPhone("Call (555) 123-4567")).toBe("(555) 123-4567");
  });

  it("returns null when no phone is present", () => {
    expect(extractPhone("No phone here")).toBeNull();
  });
});

describe("extractLinks", () => {
  it("extracts URLs from text", () => {
    const links = extractLinks("Check https://example.com and https://github.com/user");
    expect(links).toContain("https://example.com");
    expect(links).toContain("https://github.com/user");
  });

  it("returns empty array when no URLs are present", () => {
    expect(extractLinks("No links here")).toEqual([]);
  });
});
