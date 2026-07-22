import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { success: false, error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: { user: data.user } }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const supabase = await createServerSupabaseClient();

    // ── Handle password change separately via Supabase Auth ──
    if (body.newPassword) {
      const { error: authError } = await supabase.auth.updateUser({
        password: body.newPassword,
      });
      if (authError) {
        return NextResponse.json(
          { success: false, error: authError.message },
          { status: 400 }
        );
      }
      // Don't accidentally write password fields into the profiles table
      delete body.currentPassword;
      delete body.newPassword;
      delete body.confirmPassword;

      // If there's nothing left to update, return success now
      if (Object.keys(body).length === 0) {
        return NextResponse.json({ success: true });
      }
    }

    // ── Update profile fields ──
    const profileFields: Record<string, unknown> = { ...body };
    // Remove any auth-only keys just in case
    delete profileFields.currentPassword;
    delete profileFields.newPassword;
    delete profileFields.confirmPassword;

    if (Object.keys(profileFields).length > 0) {
      const { error } = await supabase
        .from("profiles")
        .update(profileFields)
        .eq("id", session.user.id);

      if (error) throw new Error(error.message);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Update failed" },
      { status: 500 }
    );
  }
}
