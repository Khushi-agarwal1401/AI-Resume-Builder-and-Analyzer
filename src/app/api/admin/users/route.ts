import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !(await isAdmin(session.user.id, session.user.email || ""))) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createServerSupabaseClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*, subscriptions(plan_id, status)")
    .order("created_at", { ascending: false })
    .limit(100);

  const users = await Promise.all(
    (profiles || []).map(async (p: Record<string, unknown>) => {
      const { count } = await supabase
        .from("resumes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", p.id as string);
      const subs = p.subscriptions as { plan_id?: string }[] | undefined;
      return {
        id: p.id as string,
        email: p.email as string | null,
        full_name: p.full_name as string | null,
        user_type: p.user_type as string | null,
        plan_id: subs?.[0]?.plan_id || "free",
        resume_count: count || 0,
        created_at: p.created_at as string,
      };
    })
  );

  return NextResponse.json({ success: true, data: users });
}
