import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFrom = vi.fn();
const mockDeleteUser = vi.fn();
const mockCancel = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/api", () => ({
  logError: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
    auth: {
      admin: { deleteUser: mockDeleteUser },
    },
  })),
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: vi.fn(async () => ({
    subscriptions: { cancel: mockCancel },
  })),
}));

import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";
import { logError } from "@/lib/api";
import { POST } from "./route";

const mockGetServerSession = vi.mocked(getServerSession);
const mockCreateClient = vi.mocked(createClient);
const mockGetStripe = vi.mocked(getStripe);
const mockLogError = vi.mocked(logError);

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

describe("POST /api/auth/delete-account", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReset();
    // Defaults: no subscription row, deletion succeeds.
    mockFrom.mockReturnValue(thenableChain({ data: null, error: null }));
    mockDeleteUser.mockResolvedValue({ error: null });
    mockCancel.mockResolvedValue(undefined);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await POST();

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({
      success: false,
      error: "You must be signed in to delete your account.",
    });
    // Nothing runs before the session check.
    expect(mockCreateClient).not.toHaveBeenCalled();
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it("returns 401 when the session has no user id", async () => {
    mockGetServerSession.mockResolvedValue({ user: {} });

    const res = await POST();

    expect(res.status).toBe(401);
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it("cancels the active Stripe subscription and deletes the user", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockFrom.mockReturnValueOnce(
      thenableChain({
        data: {
          stripe_subscription_id: "sub_active_1",
          status: "active",
        },
        error: null,
      })
    );

    const res = await POST();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    // Stripe cancellation is called with the stored subscription id.
    expect(mockGetStripe).toHaveBeenCalledTimes(1);
    expect(mockCancel).toHaveBeenCalledWith("sub_active_1");
    // User deletion is scoped to the session user.
    expect(mockDeleteUser).toHaveBeenCalledWith("user-123");
  });

  it("cancels trialing subscriptions too", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockFrom.mockReturnValueOnce(
      thenableChain({
        data: { stripe_subscription_id: "sub_trial_1", status: "trialing" },
        error: null,
      })
    );

    const res = await POST();

    expect(res.status).toBe(200);
    expect(mockCancel).toHaveBeenCalledWith("sub_trial_1");
    expect(mockDeleteUser).toHaveBeenCalledWith("user-123");
  });

  it("skips Stripe cancellation for inactive subscriptions", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockFrom.mockReturnValueOnce(
      thenableChain({
        data: {
          stripe_subscription_id: "sub_canceled_1",
          status: "canceled",
        },
        error: null,
      })
    );

    const res = await POST();

    expect(res.status).toBe(200);
    expect(mockCancel).not.toHaveBeenCalled();
    expect(mockDeleteUser).toHaveBeenCalledWith("user-123");
  });

  it("skips Stripe cancellation when the subscription has no stripe id", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockFrom.mockReturnValueOnce(
      thenableChain({
        data: { stripe_subscription_id: null, status: "active" },
        error: null,
      })
    );

    const res = await POST();

    expect(res.status).toBe(200);
    expect(mockCancel).not.toHaveBeenCalled();
    expect(mockDeleteUser).toHaveBeenCalledWith("user-123");
  });

  it("skips Stripe cancellation when the user has no subscription row", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });

    const res = await POST();

    expect(res.status).toBe(200);
    expect(mockCancel).not.toHaveBeenCalled();
    expect(mockDeleteUser).toHaveBeenCalledWith("user-123");
  });

  it("still deletes the account when Stripe cancellation fails (best-effort)", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockFrom.mockReturnValueOnce(
      thenableChain({
        data: { stripe_subscription_id: "sub_active_1", status: "active" },
        error: null,
      })
    );
    mockCancel.mockRejectedValueOnce(new Error("stripe is down"));

    const res = await POST();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    // The failure is logged but must never block account deletion.
    expect(mockLogError).toHaveBeenCalledWith(
      expect.any(Error),
      "delete-account stripe cancel"
    );
    expect(mockDeleteUser).toHaveBeenCalledWith("user-123");
  });

  it("still deletes the account when the subscription query fails (best-effort)", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockFrom.mockImplementationOnce(() => {
      throw new Error("db is down");
    });

    const res = await POST();

    expect(res.status).toBe(200);
    expect(mockLogError).toHaveBeenCalledWith(
      expect.any(Error),
      "delete-account stripe cancel"
    );
    expect(mockDeleteUser).toHaveBeenCalledWith("user-123");
  });

  it("returns 500 when user deletion reports an error", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockDeleteUser.mockResolvedValueOnce({
      error: new Error("delete failed"),
    });

    const res = await POST();

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      success: false,
      error: "We couldn't delete your account right now. Please contact support.",
    });
    expect(mockLogError).toHaveBeenCalled();
  });

  it("returns 500 when user deletion throws", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user-123" } });
    mockDeleteUser.mockRejectedValueOnce(new Error("boom"));

    const res = await POST();

    expect(res.status).toBe(500);
    expect((await res.json()).success).toBe(false);
    expect(mockLogError).toHaveBeenCalled();
  });
});
