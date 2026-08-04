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

import { getServerSession } from "next-auth";
import { GET } from "./route";

const mockGetServerSession = vi.mocked(getServerSession);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function thenableChain<T = any>(resolveValue: T) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const self: Record<string, any> = {
    select: vi.fn(() => self),
    eq: vi.fn(() => self),
    order: vi.fn(() => self),
    in: vi.fn(() => self),
    then: (resolve: (val: T) => void) => resolve(resolveValue),
  };
  return self;
}

describe("GET /api/linkedin/imports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(401);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns an empty list when the user has no resumes", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockFrom.mockReturnValueOnce(thenableChain({ data: [], error: null }));

    const res = await GET();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, data: [] });
    // No section queries are issued when there are no resumes.
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it("groups certifications, achievements, and LinkedIn post references by resume", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    const resumesChain = thenableChain({
      data: [
        { id: "r1", title: "Resume A" },
        { id: "r2", title: "Resume B" },
        { id: "r3", title: "Empty Resume" }, // has no items → group omitted
      ],
      error: null,
    });
    const certsChain = thenableChain({
      data: [{ resume_id: "r1", name: "AWS", issuer: "Amazon", date: "2022", url: "https://x" }],
      error: null,
    });
    const achievementsChain = thenableChain({
      data: [
        { resume_id: "r1", title: "Hackathon", description: "Won", date: "2023" },
        { resume_id: "r2", title: "Chess Club", description: "Led the club", date: "2023" },
      ],
      error: null,
    });
    const projectsChain = thenableChain({
      data: [
        {
          resume_id: "r2",
          name: "Post",
          description: "LinkedIn post reference: Read my article",
          live_url: "https://linkedin.com/p/1",
        },
        // Not LinkedIn-sourced → must be filtered out.
        { resume_id: "r2", name: "Real Project", description: "A real project", live_url: "https://github.com/x" },
      ],
      error: null,
    });
    mockFrom
      .mockReturnValueOnce(resumesChain)
      .mockReturnValueOnce(certsChain)
      .mockReturnValueOnce(achievementsChain)
      .mockReturnValueOnce(projectsChain);

    const res = await GET();

    expect(res.status).toBe(200);
    // Ownership is enforced on the resumes query.
    expect((resumesChain.eq as ReturnType<typeof vi.fn>).mock.calls).toContainEqual(["user_id", "user-123"]);
    // Section queries are scoped to the user's resume ids.
    expect((certsChain.in as ReturnType<typeof vi.fn>).mock.calls[0]).toEqual(["resume_id", ["r1", "r2", "r3"]]);
    expect((achievementsChain.in as ReturnType<typeof vi.fn>).mock.calls[0]).toEqual(["resume_id", ["r1", "r2", "r3"]]);
    expect((projectsChain.in as ReturnType<typeof vi.fn>).mock.calls[0]).toEqual(["resume_id", ["r1", "r2", "r3"]]);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual([
      {
        resumeId: "r1",
        resumeTitle: "Resume A",
        items: [
          { type: "certificate", title: "AWS", detail: "Amazon", date: "2022", url: "https://x" },
          { type: "achievement", title: "Hackathon", detail: "Won", date: "2023", url: "" },
        ],
      },
      {
        resumeId: "r2",
        resumeTitle: "Resume B",
        items: [
          { type: "achievement", title: "Chess Club", detail: "Led the club", date: "2023", url: "" },
          {
            type: "post_reference",
            title: "Post",
            detail: "Read my article",
            date: "",
            url: "https://linkedin.com/p/1",
          },
        ],
      },
    ]);
  });

  it("returns 500 when the database query throws", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockFrom.mockImplementation(() => {
      throw new Error("boom");
    });

    const res = await GET();

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("An unexpected error occurred. Please try again.");
  });
});
