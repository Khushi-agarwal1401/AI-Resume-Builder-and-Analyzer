import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { analyzeResumeFile, analyzeResumeText } from "@/services/resume-analyzer";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const resumeId = formData.get("resumeId") as string | null;

      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const report = await analyzeResumeFile(buffer, file.name);
        return NextResponse.json({ success: true, data: report, resumeId });
      }

      const jdText = formData.get("text") as string | null;
      if (jdText) {
        const report = await analyzeResumeText(jdText);
        return NextResponse.json({ success: true, data: report, resumeId });
      }

      return NextResponse.json({ success: false, error: "No file or text provided" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { text, resumeId } = body;

    if (!text || typeof text !== "string" || text.trim().length < 10) {
      return NextResponse.json({ success: false, error: "Resume text must be at least 10 characters" }, { status: 400 });
    }

    const report = await analyzeResumeText(text.trim());
    return NextResponse.json({ success: true, data: report, resumeId });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
