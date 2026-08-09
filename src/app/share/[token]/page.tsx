import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/db/admin";
import { mapRowToResumeData } from "@/services/resume/mapper";
import { MemoTemplateRenderer } from "@/features/resume-builder/templates/TemplateRenderer";
import type { ResumeRow } from "@/services/resume/mapper";

export const dynamic = "force-dynamic";

interface SharePageProps {
  params: Promise<{ token: string }>;
}

interface ShareRow extends ResumeRow {
  share_token: string | null;
  share_enabled: boolean;
  view_count: number;
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { token } = await params;
  const db = createAdminClient();
  const { data } = await db
    .from("resumes")
    .select("title")
    .eq("share_token", token)
    .eq("share_enabled", true)
    .single();

  const row = data as { title?: string } | null;

  return {
    title: row?.title ? `${row.title} — Public Resume` : "Resume",
    robots: { index: false, follow: false },
  };
}

/**
 * Public share page (A-19). Renders a resume by its unguessable share token
 * without authentication. Each view increments the resume's view count
 * (feeds the K-02 analytics).
 */
export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  const db = createAdminClient();

  const { data } = await db
    .from("resumes")
    .select("*")
    .eq("share_token", token)
    .eq("share_enabled", true)
    .single();

  const row = data as unknown as ShareRow | null;

  if (!row) notFound();

  const resume = mapRowToResumeData({ ...row } as unknown as ResumeRow & Record<string, unknown>);

  // Best-effort view count bump (admin client — no session on public page)
  await db
    .from("resumes")
    .update({ view_count: (row.view_count || 0) + 1 } as never)
    .eq("id", row.id);

  return (
    <main className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-[210mm] mx-auto mb-4 flex items-center justify-between text-xs text-gray-500">
        <span>Shared resume — generated with AI Resume Builder</span>
        <span>
          {resume.personalInfo?.fullName || resume.title}
        </span>
      </div>
      <div className="shadow-lg rounded-lg overflow-hidden">
        <MemoTemplateRenderer resume={resume} />
      </div>
      <footer className="max-w-[210mm] mx-auto mt-4 text-center text-[11px] text-gray-400">
        Built with the AI Resume Builder — {new Date().getFullYear()}
      </footer>
    </main>
  );
}
