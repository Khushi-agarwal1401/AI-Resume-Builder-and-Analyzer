import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/services/ai/client", () => ({
  callGemini: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { callGemini } from "@/services/ai/client";
import { checkRateLimit } from "@/lib/rate-limit";
import { POST } from "./route";

const mockGetServerSession = vi.mocked(getServerSession);
const mockCallGemini = vi.mocked(callGemini);
const mockCheckRateLimit = vi.mocked(checkRateLimit);

function pasteRequest(text: string) {
  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  };
  // NextRequest's RequestInit types `signal` as AbortSignal | undefined (no
  // null), which the global RequestInit doesn't satisfy — cast through the
  // constructor's parameter type.
  return new NextRequest(
    "http://localhost:3000/api/linkedin/import-paste",
    init as unknown as ConstructorParameters<typeof NextRequest>[1]
  );
}

const SAMPLE_PROFILE = JSON.stringify({
  experience: [
    { company: "Acme", role: "Engineer", duration: "2020 - Present", description: "Built things" },
    // Empty entry must be filtered out by the route's sanitizer.
    { company: "", role: "", duration: "", description: "" },
  ],
  education: [{ school: "MIT", degree: "B.Tech", field: "CSE", graduationYear: "2023" }],
  skills: ["JavaScript", "", "Python"],
  certifications: [{ name: "AWS", issuer: "Amazon", date: "2022" }],
  achievements: [{ title: "Hackathon", description: "Won" }],
});

const LONG_PROFILE_TEXT = "A".repeat(25_000);

describe("POST /api/linkedin/import-paste", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCallGemini.mockReset();
    mockCheckRateLimit.mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await POST(pasteRequest("A sufficiently long paste of LinkedIn profile text for testing."));

    expect(res.status).toBe(401);
    expect(mockCallGemini).not.toHaveBeenCalled();
  });

  it("returns 400 when the pasted text is too short", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockCheckRateLimit.mockResolvedValue(true);

    const res = await POST(pasteRequest("short"));

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ success: false });
    expect(mockCallGemini).not.toHaveBeenCalled();
  });

  it("returns 400 when the pasted text is too long", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockCheckRateLimit.mockResolvedValue(true);

    const res = await POST(pasteRequest(LONG_PROFILE_TEXT));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("20,000");
    expect(mockCallGemini).not.toHaveBeenCalled();
  });

  it("returns 429 when the rate limit is exceeded", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockCheckRateLimit.mockResolvedValue(false);

    const res = await POST(pasteRequest("A sufficiently long paste of LinkedIn profile text for testing."));

    expect(res.status).toBe(429);
    expect(mockCallGemini).not.toHaveBeenCalled();
  });

  it("returns 502 when the AI call fails", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockCheckRateLimit.mockResolvedValue(true);
    mockCallGemini.mockResolvedValue({ success: false, output: "", error: "AI extraction failed" });

    const res = await POST(pasteRequest("A sufficiently long paste of LinkedIn profile text for testing."));

    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe("AI extraction failed");
  });

  it("returns 500 when the AI call throws unexpectedly", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockCheckRateLimit.mockResolvedValue(true);
    mockCallGemini.mockRejectedValue(new Error("boom"));

    const res = await POST(pasteRequest("A sufficiently long paste of LinkedIn profile text for testing."));

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("An unexpected error occurred. Please try again.");
  });

  it("returns 502 when the AI output is not valid JSON", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockCheckRateLimit.mockResolvedValue(true);
    mockCallGemini.mockResolvedValue({ success: true, output: "not json at all" });

    const res = await POST(pasteRequest("A sufficiently long paste of LinkedIn profile text for testing."));

    expect(res.status).toBe(502);
    expect((await res.json()).error).toContain("Could not parse");
  });

  it("returns 422 when nothing usable was extracted", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockCheckRateLimit.mockResolvedValue(true);
    mockCallGemini.mockResolvedValue({
      success: true,
      output: JSON.stringify({ experience: [], education: [], skills: [], certifications: [], achievements: [] }),
    });

    const res = await POST(pasteRequest("A sufficiently long paste of LinkedIn profile text for testing."));

    expect(res.status).toBe(422);
    expect((await res.json()).error).toContain("No profile details could be extracted");
  });

  it("parses the AI output (stripping markdown fences) and sanitizes the profile", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockCheckRateLimit.mockResolvedValue(true);
    mockCallGemini.mockResolvedValue({ success: true, output: `\`\`\`json\n${SAMPLE_PROFILE}\n\`\`\`` });

    const res = await POST(pasteRequest("A sufficiently long paste of LinkedIn profile text for testing."));

    expect(res.status).toBe(200);
    // The AI is invoked with the linkedin-import-paste action and the pasted text.
    expect(mockCallGemini.mock.calls[0][0]).toMatchObject({
      action: "linkedin-import-paste",
      input: "A sufficiently long paste of LinkedIn profile text for testing.",
    });
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual({
      experience: [{ company: "Acme", role: "Engineer", duration: "2020 - Present", description: "Built things" }],
      education: [{ school: "MIT", degree: "B.Tech", field: "CSE", graduationYear: "2023" }],
      skills: ["JavaScript", "Python"],
      certifications: [{ name: "AWS", issuer: "Amazon", date: "2022" }],
      achievements: [{ title: "Hackathon", description: "Won" }],
    });
  });

  it("coerces malformed array entries to safe empty values", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockCheckRateLimit.mockResolvedValue(true);
    mockCallGemini.mockResolvedValue({
      success: true,
      output: JSON.stringify({
        experience: [{ company: null, role: 42, duration: {}, description: undefined }],
        education: [{ school: "MIT" }],
        skills: "not-an-array",
        certifications: [{ name: "AWS" }],
        achievements: [{ title: "", description: "" }],
      }),
    });

    const res = await POST(pasteRequest("A sufficiently long paste of LinkedIn profile text for testing."));

    expect(res.status).toBe(200);
    const json = await res.json();
    // null/42/{}/undefined → "" and the empty experience entry is dropped.
    expect(json.data.experience).toEqual([]);
    expect(json.data.education).toEqual([{ school: "MIT", degree: "", field: "", graduationYear: "" }]);
    // Non-array skills → [].
    expect(json.data.skills).toEqual([]);
    // A certification with only a name is kept with empty issuer/date.
    expect(json.data.certifications).toEqual([{ name: "AWS", issuer: "", date: "" }]);
    // Achievement with no title/description is dropped.
    expect(json.data.achievements).toEqual([]);
  });
});
