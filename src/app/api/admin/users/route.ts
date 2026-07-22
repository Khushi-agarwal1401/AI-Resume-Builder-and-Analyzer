import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !(await isAdmin(session.user.id, session.user.email || ""))) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createServerSupabaseClient();

  // Fetch profiles with their subscriptions
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, user_type, role, created_at, subscriptions(plan_id, status)")
    .order("created_at", { ascending: false })
    .limit(100);

  // Single aggregate query for resume counts instead of N+1
  const { data: resumeCounts } = await supabase
    .from("resumes")
    .select("user_id");

  const countMap = new Map<string, number>();
  for (const r of resumeCounts || []) {
    countMap.set(r.user_id, (countMap.get(r.user_id) || 0) + 1);
  }

  const users = (profiles || []).map((p: Record<string, unknown>) => {
    const subs = p.subscriptions as { plan_id?: string }[] | undefined;
    return {
      id: p.id as string,
      email: p.email as string | null,
      full_name: p.full_name as string | null,
      user_type: p.user_type as string | null,
      role: p.role as string | null,
      plan_id: subs?.[0]?.plan_id || "free",
      resume_count: countMap.get(p.id as string) || 0,
      created_at: p.created_at as string,
    };
  });

  return NextResponse.json({ success: true, data: users });
}
