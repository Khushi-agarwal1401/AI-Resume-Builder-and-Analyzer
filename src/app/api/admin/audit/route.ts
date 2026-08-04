import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/audit?limit=50&offset=0
 * Returns the admin audit log (newest first). Admin-only.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !(await isAdmin(session.user.id, session.user.email || ""))) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10) || 50, 1), 200);
  const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10) || 0, 0);

  const supabase = await createServerSupabaseClient();

  const { data: rows, error } = await supabase
    .from("admin_audit_log")
    .select("id, admin_id, action, target_type, target_id, changes, created_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const { count } = await supabase
    .from("admin_audit_log")
    .select("id", { count: "exact", head: true });

  // Resolve admin emails + target info in bulk (no N+1).
  // Guard empty lists: supabase .in("id", []) is unreliable across versions.
  const adminIds = [...new Set((rows || []).map((r) => r.admin_id))];
  const targetIds = [...new Set((rows || []).map((r) => r.target_id))].filter(Boolean);

  const emailByAdmin = new Map<string, string>();
  const emailByTarget = new Map<string, string>();
  if (adminIds.length > 0) {
    const { data: adminProfiles } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", adminIds);
    for (const p of adminProfiles || []) emailByAdmin.set(p.id, p.email);
  }
  if (targetIds.length > 0) {
    const { data: targetProfiles } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", targetIds);
    for (const p of targetProfiles || []) emailByTarget.set(p.id, p.email);
  }

  const data = (rows || []).map((r) => ({
    id: r.id,
    action: r.action,
    target_type: r.target_type,
    target_id: r.target_id,
    targetLabel:
      r.target_type === "user"
        ? emailByTarget.get(r.target_id) || r.target_id
        : r.target_id,
    changes: r.changes as Record<string, unknown> | null,
    adminEmail: emailByAdmin.get(r.admin_id) || "",
    created_at: r.created_at,
  }));

  return NextResponse.json({ success: true, data, total: count || 0 });
}
