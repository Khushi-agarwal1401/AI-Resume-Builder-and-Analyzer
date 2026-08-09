import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerClient } from "@/lib/db/server";

export const dynamic = "force-dynamic";

export interface LinkedInImportedItem {
  type: "certificate" | "achievement" | "post_reference";
  title: string;
  detail: string;
  date: string;
  url: string;
}

export interface LinkedInImportsGroup {
  resumeId: string;
  resumeTitle: string;
  items: LinkedInImportedItem[];
}

/**
 * GET /api/linkedin/imports
 * Lists every certification, achievement, and LinkedIn post reference the
 * user has added through the LinkedIn integration, grouped by resume —
 * mirroring the repo list on the GitHub integration page.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await createServerClient();

    const { data: resumes } = await db
      .from("resumes")
      .select("id, title")
      .eq("user_id", session.user.id)
      .order("updated_at", { ascending: false });

    if (!resumes || resumes.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const resumeIds = resumes.map((r) => r.id);
    const titleById = new Map(resumes.map((r) => [r.id, r.title]));

    const [certsRes, achRes, projRes] = await Promise.all([
      db.from("certifications").select("resume_id, name, issuer, date, url").in("resume_id", resumeIds),
      db.from("achievements").select("resume_id, title, description, date").in("resume_id", resumeIds),
      db.from("projects").select("resume_id, name, description, live_url").in("resume_id", resumeIds),
    ]);

    const groups = new Map<string, LinkedInImportedItem[]>();
    for (const id of resumeIds) groups.set(id, []);

    for (const c of certsRes.data || []) {
      groups.get(c.resume_id)?.push({
        type: "certificate",
        title: c.name,
        detail: c.issuer || "",
        date: c.date || "",
        url: c.url || "",
      });
    }
    for (const a of achRes.data || []) {
      groups.get(a.resume_id)?.push({
        type: "achievement",
        title: a.title,
        detail: a.description || "",
        date: a.date || "",
        url: "",
      });
    }
    for (const p of projRes.data || []) {
      // Only items created by the LinkedIn manual-add flow are marked
      if (typeof p.description === "string" && p.description.startsWith("LinkedIn post reference:")) {
        groups.get(p.resume_id)?.push({
          type: "post_reference",
          title: p.name,
          detail: (p.description || "").replace(/^LinkedIn post reference:\s*/, ""),
          date: "",
          url: p.live_url || "",
        });
      }
    }

    const data: LinkedInImportsGroup[] = Array.from(groups.entries())
      .map(([resumeId, items]) => ({
        resumeId,
        resumeTitle: titleById.get(resumeId) || "Untitled",
        items,
      }))
      .filter((g) => g.items.length > 0);

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
