import { createServerClient } from "@/lib/db/server";
import { createAdminClient } from "@/lib/db/admin";

export type NotificationType = "export" | "ats" | "github" | "ai" | "share" | "job" | "sub" | "info";

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
  created_at: string;
}

interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  message?: string;
  link?: string;
}

export interface GetNotificationsOptions {
  /** Max rows to return (default 30). */
  limit?: number;
  /** Rows to skip (pagination). */
  offset?: number;
  /** Filter by notification type. */
  type?: string;
  /** Filter by read state (true = read only, false = unread only). */
  read?: boolean;
}

/** Insert a notification for a user. Never throws — callers treat it as best-effort. */
export async function createNotification(userId: string, input: CreateNotificationInput) {
  try {
    const db = await createServerClient();
    const { error } = await db.from("notifications").insert({
      user_id: userId,
      type: input.type,
      title: input.title,
      message: input.message || "",
      link: input.link || "",
    });
    if (error) throw new Error(error.message);
  } catch (err) {
    // Notifications are best-effort; never fail the triggering operation.
    console.error("Failed to create notification:", err);
  }
}

/**
 * Insert a notification through the service-role client. Used by sessionless
 * flows (Stripe webhook, background worker) where RLS would hide the write.
 * Never throws.
 */
export async function createNotificationAdmin(userId: string, input: CreateNotificationInput) {
  try {
    const db = createAdminClient();
    const { error } = await db.from("notifications").insert({
      user_id: userId,
      type: input.type,
      title: input.title,
      message: input.message || "",
      link: input.link || "",
    });
    if (error) throw new Error(error.message);
  } catch (err) {
    console.error("Failed to create notification (admin):", err);
  }
}

export async function getNotifications(userId: string, options: GetNotificationsOptions = {}): Promise<NotificationRow[]> {
  const { limit = 30, offset = 0, type, read } = options;
  const db = await createServerClient();

  let query = db
    .from("notifications")
    .select("*")
    .eq("user_id", userId);

  if (type) query = query.eq("type", type);
  if (read !== undefined) query = query.eq("read", read);

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);
  return (data || []) as NotificationRow[];
}

export async function getUnreadCount(userId: string): Promise<number> {
  const db = await createServerClient();
  const { count, error } = await db
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) throw new Error(error.message);
  return count || 0;
}

export async function markAllNotificationsRead(userId: string) {
  const db = await createServerClient();
  const { error } = await db
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
  if (error) throw new Error(error.message);
}

/** Returns true if the user has an unread notification of the given type within the last `minutes`. Used to dedupe high-frequency events (e.g. AI). */
export async function hasRecentUnreadNotification(userId: string, type: string, minutes = 5): Promise<boolean> {
  try {
    const db = await createServerClient();
    const since = new Date(Date.now() - minutes * 60_000).toISOString();
    const { data, error } = await db
      .from("notifications")
      .select("id")
      .eq("user_id", userId)
      .eq("type", type)
      .eq("read", false)
      .gte("created_at", since)
      .limit(1);
    if (error) throw new Error(error.message);
    return (data?.length ?? 0) > 0;
  } catch {
    return false;
  }
}

export async function markNotificationRead(userId: string, id: string) {
  const db = await createServerClient();
  const { error } = await db
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function deleteNotification(userId: string, id: string) {
  const db = await createServerClient();
  const { error } = await db
    .from("notifications")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}
