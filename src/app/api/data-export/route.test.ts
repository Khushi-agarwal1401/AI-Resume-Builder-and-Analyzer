import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFrom = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(() => ({ from: mockFrom })),
}));

vi.mock("@/services/resume/service", () => ({
  getResumes: vi.fn(),
  getResume: vi.fn(),
}));

vi.mock("@/services/applications/service", () => ({
  getApplications: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { getResumes, getResume } from "@/services/resume/service";
import { getApplications } from "@/services/applications/service";
import { GET } from "./route";

const mockGetServerSession = vi.mocked(getServerSession);
const mockGetResumes = vi.mocked(getResumes);
const mockGetResume = vi.mocked(getResume);
const mockGetApplications = vi.mocked(getApplications);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function thenableChain<T = any>(resolveValue: T) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const self: Record<string, any> = {
    select: vi.fn(() => self),
    eq: vi.fn(() => self),
    order: vi.fn(() => self),
    then: (resolve: (val: T) => void) => resolve(resolveValue),
  };
  return self;
}

describe("data-export API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ success: false, error: "Unauthorized" });
  });

  it("returns full resume content, applications, and job analyses", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockGetResumes.mockResolvedValue([
      { id: "res-1" },
      { id: "res-2" },
    ] as never);
    mockGetResume.mockResolvedValue({
      id: "res-1",
      title: "Software Engineer Resume",
      summary: "Full section content",
      education: [{ institution: "Stanford" }],
    } as never);
    mockGetApplications.mockResolvedValue({
      data: [{ company: "Acme", role: "Engineer" }],
      total: 1,
    });
    mockFrom.mockReturnValue(
      thenableChain({ data: [{ id: "ja-1", match_percentage: 82 }], error: null })
    );

    const res = await GET();

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    // Full resume content (sections) is included, not just list metadata.
    expect(json.data.resumes).toHaveLength(2);
    expect(json.data.resumes[0].summary).toBe("Full section content");
    expect(json.data.resumes[0].education).toEqual([{ institution: "Stanford" }]);
    expect(json.data.applications).toEqual([{ company: "Acme", role: "Engineer" }]);
    expect(json.data.jobAnalyses).toEqual([{ id: "ja-1", match_percentage: 82 }]);
    expect(json.data.exportedAt).toBeTruthy();
  });

  it("scopes job analyses to the calling user", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockGetResumes.mockResolvedValue([]);
    mockGetApplications.mockResolvedValue({ data: [], total: 0 });
    mockFrom.mockReturnValue(thenableChain({ data: [], error: null }));

    await GET();

    expect(mockFrom).toHaveBeenCalledWith("job_analyses");
    expect(
      (mockFrom.mock.results[0].value.eq as ReturnType<typeof vi.fn>).mock.calls
    ).toContainEqual(["user_id", "user-123"]);
  });

  it("paginates through applications until the total is reached", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockGetResumes.mockResolvedValue([]);
    mockGetApplications
      .mockResolvedValueOnce({
        data: Array.from({ length: 200 }, (_, i) => ({ id: `app-${i}` })),
        total: 250,
      })
      .mockResolvedValueOnce({ data: Array.from({ length: 50 }, (_, i) => ({ id: `app-${200 + i}` })), total: 250 });
    mockFrom.mockReturnValue(thenableChain({ data: [], error: null }));

    const res = await GET();
    const json = await res.json();

    expect(mockGetApplications).toHaveBeenCalledTimes(2);
    expect(json.data.applications).toHaveLength(250);
  });
});
