import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  deleteNotification,
  createNotification,
} from "@/services/notifications/service";

export const dynamic = "force-dynamic";

/**
 * GET /api/notifications
 * List notifications + unread count. Supports filters for the history page:
 *   ?type=ats|ai|export|share|job|sub|github|info
 *   &read=true|false
 *   &limit=25&offset=0   (pagination)
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const type = sp.get("type") || undefined;
  const readParam = sp.get("read");
  const read = readParam === "true" ? true : readParam === "false" ? false : undefined;
  const limit = Math.min(Number(sp.get("limit")) || 30, 100);
  const offset = Math.max(Number(sp.get("offset")) || 0, 0);

  try {
    const [notifications, unreadCount] = await Promise.all([
      getNotifications(session.user.id, { limit, offset, type, read }),
      getUnreadCount(session.user.id),
    ]);
    return NextResponse.json({ success: true, data: { notifications, unreadCount } });
  } catch (err) {
    console.error("GET /api/notifications error:", err);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

/** POST /api/notifications — create a notification (used by event wiring) */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  if (!body.title || typeof body.title !== "string") {
    return NextResponse.json({ success: false, error: "Missing title" }, { status: 400 });
  }

  await createNotification(session.user.id, {
    type: body.type || "info",
    title: body.title,
    message: body.message || "",
    link: body.link || "",
  });

  return NextResponse.json({ success: true }, { status: 201 });
}

/** PATCH /api/notifications — mark all as read (or ?id= single) */
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  try {
    if (id) {
      await markNotificationRead(session.user.id, id);
    } else {
      await markAllNotificationsRead(session.user.id);
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

/** DELETE /api/notifications?id=... — delete a single notification */
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
  }

  try {
    await deleteNotification(session.user.id, id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
