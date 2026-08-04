import { describe, expect, it } from "vitest";
import { recommendTemplate, EXPERIENCE_OPTIONS } from "./template-recommendation";

describe("recommendTemplate", () => {
  it("recommends the student template for student roles and education", () => {
    const rec = recommendTemplate({
      role: "Computer Science Student",
      experience: "student",
      industry: "Education",
    });
    expect(rec.key).toBe("student");
    expect(rec.name).toBe("Student");
  });

  it("recommends a modern/ATS template for software engineers at mid level", () => {
    const rec = recommendTemplate({
      role: "Software Engineer",
      experience: "mid",
      industry: "Technology",
    });
    expect(["modern", "ats-professional"]).toContain(rec.key);
    expect(rec.atsScore).toBeGreaterThan(0);
  });

  it("recommends the executive template for senior leadership roles", () => {
    const rec = recommendTemplate({
      role: "Chief Technology Officer",
      experience: "senior",
      industry: "Finance",
    });
    expect(["executive", "executive-sidebar"]).toContain(rec.key);
  });

  it("recommends the creative template for design roles", () => {
    const rec = recommendTemplate({
      role: "UX Designer",
      experience: "mid",
      industry: "Design",
    });
    expect(rec.key).toBe("creative");
  });

  it("produces a reason referencing the recommended template", () => {
    const rec = recommendTemplate({
      role: "Software Engineer",
      experience: "mid",
      industry: "Technology",
    });
    expect(rec.reason).toContain(rec.name);
    expect(rec.reason.length).toBeGreaterThan(20);
  });

  it("always returns all five required fields", () => {
    const rec = recommendTemplate({
      role: "Accountant",
      experience: "senior",
      industry: "Banking",
    });
    expect(rec.key).toBeTruthy();
    expect(rec.name).toBeTruthy();
    expect(rec.reason).toBeTruthy();
    expect(typeof rec.atsScore).toBe("number");
    expect(rec.recruiterAppeal).toBeTruthy();
    expect(rec.bullets.length).toBeGreaterThan(0);
  });

  it("builds explainable 'recommended because' bullets (Task 5.2)", () => {
    const rec = recommendTemplate({
      role: "Software Engineer",
      experience: "mid",
      industry: "Technology",
    });
    // The role-derived bullet keeps acronyms intact (UX, iOS, …)
    const recUx = recommendTemplate({
      role: "UX Designer",
      experience: "mid",
      industry: "Design",
    });
    expect(recUx.bullets.some((b) => b === "Popular for UX Designer")).toBe(true);
    expect(rec.bullets.some((b) => b.includes("Popular for"))).toBe(true);
  });

  it("is deterministic for identical input", () => {
    const input = { role: "Product Manager", experience: "mid" as const, industry: "SaaS" };
    const a = recommendTemplate(input);
    const b = recommendTemplate(input);
    expect(a.key).toBe(b.key);
    expect(a.reason).toBe(b.reason);
  });

  it("handles empty role/industry gracefully", () => {
    const rec = recommendTemplate({ role: "", experience: "entry", industry: "" });
    expect(rec.key).toBeTruthy();
    expect(rec.reason).toBeTruthy();
  });

  it("exposes experience options with stable values", () => {
    expect(EXPERIENCE_OPTIONS.map((o) => o.value)).toEqual([
      "student", "entry", "mid", "senior",
    ]);
  });
});
