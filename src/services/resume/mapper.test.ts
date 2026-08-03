import { describe, it, expect } from "vitest";
import { mapRowToResumeData, type ResumeRow } from "./mapper";

function makeRow(overrides: Record<string, unknown> = {}): ResumeRow & Record<string, unknown> {
  return {
    id: "res-1",
    user_id: "user-123",
    title: "My Resume",
    template: "modern",
    target_level: "fresher",
    personal_info: { fullName: "John Doe", email: "john@test.com" },
    summary: "A summary",
    accent_color: "#0ea5e9",
    font_family: "serif",
    coursework: ["Math"],
    interests: ["Chess"],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
    ...overrides,
  };
}

describe("mapRowToResumeData", () => {
  it("maps root snake_case fields to camelCase and applies defaults", () => {
    const resume = mapRowToResumeData(makeRow());

    expect(resume).toMatchObject({
      id: "res-1",
      userId: "user-123",
      title: "My Resume",
      template: "modern",
      summary: "A summary",
      accentColor: "#0ea5e9",
      fontFamily: "serif",
      coursework: ["Math"],
      interests: ["Chess"],
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
    });
    expect(resume.personalInfo.fullName).toBe("John Doe");
  });

  it("maps section_order (JSONB array) to sectionOrder", () => {
    const resume = mapRowToResumeData(makeRow({
      section_order: ["personalInfo", "summary", "skills", "experience"],
    }));
    expect(resume.sectionOrder).toEqual(["personalInfo", "summary", "skills", "experience"]);

    // Non-array / garbage values degrade to an empty custom order.
    expect(mapRowToResumeData(makeRow({ section_order: null })).sectionOrder).toEqual([]);
    expect(mapRowToResumeData(makeRow({ section_order: "oops" })).sectionOrder).toEqual([]);
  });

  it("falls back to defaults for missing target level, personal info, font, and empty sections", () => {
    const resume = mapRowToResumeData(makeRow({
      target_level: null,
      personal_info: null,
      accent_color: null,
      font_family: null,
      coursework: null,
      interests: null,
    }));

    expect(resume.targetLevel).toBe("fresher");
    expect(resume.accentColor).toBeNull();
    expect(resume.fontFamily).toBe("sans");
    expect(resume.personalInfo).toEqual({
      fullName: "", email: "", phone: "", linkedin: "", github: "", portfolio: "", photo: "",
    });
    expect(resume.education).toEqual([]);
    expect(resume.experience).toEqual([]);
    expect(resume.projects).toEqual([]);
    expect(resume.leadership).toEqual([]);
    expect(resume.openSource).toEqual([]);
    expect(resume.volunteer).toEqual([]);
    expect(resume.skills).toEqual({ technical: [], soft: [], tools: [], frameworks: [] });
    expect(resume.coursework).toEqual([]);
    expect(resume.interests).toEqual([]);
  });

  it("maps education rows from snake_case to camelCase (incl. extended fields)", () => {
    const resume = mapRowToResumeData(makeRow({
      education: [
        {
          id: "e-1", institution: "MIT", degree: "B.Tech", field: "CSE",
          start_date: "2019", end_date: "2023", cgpa: "9.2",
          branch: "CSE", semester: "8", classXII: "96%", classX: "95%",
        },
      ],
    }));

    expect(resume.education[0]).toEqual({
      id: "e-1", institution: "MIT", degree: "B.Tech", field: "CSE",
      startDate: "2019", endDate: "2023", cgpa: "9.2",
      branch: "CSE", semester: "8", classXII: "96%", classX: "95%",
    });
  });

  it("maps experience rows to camelCase with boolean current and array fields", () => {
    const resume = mapRowToResumeData(makeRow({
      experience: [
        {
          id: "x-1", company: "Acme", role: "Engineer", location: "NYC",
          start_date: "2020-01", end_date: "2021-01", current: true,
          responsibilities: ["Shipped feature"], achievements: ["Boosted perf"],
        },
      ],
    }));

    expect(resume.experience[0]).toEqual({
      id: "x-1", company: "Acme", role: "Engineer", location: "NYC",
      startDate: "2020-01", endDate: "2021-01", current: true,
      responsibilities: ["Shipped feature"], achievements: ["Boosted perf"],
    });
  });

  it("maps projects rows (liveUrl/githubUrl/teamSize) to camelCase", () => {
    const resume = mapRowToResumeData(makeRow({
      projects: [
        {
          id: "p-1", name: "Resume Builder", description: "A tool",
          technologies: ["Next.js"], live_url: "https://example.com",
          github_url: "https://github.com/x", client: "Acme",
          team_size: "4", impact: "Increased signups 2x",
        },
      ],
    }));

    expect(resume.projects[0]).toEqual({
      id: "p-1", name: "Resume Builder", description: "A tool",
      technologies: ["Next.js"], liveUrl: "https://example.com",
      githubUrl: "https://github.com/x", client: "Acme",
      teamSize: "4", impact: "Increased signups 2x",
    });
  });

  it("maps leadership rows to camelCase", () => {
    const resume = mapRowToResumeData(makeRow({
      leadership: [
        {
          id: "l-1", title: "President", organization: "ACM",
          start_date: "2022-01", end_date: "2023-01", description: "Led the chapter",
        },
      ],
    }));

    expect(resume.leadership[0]).toEqual({
      id: "l-1", title: "President", organization: "ACM",
      startDate: "2022-01", endDate: "2023-01", description: "Led the chapter",
    });
  });

  it("maps open source rows (project_name → projectName) to camelCase", () => {
    const resume = mapRowToResumeData(makeRow({
      open_source: [
        {
          id: "o-1", project_name: "freebuff", role: "Maintainer",
          url: "https://github.com/x/freebuff", description: "AI coding assistant",
        },
      ],
    }));

    expect(resume.openSource[0]).toEqual({
      id: "o-1", projectName: "freebuff", role: "Maintainer",
      url: "https://github.com/x/freebuff", description: "AI coding assistant",
    });
  });

  it("maps volunteer rows to camelCase", () => {
    const resume = mapRowToResumeData(makeRow({
      volunteer: [
        {
          id: "v-1", organization: "NGO", role: "Teacher",
          start_date: "2021-06", end_date: "2022-06", description: "Taught math",
        },
      ],
    }));

    expect(resume.volunteer[0]).toEqual({
      id: "v-1", organization: "NGO", role: "Teacher",
      startDate: "2021-06", endDate: "2022-06", description: "Taught math",
    });
  });

  it("passes through identity-mapped sections with an id (columns already camelCase)", () => {
    const resume = mapRowToResumeData(makeRow({
      certifications: [{ id: "c-1", name: "AWS", issuer: "Amazon", date: "2023", url: "https://x" }],
      achievements: [{ id: "a-1", title: "Hackathon", description: "Won", date: "2023" }],
      languages: [{ id: "g-1", name: "English", proficiency: "fluent" }],
      coding_profiles: [{ id: "cp-1", platform: "LeetCode", url: "https://x", handle: "johndoe" }],
      publications: [{ id: "pub-1", title: "Paper", publisher: "IEEE", date: "2022", url: "https://x", description: "Research" }],
      activities: [{ id: "act-1", title: "Chess", description: "Club", date: "2023" }],
    }));

    expect(resume.certifications[0]).toEqual({ id: "c-1", name: "AWS", issuer: "Amazon", date: "2023", url: "https://x" });
    expect(resume.achievements[0]).toEqual({ id: "a-1", title: "Hackathon", description: "Won", date: "2023" });
    expect(resume.languages[0]).toEqual({ id: "g-1", name: "English", proficiency: "fluent" });
    expect(resume.codingProfiles[0]).toEqual({ id: "cp-1", platform: "LeetCode", url: "https://x", handle: "johndoe" });
    expect(resume.publications[0]).toEqual({ id: "pub-1", title: "Paper", publisher: "IEEE", date: "2022", url: "https://x", description: "Research" });
    expect(resume.activities[0]).toEqual({ id: "act-1", title: "Chess", description: "Club", date: "2023" });
  });

  it("reads skills from the first skills row", () => {
    const resume = mapRowToResumeData(makeRow({
      skills: [{ technical: ["JS", "Python"], soft: ["Communication"], tools: ["Git"], frameworks: ["React"] }],
    }));

    expect(resume.skills).toEqual({
      technical: ["JS", "Python"], soft: ["Communication"], tools: ["Git"], frameworks: ["React"],
    });
  });

  it("coerces missing optional values to empty strings and keeps ids as strings", () => {
    const resume = mapRowToResumeData(makeRow({
      experience: [{ id: 42, company: "Acme" }],
    }));

    expect(resume.experience[0]).toEqual({
      id: "42", company: "Acme", role: "", location: "",
      startDate: "", endDate: "", current: false,
      responsibilities: [], achievements: [],
    });
  });
});
