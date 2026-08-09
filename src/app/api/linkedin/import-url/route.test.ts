import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST, mapProxycurlProfile, type LinkedInUrlImportResult } from "./route";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock("@/lib/subscription", () => ({
  getUserPlanLimits: vi.fn(),
  checkPremiumAccess: vi.fn(),
  recordPremiumUse: vi.fn(),
}));

vi.mock("@/lib/admin", () => ({
  isAdmin: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { getUserPlanLimits, checkPremiumAccess, recordPremiumUse } from "@/lib/subscription";
import { isAdmin } from "@/lib/admin";

const mockGetServerSession = vi.mocked(getServerSession);
const mockCheckRateLimit = vi.mocked(checkRateLimit);
const mockGetUserPlanLimits = vi.mocked(getUserPlanLimits);
const mockCheckPremiumAccess = vi.mocked(checkPremiumAccess);
const mockRecordPremiumUse = vi.mocked(recordPremiumUse);
const mockIsAdmin = vi.mocked(isAdmin);

const originalFetch = global.fetch;

/** Build a POST request against the route. */
function makeRequest(url: string): NextRequest {
  return new Request("http://localhost/api/linkedin/import-url", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "1.2.3.4" },
    body: JSON.stringify({ url }),
  }) as NextRequest;
}

/** Stub global.fetch with a Proxycurl-style response. */
function mockFetch(status: number, data: unknown): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(data),
  }) as unknown as typeof fetch;
}

/** A realistic Proxycurl Person Profile response. */
function proxycurlProfile(): Record<string, unknown> {
  return {
    public_identifier: "jane-doe",
    full_name: "Jane Doe",
    headline: "Senior Frontend Engineer at TechNova",
    summary: "Frontend engineer with 8 years of experience building web apps.",
    linkedin_profile_url: "https://www.linkedin.com/in/jane-doe",
    education: [
      {
        school: "University of Technology",
        degree_name: "Bachelor of Science",
        field_of_study: "Computer Science",
        starts_at: { day: 0, month: 0, year: 2018, raw: "2018" },
        ends_at: { day: 0, month: 0, year: 2022, raw: "2022" },
      },
    ],
    experiences: [
      {
        title: "Senior Frontend Engineer",
        company: "TechNova",
        location: "San Francisco, CA",
        description: "Led the design system.\nShipped the checkout flow.",
        starts_at: { day: 0, month: 0, year: 2020, raw: "2020-06" },
        ends_at: null,
      },
      {
        title: "Software Engineer",
        company: "Acme Corp",
        location: "Austin, TX",
        description: "Built REST APIs.",
        starts_at: { day: 0, month: 0, year: 2017, raw: "2017" },
        ends_at: { day: 0, month: 0, year: 2020, raw: "2020-05" },
      },
    ],
    skills: ["JavaScript", "TypeScript", "React"],
    certifications: [
      {
        name: "AWS Certified Developer",
        authority: "Amazon Web Services",
        url: "https://example.com/aws",
        starts_at: null,
        ends_at: { day: 0, month: 0, year: 2021, raw: "2021" },
      },
    ],
    languages: ["English", { name: "Spanish", proficiency: "Professional" }],
  };
}

beforeEach(() => {
  mockGetServerSession.mockReset();
  mockCheckRateLimit.mockReset();
  mockCheckRateLimit.mockResolvedValue(true);
  // Default: a non-admin Pro user (the gate passes) so existing tests keep working.
  mockIsAdmin.mockReset();
  mockIsAdmin.mockResolvedValue(false);
  mockGetUserPlanLimits.mockReset();
  mockGetUserPlanLimits.mockResolvedValue({ hasLinkedinImport: true } as never);
  // Default: within the trial — a free user below the 3-import cap is allowed.
  mockCheckPremiumAccess.mockReset();
  mockCheckPremiumAccess.mockResolvedValue(true);
  mockRecordPremiumUse.mockReset();
  process.env.PROXYCURL_API_KEY = "test-proxycurl-key";
});

afterEach(() => {
  global.fetch = originalFetch;
  delete process.env.PROXYCURL_API_KEY;
});

