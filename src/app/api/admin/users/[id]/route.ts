import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerClient } from "@/lib/db/server";
import type { Database } from "@/lib/db/types";
import { isAdmin, logAdminAction } from "@/lib/admin";
import { adminUserUpdateSchema, validateOrError } from "@/lib/validation";
import { fail, logError } from "@/lib/api";

export const dynamic = "force-dynamic";

async function requireAdmin(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !(await isAdmin(session.user.id, session.user.email || ""))) {
    return null;
  }
  return session.user.id;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const validated = validateOrError(adminUserUpdateSchema, { ...body, id });
  if ("error" in validated) return validated.error;
  const { role, is_active } = validated.data;

  // Admins must not modify their own role or deactivate themselves.
  if (id === adminId) {
    return NextResponse.json(
      { success: false, error: "You cannot modify your own admin account" },
      { status: 400 }
    );
  }

  const db = await createServerClient();
  const fields: Database["public"]["Tables"]["profiles"]["Update"] = {};
  if (role !== undefined) fields.role = role;
  if (is_active !== undefined) fields.is_active = is_active;

  const { data: before } = await db
    .from("profiles")
    .select("role, is_active")
    .eq("id", id)
    .single();

  const { error } = await db.from("profiles").update(fields).eq("id", id);
  if (error) {
    await logError(error, `admin update user ${id}`);
    return fail("Failed to update the user profile");
  }

  await logAdminAction(adminId, "user.update", "user", id, {
    before,
    after: fields,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ success: false, error: "Invalid user id" }, { status: 400 });
  }

  // Admins must not delete their own account.
  if (id === adminId) {
    return NextResponse.json(
      { success: false, error: "You cannot delete your own admin account" },
      { status: 400 }
    );
  }

  // Delete the profile — every owned table references profiles(id)
  // ON DELETE CASCADE, so the user's data is removed automatically.
  const db = await createServerClient();
  const { error } = await db.from("profiles").delete().eq("id", id);
  if (error) {
    await logError(error, `admin delete user ${id}`);
    return fail("Failed to delete the user account");
  }

  await logAdminAction(adminId, "user.delete", "user", id);

  return NextResponse.json({ success: true });
}
