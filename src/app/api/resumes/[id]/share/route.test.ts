import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockFrom = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/db/server", () => ({
  createServerClient: vi.fn(() => ({ from: mockFrom })),
}));

vi.mock("@/services/notifications/service", () => ({
  createNotification: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { createNotification } from "@/services/notifications/service";
import { GET, POST } from "./route";

const mockCreateNotification = vi.mocked(createNotification);

const mockGetServerSession = vi.mocked(getServerSession);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function thenableChain<T = any>(resolveValue: T) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const self: Record<string, any> = {
    select: vi.fn(() => self),
    eq: vi.fn(() => self),
    single: vi.fn(() => self),
    update: vi.fn(() => self),
    then: (resolve: (val: T) => void) => resolve(resolveValue),
  };
  return self;
}

function shareRequest(method: "GET" | "POST", body?: unknown) {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(body);
  }
  // NextRequest's RequestInit types `signal` as AbortSignal | undefined (no
  // null), which the global RequestInit doesn't satisfy — cast through the
  // constructor's parameter type.
  return new NextRequest(
    "http://localhost:3000/api/resumes/res-1/share",
    init as unknown as ConstructorParameters<typeof NextRequest>[1]
  );
}

const params = Promise.resolve({ id: "res-1" });

describe("share API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReset();
  });

  describe("GET", () => {
    it("returns 401 when unauthenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const res = await GET(shareRequest("GET"), { params });

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ success: false, error: "Unauthorized" });
    });

    it("returns the current share state with a public url when enabled", async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
      const chain = thenableChain({
        data: { id: "res-1", share_token: "tok-1", share_enabled: true },
        error: null,
      });
      mockFrom.mockReturnValueOnce(chain);

      const res = await GET(shareRequest("GET"), { params });

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        success: true,
        data: { enabled: true, token: "tok-1", url: "http://localhost:3000/share/tok-1" },
      });
      // Ownership is enforced on the query.
      expect((chain.eq as ReturnType<typeof vi.fn>).mock.calls).toContainEqual(["user_id", "user-123"]);
    });

    it("returns disabled state when not shared", async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
      mockFrom.mockReturnValueOnce(
        thenableChain({
          data: { id: "res-1", share_token: "tok-1", share_enabled: false },
          error: null,
        })
      );

      const res = await GET(shareRequest("GET"), { params });

      expect((await res.json()).data).toEqual({ enabled: false, token: null, url: null });
    });

    it("returns 404 when the resume does not belong to the user", async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
      mockFrom.mockReturnValueOnce(thenableChain({ data: null, error: null }));

      const res = await GET(shareRequest("GET"), { params });

      expect(res.status).toBe(404);
    });
  });

  describe("POST", () => {
    it("returns 401 when unauthenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const res = await POST(shareRequest("POST", { enabled: true }), { params });

      expect(res.status).toBe(401);
    });

    it("returns 404 when the resume is not found", async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
      mockFrom.mockReturnValueOnce(thenableChain({ data: null, error: null }));

      const res = await POST(shareRequest("POST", { enabled: true }), { params });

      expect(res.status).toBe(404);
    });

    it("enables sharing, generates a token, persists it, and notifies", async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
      const updateChain = thenableChain({ error: null });
      mockFrom
        .mockReturnValueOnce(
          thenableChain({ data: { id: "res-1", share_token: null, share_enabled: false }, error: null })
        )
        .mockReturnValueOnce(updateChain);

      const res = await POST(shareRequest("POST", { enabled: true }), { params });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.enabled).toBe(true);
      expect(json.data.token).toBeTruthy();
      expect(json.data.url).toBe(`http://localhost:3000/share/${json.data.token}`);

      const updatePayload = (updateChain.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(updatePayload.share_enabled).toBe(true);
      expect(updatePayload.share_token).toBe(json.data.token);
      expect(updatePayload.share_updated_at).toBeTruthy();

      // Notification Center (Task 2.1): "Resume shared" notification on enable.
      expect(mockCreateNotification).toHaveBeenCalledWith(
        "user-123",
        expect.objectContaining({ type: "share", link: `/share/${json.data.token}` })
      );
    });

    it("reuses an existing token when re-enabling", async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
      mockFrom
        .mockReturnValueOnce(
          thenableChain({ data: { id: "res-1", share_token: "existing-tok", share_enabled: false }, error: null })
        )
        .mockReturnValueOnce(thenableChain({ error: null }));

      const res = await POST(shareRequest("POST", { enabled: true }), { params });

      const json = await res.json();
      expect(json.data.token).toBe("existing-tok");
      expect(json.data.url).toBe("http://localhost:3000/share/existing-tok");
    });

    it("disables sharing, returns null token/url, and does not notify", async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
      const updateChain = thenableChain({ error: null });
      mockFrom
        .mockReturnValueOnce(
          thenableChain({ data: { id: "res-1", share_token: "existing-tok", share_enabled: true }, error: null })
        )
        .mockReturnValueOnce(updateChain);

      const res = await POST(shareRequest("POST", { enabled: false }), { params });

      const json = await res.json();
      expect(json.data).toEqual({ enabled: false, token: null, url: null });

      const updatePayload = (updateChain.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(updatePayload.share_enabled).toBe(false);
      // Disabling sharing must not create a notification.
      expect(mockCreateNotification).not.toHaveBeenCalled();
    });
  });
});
