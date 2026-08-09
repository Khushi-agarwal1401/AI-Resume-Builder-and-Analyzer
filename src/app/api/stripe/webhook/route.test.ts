import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockFrom = vi.fn();
const mockConstructEvent = vi.fn();
const mockRetrieveSubscription = vi.fn();

vi.mock("@/lib/stripe", () => ({
  getStripe: vi.fn(() => ({
    webhooks: { constructEvent: (...args: unknown[]) => mockConstructEvent(...args) },
    subscriptions: { retrieve: (...args: unknown[]) => mockRetrieveSubscription(...args) },
  })),
}));

vi.mock("@/lib/db/admin", () => ({
  createAdminClient: vi.fn(() => ({ from: mockFrom })),
}));

vi.mock("@sentry/nextjs", () => ({
  captureMessage: vi.fn(),
}));

vi.mock("@/services/notifications/service", () => ({
  createNotificationAdmin: vi.fn(),
}));

import { createNotificationAdmin } from "@/services/notifications/service";

const mockCreateNotificationAdmin = vi.mocked(createNotificationAdmin);

import { POST } from "./route";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function thenableChain<T = any>(resolveValue: T) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const self: Record<string, any> = {
    insert: vi.fn(() => self),
    select: vi.fn(() => self),
    eq: vi.fn(() => self),
    maybeSingle: vi.fn(() => self),
    upsert: vi.fn(() => self),
    update: vi.fn(() => self),
    delete: vi.fn(() => self),
    then: (resolve: (val: T) => void) => resolve(resolveValue),
  };
  return self;
}

function webhookRequest(payload: string, signature = "sig-123") {
  const headers: Record<string, string> = { "stripe-signature": signature };
  headers["Content-Type"] = "application/json";
  return new NextRequest("http://localhost:3000/api/stripe/webhook", {
    method: "POST",
    headers,
    body: payload,
  });
}

function makeEvent(type: string, object: Record<string, unknown>, id = "evt_test_1") {
  return { id, type, data: { object } };
}

