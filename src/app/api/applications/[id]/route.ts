import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerClient } from "@/lib/db/server";
import { updateApplication, deleteApplication } from "@/services/applications/service";
import { updateApplicationSchema, validateOrError } from "@/lib/validation";
import { createNotification } from "@/services/notifications/service";
import { sendChannelEmail } from "@/services/notifications/email";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const validated = validateOrError(updateApplicationSchema, body);
  if ("error" in validated) return validated.error;

  try {
    // A-11: fetch the current row before updating so we can detect status changes
    const db = await createServerClient();
    const { data: previous } = await db
      .from("applications")
      .select("*")
      .eq("id", id)
      .eq("user_id", session.user.id)
      .single();

    await updateApplication(id, session.user.id, validated.data as Parameters<typeof updateApplication>[2]);

    // Job-alert notifications on meaningful status changes
    const newStatus = validated.data.status as "applied" | "interview" | "rejected" | "offer" | undefined;
    if (previous && newStatus && previous.status !== newStatus) {
      const isMilestone = newStatus === "interview" || newStatus === "offer";
      const company = validated.data.company || previous.company;
      const role = validated.data.role || previous.role;

      if (isMilestone) {
        await createNotification(session.user.id, {
          type: "job",
          title: newStatus === "offer" ? "You got an offer!" : "Interview scheduled",
          message: `${role} at ${company} moved to ${newStatus}.`,
          link: "/jobs",
        });

        // A-11: email when job alerts are enabled
        await sendChannelEmail(session.user.id, "job_alerts", {
          subject: newStatus === "offer" ? "You got an offer! 🎉" : "Interview update",
          body: `Your application for ${role} at ${company} moved to "${newStatus}".\n\nView your job tracker: ${process.env.NEXTAUTH_URL}/jobs`,
        });
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await deleteApplication(id, session.user.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
