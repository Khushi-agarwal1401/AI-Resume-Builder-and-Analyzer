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

  const healthy = db === "ok";
  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      db,
      timestamp: new Date().toISOString(),
    },
    {
      status: healthy ? 200 : 503,
      // Health checks must not be cached — load balancers poll it live.
      headers: { "Cache-Control": "no-store" },
    }
  );
}
