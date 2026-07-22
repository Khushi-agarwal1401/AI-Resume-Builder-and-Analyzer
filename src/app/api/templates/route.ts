import { NextResponse } from "next/server";
import { getActiveTemplates } from "@/services/templates/service";

export const dynamic = "force-dynamic";

/** GET /api/templates — public catalog of active templates */
export async function GET() {
  try {
    const data = await getActiveTemplates();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch templates" },
      { status: 500 }
    );
  }
}