describe("POST /api/linkedin/import-url", () => {
  it("rejects unauthenticated requests", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await POST(makeRequest("https://linkedin.com/in/jane-doe"));
    expect(res.status).toBe(401);
  });

  it("rejects malformed LinkedIn URLs", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-1" } });
    const res = await POST(makeRequest("https://example.com/not-linkedin"));
    expect(res.status).toBe(400);
  });

  it("blocks free users with an upgrade prompt (403) once their 3 trial imports are used up", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-1", email: "user@example.com" } });
    mockGetUserPlanLimits.mockResolvedValue({ hasLinkedinImport: false } as never);
    mockCheckPremiumAccess.mockResolvedValue(false); // trial exhausted
    global.fetch = mockFetch(200, proxycurlProfile());

    const res = await POST(makeRequest("https://linkedin.com/in/jane-doe"));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.upgradeRequired).toBe(true);
    expect(json.error).toContain("Pro");
    // Gated users consume no Proxycurl credits and burn no trial use.
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockRecordPremiumUse).not.toHaveBeenCalled();
  });

  it("allows a free user's first import within the 3 free trial and records the use", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-1", email: "user@example.com" } });
    mockGetUserPlanLimits.mockResolvedValue({ hasLinkedinImport: false } as never);
    global.fetch = mockFetch(200, proxycurlProfile());

    const res = await POST(makeRequest("https://linkedin.com/in/jane-doe"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    // A successful trial import burns one free use.
    expect(mockRecordPremiumUse).toHaveBeenCalledWith("user-1", "linkedin_imports", false, false);
  });

  it("exempts admins from the Pro gate and the rate limit", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "admin-1", email: "admin@example.com" } });
    mockIsAdmin.mockResolvedValue(true);
    mockGetUserPlanLimits.mockResolvedValue({ hasLinkedinImport: false } as never);
    global.fetch = mockFetch(200, proxycurlProfile());

    const res = await POST(makeRequest("https://linkedin.com/in/jane-doe"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    // Admins pass the bypass flag so the limiter short-circuits.
    expect(mockCheckRateLimit).toHaveBeenCalledWith("linkedin-url-import:1.2.3.4", 10, 60000, {
      bypass: true,
    });
  });

  it("passes bypass:false for regular users so they stay rate limited", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-1" } });
    global.fetch = mockFetch(200, proxycurlProfile());

    const res = await POST(makeRequest("https://linkedin.com/in/jane-doe"));
    expect(res.status).toBe(200);
    expect(mockCheckRateLimit).toHaveBeenCalledWith("linkedin-url-import:1.2.3.4", 10, 60000, {
      bypass: false,
    });
  });

  it("returns mock data and does not call Proxycurl when PROXYCURL_API_KEY is missing", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-1" } });
    delete process.env.PROXYCURL_API_KEY;
    global.fetch = mockFetch(200, proxycurlProfile());

    const res = await POST(makeRequest("https://linkedin.com/in/jane-doe"));
    expect(res.status).toBe(200);
    expect(global.fetch).not.toHaveBeenCalled();
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.personalInfo.fullName).toBe("Jane Doe");
  });

  it("respects the rate limit", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-1" } });
    mockCheckRateLimit.mockResolvedValue(false);
    const res = await POST(makeRequest("https://linkedin.com/in/jane-doe"));
    expect(res.status).toBe(429);
  });

  it("calls Proxycurl with the profile URL and auth header, mapping the full profile", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-1" } });
    global.fetch = mockFetch(200, proxycurlProfile());

    const res = await POST(makeRequest("https://linkedin.com/in/jane-doe"));
    expect(res.status).toBe(200);

    const [fetchUrl, init] = vi.mocked(global.fetch).mock.calls[0] as [string, RequestInit];
    expect(fetchUrl).toContain("api.proxycurl.com/v2/linkedin");
    expect(fetchUrl).toContain("extra=include");
    expect(fetchUrl).toContain("use_cache=if-present");
    // The URL is normalized to the canonical www form before being sent.
    expect(fetchUrl).toContain("url=https%3A%2F%2Fwww.linkedin.com%2Fin%2Fjane-doe");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer test-proxycurl-key");

    const json = await res.json();
    expect(json.success).toBe(true);
    const data = json.data as LinkedInUrlImportResult;

    expect(data.personalInfo.fullName).toBe("Jane Doe");
    expect(data.personalInfo.headline).toBe("Senior Frontend Engineer at TechNova");
    // Canonical URL from Proxycurl wins over the requested URL.
    expect(data.personalInfo.linkedin).toBe("https://www.linkedin.com/in/jane-doe");
    expect(data.summary).toContain("8 years");

    expect(data.education).toEqual([
      {
        institution: "University of Technology",
        degree: "Bachelor of Science",
        field: "Computer Science",
        startDate: "2018",
        endDate: "2022",
      },
    ]);

    expect(data.experience).toHaveLength(2);
    const current = data.experience[0];
    expect(current.company).toBe("TechNova");
    expect(current.role).toBe("Senior Frontend Engineer");
    expect(current.location).toBe("San Francisco, CA");
    expect(current.startDate).toBe("2020-06");
    expect(current.endDate).toBe("");
    expect(current.current).toBe(true);
    expect(current.responsibilities).toEqual(["Led the design system.", "Shipped the checkout flow."]);

    expect(data.skills.technical).toEqual(["JavaScript", "TypeScript", "React"]);

    expect(data.certifications).toEqual([
      { name: "AWS Certified Developer", issuer: "Amazon Web Services", date: "2021" },
    ]);

    expect(data.languages).toEqual([
      { name: "English", proficiency: "" },
      { name: "Spanish", proficiency: "Professional" },
    ]);
  });

  it("falls back to the normalized URL when Proxycurl omits the canonical URL", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-1" } });
    const payload = proxycurlProfile();
    delete payload.linkedin_profile_url;
    global.fetch = mockFetch(200, payload);

    const res = await POST(makeRequest("https://www.linkedin.com/in/jane-doe"));
    const json = await res.json();
    expect(json.data.personalInfo.linkedin).toBe("https://www.linkedin.com/in/jane-doe");
  });

  it("normalizes bare and messy LinkedIn URLs before calling Proxycurl", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-1" } });
    global.fetch = mockFetch(200, proxycurlProfile());

    const res = await POST(makeRequest("linkedin.com/in/jane-doe/?ref=share"));
    expect(res.status).toBe(200);
    const [fetchUrl] = vi.mocked(global.fetch).mock.calls[0] as [string, RequestInit];
    expect(fetchUrl).toContain("url=https%3A%2F%2Fwww.linkedin.com%2Fin%2Fjane-doe");
  });

  it("rejects URLs that only smuggle a linkedin.com string", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-1" } });
    global.fetch = mockFetch(200, proxycurlProfile());

    const res = await POST(makeRequest("https://evil.com/?u=linkedin.com/in/jane-doe"));
    expect(res.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("maps Proxycurl rate limiting (429) to a friendly error", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-1" } });
    global.fetch = mockFetch(429, { code: 429, error: "Rate limited" });

    const res = await POST(makeRequest("https://linkedin.com/in/jane-doe"));
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toContain("rate-limited");
  });

  it("maps Proxycurl upstream failures (5xx) to a friendly error", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-1" } });
    global.fetch = mockFetch(500, { code: 500, error: "Upstream error" });

    const res = await POST(makeRequest("https://linkedin.com/in/jane-doe"));
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toContain("returned an error");
  });

  it("maps a 404 profile to a friendly error", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-1" } });
    global.fetch = mockFetch(404, { code: 404, error: "Profile not found" });

    const res = await POST(makeRequest("https://linkedin.com/in/ghost"));
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toContain("Could not find a LinkedIn profile");
  });

  it("maps an invalid API key to a friendly error", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-1" } });
    global.fetch = mockFetch(401, { code: 401, error: "Unauthorized" });

    const res = await POST(makeRequest("https://linkedin.com/in/jane-doe"));
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toContain("API key");
  });
});

