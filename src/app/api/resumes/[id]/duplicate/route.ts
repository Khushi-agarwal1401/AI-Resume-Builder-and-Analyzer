import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { duplicateResume } from "@/services/resume/service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    let newTitle: string | undefined;
    try {
      const body = await req.json();
      if (body && typeof body.title === "string" && body.title.trim()) {
        newTitle = body.title.trim();
      }
    } catch {
      // No body — use the default "(Copy)" title.
    }

    const duplicate = await duplicateResume(id, session.user.id, newTitle);
    return NextResponse.json({ success: true, data: duplicate });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 404 }
    );
  }
}
