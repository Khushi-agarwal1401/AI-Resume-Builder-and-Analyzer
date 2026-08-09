import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockFrom = vi.fn();
const mockFetch = vi.fn();

vi.mock("@/lib/db/server", () => ({
  createServerClient: vi.fn(async () => ({ from: mockFrom })),
}));

vi.mock("@/lib/api", () => ({
  logError: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(async () => true),
}));

import { createServerClient } from "@/lib/db/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { logError } from "@/lib/api";
import { POST } from "./route";

const mockCreateServerClient = vi.mocked(createServerClient);
const mockCheckRateLimit = vi.mocked(checkRateLimit);
const mockLogError = vi.mocked(logError);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function thenableChain<T = any>(resolveValue: T) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const self: Record<string, any> = {
    select: vi.fn(() => self),
    eq: vi.fn(() => self),
    maybeSingle: vi.fn(() => self),
    update: vi.fn(() => self),
    then: (resolve: (val: T) => void) => resolve(resolveValue),
  };
  return self;
}

function makeRequest(url = "https://resumeai.example.com/api/auth/forgot-password") {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "user@example.com" }),
  });
}

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReset();
    // Default: no matching profile (unknown email).
    mockFrom.mockReturnValue(thenableChain({ data: null, error: null }));
    mockCheckRateLimit.mockResolvedValue(true);
    mockFetch.mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", mockFetch);
    vi.stubEnv("RESEND_API_KEY", "test-key");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates a reset token and emails a reset link when the profile exists", async () => {
    mockFrom.mockReturnValueOnce(
      thenableChain({
        data: { id: "profile-1", email: "user@example.com", full_name: "User" },
        error: null,
      })
    );

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    // Profile is looked up by email.
    expect(mockFrom).toHaveBeenCalledWith("profiles");
    // Reset token is stored on the profile.
    const updateCall = mockFrom.mock.calls.find(([t]) => t === "profiles");
    expect(updateCall).toBeTruthy();
    // Email is sent with a one-time token link.
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.to).toBe("user@example.com");
    expect(body.html).toContain("/reset-password?token=");
  });

  it("builds the reset URL from the request origin (localhost in dev)", async () => {
    mockFrom.mockReturnValueOnce(
      thenableChain({
        data: { id: "profile-1", email: "user@example.com", full_name: null },
        error: null,
      })
    );

    await POST(makeRequest("http://localhost:3000/api/auth/forgot-password"));

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.html).toContain("http://localhost:3000/reset-password?token=");
  });

  it("returns 429 when rate limited", async () => {
    mockCheckRateLimit.mockResolvedValue(false);

    const res = await POST(makeRequest());

    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({
      success: false,
      error: "Too many requests. Please try again later.",
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid email", async () => {
    const res = await POST(
      new Request("https://resumeai.example.com/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "not-an-email" }),
      })
    );

    expect(res.status).toBe(400);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("still returns success when the email is unknown (no user enumeration)", async () => {
    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    // No reset email is sent for unknown addresses.
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("still returns success when the profile lookup throws (no user enumeration)", async () => {
    mockFrom.mockImplementationOnce(() => {
      throw new Error("db is down");
    });

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(mockLogError).toHaveBeenCalledWith(
      expect.any(Error),
      "forgot-password"
    );
  });

  it("handles a malformed JSON body without crashing", async () => {
    const res = await POST(
      new Request("https://resumeai.example.com/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{not json",
      })
    );

    expect(res.status).toBe(400);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("rate limits by IP", async () => {
    await POST(makeRequest());

    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      expect.stringContaining("forgot-password:"),
      3,
      10 * 60 * 1000
    );
    expect(mockCreateServerClient).toHaveBeenCalled();
  });
});