describe("Stripe webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReset();
    mockConstructEvent.mockReset();
    mockRetrieveSubscription.mockReset();
    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_x";
    process.env.STRIPE_PRO_PRICE_ID_MONTHLY = "price_pro_monthly";
    process.env.STRIPE_PRO_PRICE_ID_YEARLY = "price_pro_yearly";
  });

  it("rejects an invalid signature", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });
    // NOTE: each test uses a unique event id — the module-level in-memory
    // dedup set is shared across tests in this file.

    const res = await POST(webhookRequest("{}"));

    expect(res.status).toBe(400);
  });

  it("no-ops a duplicate event (unique violation on webhook_events)", async () => {
    mockConstructEvent.mockReturnValue(makeEvent("checkout.session.completed", {
      metadata: { userId: "u-1" },
      subscription: "sub_1",
      customer: "cus_1",
    }, "evt_dup"));
    mockFrom.mockReturnValueOnce(thenableChain({ error: { code: "23505", message: "duplicate" } }));

    const res = await POST(webhookRequest("{}"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true, idempotent: true });
    // The duplicate must not reach the subscription write path.
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it("maps a known Pro price id to the pro plan and notifies the user", async () => {
    mockConstructEvent.mockReturnValue(makeEvent("checkout.session.completed", {
      metadata: { userId: "u-1" },
      subscription: "sub_1",
      customer: "cus_1",
    }, "evt_pro"));
    mockRetrieveSubscription.mockResolvedValue({
      status: "active",
      items: { data: [{ price: { id: "price_pro_monthly" } }] },
      current_period_start: 1700000000,
      current_period_end: 1702592000,
    });
    mockFrom
      .mockReturnValueOnce(thenableChain({ error: null })) // webhook_events insert
      .mockReturnValueOnce(thenableChain({ data: null, error: null })) // existing sub check
      .mockReturnValueOnce(thenableChain({ error: null })); // subscriptions upsert

    const res = await POST(webhookRequest("{}"));

    expect(res.status).toBe(200);
    const upsertCall = mockFrom.mock.results[2].value.upsert as ReturnType<typeof vi.fn>;
    expect(upsertCall).toHaveBeenCalledTimes(1);
    const payload = upsertCall.mock.calls[0][0];
    expect(payload.plan_id).toBe("pro");
    expect(payload.user_id).toBe("u-1");

    // Notification Center (Task 2.1): Pro welcome notification via admin client.
    expect(mockCreateNotificationAdmin).toHaveBeenCalledWith(
      "u-1",
      expect.objectContaining({ type: "sub", title: expect.stringContaining("Pro") })
    );
  });

  it("falls back to the free plan and alerts on an unknown price id", async () => {
    mockConstructEvent.mockReturnValue(makeEvent("checkout.session.completed", {
      metadata: { userId: "u-2" },
      subscription: "sub_2",
      customer: "cus_2",
    }, "evt_unknown"));
    mockRetrieveSubscription.mockResolvedValue({
      status: "active",
      items: { data: [{ price: { id: "price_enterprise_99" } }] },
      current_period_start: 1700000000,
      current_period_end: 1702592000,
    });
    mockFrom
      .mockReturnValueOnce(thenableChain({ error: null }))
      .mockReturnValueOnce(thenableChain({ data: null, error: null }))
      .mockReturnValueOnce(thenableChain({ error: null }));

    const res = await POST(webhookRequest("{}"));

    expect(res.status).toBe(200);
    const upsertCall = mockFrom.mock.results[2].value.upsert as ReturnType<typeof vi.fn>;
    const payload = upsertCall.mock.calls[0][0];
    expect(payload.plan_id).toBe("free");
  });

  it("updates by stripe_subscription_id for cancel events and notifies the user", async () => {
    mockConstructEvent.mockReturnValue(makeEvent("customer.subscription.deleted", {
      id: "sub_9",
      status: "canceled",
      cancel_at_period_end: true,
    }, "evt_cancel"));
    const updateChain = thenableChain({ error: null });
    mockFrom
      .mockReturnValueOnce(thenableChain({ error: null })) // webhook_events insert
      .mockReturnValueOnce(thenableChain({ data: { user_id: "u-1" }, error: null })) // sub row lookup
      .mockReturnValueOnce(updateChain); // subscriptions update

    const res = await POST(webhookRequest("{}"));

    expect(res.status).toBe(200);
    const updateCall = updateChain.update as ReturnType<typeof vi.fn>;
    expect(updateCall).toHaveBeenCalledTimes(1);
    expect(updateCall.mock.calls[0][0].status).toBe("canceled");
    expect((updateChain.eq as ReturnType<typeof vi.fn>).mock.calls).toContainEqual(["stripe_subscription_id", "sub_9"]);

    // Notification Center (Task 2.1): subscription-ended notice via admin client.
    expect(mockCreateNotificationAdmin).toHaveBeenCalledWith(
      "u-1",
      expect.objectContaining({ type: "sub", title: expect.stringContaining("ended") })
    );
  });

  it("deletes the dedup row so Stripe retries re-process a failed event", async () => {
    mockConstructEvent.mockReturnValue(makeEvent("customer.subscription.deleted", {
      id: "sub_9",
      status: "canceled",
    }, "evt_fail"));
    // A thrown error (e.g. Stripe retrieve failing) surfaces via the builder's
    // promise — reject it so the route's catch runs.
    const updateChain = {
      then: (_resolve: unknown, reject: (e: Error) => void) => reject(new Error("db down")),
    };
    const deleteChain = thenableChain({ error: null });
    mockFrom
      .mockReturnValueOnce(thenableChain({ error: null })) // webhook_events insert
      .mockReturnValueOnce(thenableChain({ data: { user_id: "u-1" }, error: null })) // sub row lookup
      .mockReturnValueOnce(updateChain) // subscriptions update (throws)
      .mockReturnValueOnce(deleteChain); // webhook_events delete in catch

    const res = await POST(webhookRequest("{}"));

    expect(res.status).toBe(500);
    expect((deleteChain.delete as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(1);
    expect((deleteChain.eq as ReturnType<typeof vi.fn>).mock.calls).toContainEqual(["event_id", "evt_fail"]);

    // A Stripe retry with the same event id must NOT short-circuit on the
    // in-memory set — the failure cleared it, so it re-processes.
    mockFrom.mockReset();
    mockFrom
      .mockReturnValueOnce(thenableChain({ error: null })) // webhook_events insert
      .mockReturnValueOnce(thenableChain({ data: null, error: null })) // sub row lookup
      .mockReturnValueOnce(thenableChain({ error: null })); // subscriptions update
    const retry = await POST(webhookRequest("{}"));
    expect(retry.status).toBe(200);
    expect(mockFrom).toHaveBeenCalledTimes(3); // reached the DB, not idempotent
  });
});
