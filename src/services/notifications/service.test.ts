import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({ from: mockFrom })),
}));

const mockAdminFrom = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabaseClient: vi.fn(() => ({ from: mockAdminFrom })),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function thenableChain<T = any>(resolveValue: T) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const self: Record<string, any> = {
    select: vi.fn(() => self),
    eq: vi.fn(() => self),
    gte: vi.fn(() => self),
    order: vi.fn(() => self),
    range: vi.fn(() => self),
    limit: vi.fn(() => self),
    insert: vi.fn(() => self),
    update: vi.fn(() => self),
    delete: vi.fn(() => self),
    maybeSingle: vi.fn(() => self),
    single: vi.fn(() => self),
    then: (resolve: (val: T) => void) => resolve(resolveValue),
  };
  return self;
}

const {
  createNotification,
  createNotificationAdmin,
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  deleteNotification,
  hasRecentUnreadNotification,
} = await import("./service");

describe("notifications service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReset();
    mockAdminFrom.mockReset();
  });

  describe("getNotifications", () => {
    it("queries the user's notifications newest-first with a default limit", async () => {
      const chain = thenableChain({ data: [{ id: "n1" }], error: null });
      mockFrom.mockReturnValue(chain);

      const result = await getNotifications("user-1");

      expect(mockFrom).toHaveBeenCalledWith("notifications");
      expect(chain.eq).toHaveBeenCalledWith("user_id", "user-1");
      expect(chain.order).toHaveBeenCalledWith("created_at", { ascending: false });
      expect(chain.range).toHaveBeenCalledWith(0, 29);
      expect(result).toEqual([{ id: "n1" }]);
    });

    it("applies type, read, offset and custom limit filters (Task 2.1 history page)", async () => {
      const chain = thenableChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);

      await getNotifications("user-1", { type: "ats", read: false, limit: 25, offset: 50 });

      expect(chain.eq).toHaveBeenCalledWith("user_id", "user-1");
      expect(chain.eq).toHaveBeenCalledWith("type", "ats");
      expect(chain.eq).toHaveBeenCalledWith("read", false);
      expect(chain.range).toHaveBeenCalledWith(50, 74);
    });

    it("skips filters when not provided", async () => {
      const chain = thenableChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);

      await getNotifications("user-1", { limit: 10, offset: 0 });

      // Only the user filter is applied.
      const eqCalls = (chain.eq as ReturnType<typeof vi.fn>).mock.calls;
      expect(eqCalls).toEqual([["user_id", "user-1"]]);
      expect(chain.range).toHaveBeenCalledWith(0, 9);
    });
  });

  describe("createNotification", () => {
    it("inserts a notification for the user", async () => {
      const chain = thenableChain({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      await createNotification("user-1", {
        type: "export",
        title: "Export completed",
        message: "Downloaded as PDF.",
        link: "/builder/res-1",
      });

      expect(mockFrom).toHaveBeenCalledWith("notifications");
      const payload = (chain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(payload).toEqual({
        user_id: "user-1",
        type: "export",
        title: "Export completed",
        message: "Downloaded as PDF.",
        link: "/builder/res-1",
      });
    });

    it("never throws when the insert fails (best-effort)", async () => {
      const chain = thenableChain({ data: null, error: new Error("DB down") });
      mockFrom.mockReturnValue(chain);

      await expect(createNotification("user-1", { type: "info", title: "x" })).resolves.toBeUndefined();
    });
  });

  describe("createNotificationAdmin", () => {
    it("inserts through the service-role client (webhook/worker path)", async () => {
      const chain = thenableChain({ data: null, error: null });
      mockAdminFrom.mockReturnValue(chain);

      await createNotificationAdmin("user-1", {
        type: "sub",
        title: "Welcome to Pro 🎉",
        message: "Pro is active.",
        link: "/settings/subscription",
      });

      expect(mockAdminFrom).toHaveBeenCalledWith("notifications");
      const payload = (chain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(payload.user_id).toBe("user-1");
      expect(payload.type).toBe("sub");
    });

    it("never throws when the insert fails", async () => {
      mockAdminFrom.mockReturnValue(thenableChain({ data: null, error: new Error("DB down") }));
      await expect(createNotificationAdmin("user-1", { type: "info", title: "x" })).resolves.toBeUndefined();
    });
  });

  describe("getUnreadCount", () => {
    it("counts unread notifications head-style", async () => {
      const chain = thenableChain({ count: 4, error: null });
      mockFrom.mockReturnValue(chain);

      const count = await getUnreadCount("user-1");

      expect(mockFrom).toHaveBeenCalledWith("notifications");
      expect(chain.select).toHaveBeenCalledWith("id", { count: "exact", head: true });
      expect(chain.eq).toHaveBeenCalledWith("read", false);
      expect(count).toBe(4);
    });
  });

  describe("markAllNotificationsRead", () => {
    it("updates all unread rows to read", async () => {
      const chain = thenableChain({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      await markAllNotificationsRead("user-1");

      const payload = (chain.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(payload).toEqual({ read: true });
      expect(chain.eq).toHaveBeenCalledWith("user_id", "user-1");
      expect(chain.eq).toHaveBeenCalledWith("read", false);
    });
  });

  describe("markNotificationRead / deleteNotification", () => {
    it("scopes the update by id AND user", async () => {
      const chain = thenableChain({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      await markNotificationRead("user-1", "n-1");

      expect(chain.eq).toHaveBeenCalledWith("id", "n-1");
      expect(chain.eq).toHaveBeenCalledWith("user_id", "user-1");
    });

    it("scopes the delete by id AND user", async () => {
      const chain = thenableChain({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      await deleteNotification("user-1", "n-1");

      expect(chain.delete).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith("id", "n-1");
      expect(chain.eq).toHaveBeenCalledWith("user_id", "user-1");
    });
  });

  describe("hasRecentUnreadNotification", () => {
    it("returns true when a recent unread notification exists", async () => {
      const chain = thenableChain({ data: [{ id: "n1" }], error: null });
      mockFrom.mockReturnValue(chain);

      const result = await hasRecentUnreadNotification("user-1", "ai", 1);

      expect(result).toBe(true);
      expect(chain.eq).toHaveBeenCalledWith("type", "ai");
      expect(chain.eq).toHaveBeenCalledWith("read", false);
      expect(chain.gte).toHaveBeenCalledWith("created_at", expect.any(String));
    });

    it("returns false on any error (dedupe is best-effort)", async () => {
      mockFrom.mockReturnValue(thenableChain({ data: null, error: new Error("DB down") }));
      await expect(hasRecentUnreadNotification("user-1", "ai", 1)).resolves.toBe(false);
    });
  });
});
