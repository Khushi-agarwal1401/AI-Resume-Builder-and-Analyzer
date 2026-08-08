import { describe, it, expect, vi, beforeEach } from "vitest";

const mockResetPasswordForEmail = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    auth: { resetPasswordForEmail: mockResetPasswordForEmail },
  })),
}));

vi.mock("@/lib/api", () => ({
  logError: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(async () => true),
}));

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { logError } from "@/lib/api";
import { POST } from "./route";

const mockCreateServerSupabaseClient = vi.mocked(createServerSupabaseClient);
const mockCheckRateLimit = vi.mocked(checkRateLimit);
const mockLogError = vi.mocked(logError);

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
    mockResetPasswordForEmail.mockReset();
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
    mockCheckRateLimit.mockResolvedValue(true);
  });

  it("sends a reset email to the requested address", async () => {
    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith("user@example.com", {
      redirectTo: "https://resumeai.example.com/reset-password",
    });
  });

  it("builds the redirect URL from the request origin (localhost in dev)", async () => {
    await POST(makeRequest("http://localhost:3000/api/auth/forgot-password"));

    expect(mockResetPasswordForEmail).toHaveBeenCalledWith("user@example.com", {
      redirectTo: "http://localhost:3000/reset-password",
    });
  });

  it("returns 429 when rate limited", async () => {
    mockCheckRateLimit.mockResolvedValue(false);

    const res = await POST(makeRequest());

    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({
      success: false,
      error: "Too many requests. Please try again later.",
    });
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
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
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("still returns success when the email is unknown (no user enumeration)", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: new Error("not found") });

    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
  });

  it("still returns success when the auth call throws (no user enumeration)", async () => {
    mockResetPasswordForEmail.mockRejectedValue(new Error("supabase is down"));

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
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("rate limits by IP", async () => {
    await POST(makeRequest());

    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      expect.stringContaining("forgot-password:"),
      3,
      10 * 60 * 1000
    );
    expect(mockCreateServerSupabaseClient).toHaveBeenCalled();
  });
});
