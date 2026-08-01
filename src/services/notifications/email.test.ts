import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(() => ({ from: mockFrom })),
}));

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendChannelEmail } from "./email";

const mockCreateServerSupabaseClient = vi.mocked(createServerSupabaseClient);
const mockFetch = vi.fn();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function thenableChain<T = any>(resolveValue: T) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const self: Record<string, any> = {
    select: vi.fn(() => self),
    eq: vi.fn(() => self),
    maybeSingle: vi.fn(() => self),
    then: (resolve: (val: T) => void) => resolve(resolveValue),
  };
  return self;
}

function settingsChain(overrides: Record<string, unknown> = {}) {
  return thenableChain({
    data: {
      email_notifications: true,
      resume_updates: true,
      job_alerts: true,
      ...overrides,
    },
    error: null,
  });
}

function profileChain(email: string | null) {
  return thenableChain({ data: email ? { email } : null, error: null });
}

describe("sendChannelEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReset();
    vi.stubGlobal("fetch", mockFetch);
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.RESEND_FROM_EMAIL = "Test <test@example.com>";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
  });

  it("skips when the master email_notifications toggle is off", async () => {
    mockFrom
      .mockReturnValueOnce(settingsChain({ email_notifications: false }))
      .mockReturnValueOnce(profileChain("jane@example.com"));

    const result = await sendChannelEmail("user-123", "resume_updates", {
      subject: "New update",
      body: "Body",
    });

    expect(result).toEqual({ sent: false, skipped: true });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("skips when the per-channel toggle is off", async () => {
    mockFrom
      .mockReturnValueOnce(settingsChain({ job_alerts: false }))
      .mockReturnValueOnce(profileChain("jane@example.com"));

    const result = await sendChannelEmail("user-123", "job_alerts", {
      subject: "New update",
      body: "Body",
    });

    expect(result).toEqual({ sent: false, skipped: true });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("skips when the user has no email on file", async () => {
    mockFrom
      .mockReturnValueOnce(settingsChain())
      .mockReturnValueOnce(profileChain(null));

    const result = await sendChannelEmail("user-123", "resume_updates", {
      subject: "New update",
      body: "Body",
    });

    expect(result).toEqual({ sent: false, skipped: true });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("skips when RESEND_API_KEY is not configured", async () => {
    delete process.env.RESEND_API_KEY;
    mockFrom
      .mockReturnValueOnce(settingsChain())
      .mockReturnValueOnce(profileChain("jane@example.com"));

    const result = await sendChannelEmail("user-123", "resume_updates", {
      subject: "New update",
      body: "Body",
    });

    expect(result).toEqual({ sent: false, skipped: true });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("sends the email via Resend with HTML-escaped body", async () => {
    mockFrom
      .mockReturnValueOnce(settingsChain())
      .mockReturnValueOnce(profileChain("jane@example.com"));
    mockFetch.mockResolvedValue({ ok: true, status: 200 } as Response);

    const result = await sendChannelEmail("user-123", "resume_updates", {
      subject: "A & B <new>",
      body: "Check <b>this</b> out & more",
    });

    expect(result).toEqual({ sent: true, skipped: false });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: "Bearer re_test_key",
      "Content-Type": "application/json",
    });
    const payload = JSON.parse((init as RequestInit).body as string);
    expect(payload.from).toBe("Test <test@example.com>");
    expect(payload.to).toBe("jane@example.com");
    expect(payload.subject).toBe("A & B <new>");
    // HTML-escaped body: <b> → &lt;b&gt;
    expect(payload.html).toContain("Check &lt;b&gt;this&lt;/b&gt; out &amp; more");
  });

  it("reports not-sent when Resend rejects the request", async () => {
    mockFrom
      .mockReturnValueOnce(settingsChain())
      .mockReturnValueOnce(profileChain("jane@example.com"));
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => "invalid from",
    } as unknown as Response);

    const result = await sendChannelEmail("user-123", "resume_updates", {
      subject: "New update",
      body: "Body",
    });

    expect(result).toEqual({ sent: false, skipped: false });
  });

  it("never throws and reports not-sent when fetch itself fails", async () => {
    mockFrom
      .mockReturnValueOnce(settingsChain())
      .mockReturnValueOnce(profileChain("jane@example.com"));
    mockFetch.mockRejectedValue(new Error("network down"));

    const result = await sendChannelEmail("user-123", "resume_updates", {
      subject: "New update",
      body: "Body",
    });

    expect(result).toEqual({ sent: false, skipped: false });
  });

  it("reads the user's settings and profile via the authenticated supabase client", async () => {
    mockFrom
      .mockReturnValueOnce(settingsChain())
      .mockReturnValueOnce(profileChain("jane@example.com"));
    mockFetch.mockResolvedValue({ ok: true, status: 200 } as Response);

    await sendChannelEmail("user-123", "resume_updates", {
      subject: "New update",
      body: "Body",
    });

    expect(mockCreateServerSupabaseClient).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenNthCalledWith(1, "settings");
    expect(mockFrom).toHaveBeenNthCalledWith(2, "profiles");
  });
});
