import { NextRequest, NextResponse } from "next/server";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import {
  getAllTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "@/services/templates/service";
import {
  createTemplateSchema,
  updateTemplateSchema,
  validateOrError,
} from "@/lib/validation";

export const dynamic = "force-dynamic";

async function checkAdmin(session: Session | null) {
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isAdmin(session.user.id, session.user.email))) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  return null;
}

/** GET /api/admin/templates — list all templates (including inactive) */
export async function GET() {
  const session = await getServerSession(authOptions);
  const authError = await checkAdmin(session);
  if (authError) return authError;

  try {
    const data = await getAllTemplates();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

/** POST /api/admin/templates — create a new template */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const authError = await checkAdmin(session);
  if (authError) return authError;

  const body = await request.json().catch(() => ({}));
  const validated = validateOrError(createTemplateSchema, body);
  if ("error" in validated) return validated.error;

  try {
    const data = await createTemplate(validated.data);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create template" },
      { status: 500 }
    );
  }
}

/** PUT /api/admin/templates — update a template (requires id in body) */
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const authError = await checkAdmin(session);
  if (authError) return authError;

  const body = await request.json().catch(() => ({}));
  const { id, ...updateData } = body;

  if (!id) {
    return NextResponse.json(
      { success: false, error: "Template ID is required" },
      { status: 400 }
    );
  }

  const validated = validateOrError(updateTemplateSchema, updateData);
  if ("error" in validated) return validated.error;

  try {
    await updateTemplate(id, validated.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update template" },
      { status: 500 }
    );
  }
}

/** DELETE /api/admin/templates — delete a template (requires ?id=xxx) */
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const authError = await checkAdmin(session);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { success: false, error: "Template ID is required" },
      { status: 400 }
    );
  }

  try {
    await deleteTemplate(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete template" },
      { status: 500 }
    );
  }
}
