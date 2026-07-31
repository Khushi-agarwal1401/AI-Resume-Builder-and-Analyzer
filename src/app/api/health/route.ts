import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  let db = "ok";
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("profiles").select("id").limit(1);
    if (error) db = "error";
  } catch {
    db = "error";
  }

  const ok = db === "ok";
  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      db,
      timestamp: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 }
  );
}
