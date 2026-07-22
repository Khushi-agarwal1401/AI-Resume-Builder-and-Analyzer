import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const localPrompts: Record<string, string> = {};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.email !== "admin@resumeai.com") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const supabase = createServerSupabaseClient();
  const { data } = await supabase.from("prompts").select("*").order("created_at", { ascending: false });

  const prompts = (data || []).map((p: Record<string, unknown>) => ({
    key: p.key as string,
    label: p.label as string,
    template: p.template as string,
  }));

  if (prompts.length === 0 && Object.keys(localPrompts).length > 0) {
    return NextResponse.json({
      success: true,
      data: Object.entries(localPrompts).map(([key, template]) => ({ key, label: key, template })),
    });
  }

  return NextResponse.json({ success: true, data: prompts });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.email !== "admin@resumeai.com") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const { key, template } = await request.json();
    if (!key || !template) {
      return NextResponse.json({ success: false, error: "Missing key or template" }, { status: 400 });
    }

    localPrompts[key] = template;

    const supabase = createServerSupabaseClient();
    await supabase.from("prompts").upsert({
      key,
      label: key,
      template,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to save" },
      { status: 500 }
    );
  }
}
