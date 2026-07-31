import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { invalidatePrompt } from "@/services/ai/prompts";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !(await isAdmin(session.user.id, session.user.email || ""))) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("prompts").select("*").order("created_at", { ascending: false });

  const prompts = (data || []).map((p: Record<string, unknown>) => ({
    key: p.key as string,
    label: p.label as string,
    template: p.template as string,
  }));

  if (prompts.length === 0) {
    const { DEFAULT_PROMPTS } = await import("@/services/ai/prompts");
    return NextResponse.json({
      success: true,
      data: Object.entries(DEFAULT_PROMPTS).map(([key, template]) => ({ key, label: key, template })),
    });
  }

  return NextResponse.json({ success: true, data: prompts });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !(await isAdmin(session.user.id, session.user.email || ""))) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const { key, template } = await request.json();
    if (!key || !template) {
      return NextResponse.json({ success: false, error: "Missing key or template" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    await supabase.from("prompts").upsert({
      key,
      label: key,
      template,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });

    // Drop cached prompt so the next AI request uses the new template.
    invalidatePrompt(key);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
