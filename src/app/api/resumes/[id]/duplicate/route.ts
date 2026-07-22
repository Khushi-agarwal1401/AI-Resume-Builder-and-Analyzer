import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getResume, createResume, updateSections } from "@/services/resume/service";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const original = await getResume(id, session.user.id);
    
    // Create new resume with basic info
    const duplicated = await createResume(session.user.id, {
      title: `${original.title} (Copy)`,
      template: original.template,
      personalInfo: original.personalInfo,
      summary: original.summary,
    });

    // Copy sections
    const copyPromises = [];
    if (original.education?.length) copyPromises.push(updateSections(duplicated.id, session.user.id, "education", original.education.map(item => ({ ...item, id: undefined, resume_id: undefined }))));
    if (original.experience?.length) copyPromises.push(updateSections(duplicated.id, session.user.id, "experience", original.experience.map(item => ({ ...item, id: undefined, resume_id: undefined }))));
    if (original.projects?.length) copyPromises.push(updateSections(duplicated.id, session.user.id, "projects", original.projects.map(item => ({ ...item, id: undefined, resume_id: undefined }))));
    if (original.certifications?.length) copyPromises.push(updateSections(duplicated.id, session.user.id, "certifications", original.certifications.map(item => ({ ...item, id: undefined, resume_id: undefined }))));
    if (original.achievements?.length) copyPromises.push(updateSections(duplicated.id, session.user.id, "achievements", original.achievements.map(item => ({ ...item, id: undefined, resume_id: undefined }))));
    if (original.languages?.length) copyPromises.push(updateSections(duplicated.id, session.user.id, "languages", original.languages.map(item => ({ ...item, id: undefined, resume_id: undefined }))));
    if (original.skills) copyPromises.push(updateSections(duplicated.id, session.user.id, "skills", { ...original.skills, id: undefined, resume_id: undefined }));

    await Promise.all(copyPromises);

    return NextResponse.json({ success: true, data: duplicated }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to duplicate resume" },
      { status: 500 }
    );
  }
}