describe("mapProxycurlProfile", () => {
  it("handles an empty/sparse profile without throwing", () => {
    const mapped = mapProxycurlProfile({});
    expect(mapped.personalInfo.fullName).toBe("LinkedIn User");
    expect(mapped.education).toEqual([]);
    expect(mapped.experience).toEqual([]);
    expect(mapped.skills).toEqual({ technical: [], soft: [], tools: [], frameworks: [] });
    expect(mapped.certifications).toEqual([]);
    expect(mapped.languages).toEqual([]);
  });

  it("uses year-only dates when raw is missing", () => {
    const mapped = mapProxycurlProfile({
      education: [
        {
          school: "State University",
          degree_name: "BSc",
          starts_at: { year: 2016 },
          ends_at: { year: 2020 },
        },
      ],
    });
    expect(mapped.education[0].startDate).toBe("2016");
    expect(mapped.education[0].endDate).toBe("2020");
  });

  it("accepts skills as { name } objects", () => {
    const mapped = mapProxycurlProfile({ skills: [{ name: "Python" }, "Docker", { name: "Kubernetes" }] });
    expect(mapped.skills.technical).toEqual(["Python", "Docker", "Kubernetes"]);
  });

  it("marks past roles as not current", () => {
    const mapped = mapProxycurlProfile({
      experiences: [
        { title: "Intern", company: "Old Corp", ends_at: { raw: "2023" } },
      ],
    });
    expect(mapped.experience[0].current).toBe(false);
  });
});
