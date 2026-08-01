import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getResume, updateResume, deleteResume, updateSections } from "@/services/resume/service";
import { updateResumeSchema, validateOrError } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resume = await getResume(id, session.user.id);
    return NextResponse.json({ success: true, data: resume });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 404 }
    );
  }
}

/** Shared update handler used by PUT (builder autosave / manual save) and PATCH (LinkedIn import). */
async function handleUpdate(request: Request, id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const validated = validateOrError(updateResumeSchema, body);
  if ("error" in validated) return validated.error;

  try {
    if (validated.data.sectionType) {
      await updateSections(id, session.user.id, validated.data.sectionType, validated.data.data);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { sectionType, data, sections, personalInfo, ...rest } = validated.data;
      await updateResume(id, session.user.id, { ...rest, personalInfo: personalInfo as Parameters<typeof updateResume>[2]["personalInfo"] });
      if (sections) {
        const failedSections: string[] = [];
        for (const [sectionKey, sectionData] of Object.entries(sections)) {
          // null/undefined means "no change" — skipping avoids wiping a section's rows.
          if (sectionData == null) continue;
          try {
            await updateSections(id, session.user.id, sectionKey, sectionData);
          } catch (err) {
            // Don't let one bad section discard the other 12 — log and continue.
            console.error(`Failed to persist resume section "${sectionKey}" (${id})`, err);
            failedSections.push(sectionKey);
          }
        }
        if (failedSections.length > 0) {
          return NextResponse.json({
            success: true,
            warning: `Some sections could not be saved: ${failedSections.join(", ")}`,
          });
        }
      }
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleUpdate(request, id);
}

// LinkedIn import posts section payloads with PATCH; without this the import
// would 405 and the imported sections would never persist.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleUpdate(request, id);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await deleteResume(id, session.user.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
