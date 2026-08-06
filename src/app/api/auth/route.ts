import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { signUpSchema, updateProfileSchema, validateOrError } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { fail, logError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Rate limit signup: 5 requests per minute per IP
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const allowed = await checkRateLimit(`signup:${ip}`, 5, 60000);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Too many sign-up attempts. Please try again later." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const validated = validateOrError(signUpSchema, body);
  if ("error" in validated) return validated.error;

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email: validated.data.email,
      password: validated.data.password,
      options: { data: { full_name: validated.data.fullName } },
    });

    if (error) {
      // Supabase auth errors are user-facing (e.g. "User already registered")
      // but may embed provider internals — surface a safe, stable message.
      const msg = error.message.toLowerCase();
      const safe =
        msg.includes("already registered") || msg.includes("registered")
          ? "An account with this email already exists."
          : msg.includes("password")
            ? "Password does not meet the requirements."
            : msg.includes("invalid")
              ? "The email or password is invalid."
              : "Unable to create your account. Please try again.";
      await logError(error, "signup");
      return fail(safe, 400);
    }

    // Email confirmation state: signUp returns a session only when the project
    // has email confirmation disabled. Client uses this to decide between
    // auto-login and "check your email".
    const requiresEmailConfirmation = !data.session && !!data.user?.identities?.length;

    return NextResponse.json(
      {
        success: true,
        data: {
          user: data.user,
          requiresEmailConfirmation,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    await logError(error, "signup");
    return fail("Unable to create your account. Please try again.", 400);
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const validated = validateOrError(updateProfileSchema, body);
  if ("error" in validated) return validated.error;

  // Rate limit password changes: 3 attempts per hour per user
  if (validated.data.newPassword) {
    const allowed = await checkRateLimit(`password-change:${session.user.id}`, 3, 3600000);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "Too many password change attempts. Please try again later." },
        { status: 429 }
      );
    }
  }

  // Rate limit email changes: 3 attempts per hour per user
  if (validated.data.email) {
    const allowed = await checkRateLimit(`email-change:${session.user.id}`, 3, 3600000);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "Too many email change attempts. Please try again later." },
        { status: 429 }
      );
    }
  }

  try {
    const supabase = await createServerSupabaseClient();

    // ── Handle email change via Supabase Auth ──
    // Sends a confirmation to the new address + notification to the old one.
    // The email only changes after the user confirms the new address.
    if (validated.data.email) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: validated.data.email,
      });
      if (emailError) {
        return NextResponse.json(
          { success: false, error: emailError.message },
          { status: 400 }
        );
      }
    }

    // ── Handle password change separately via Supabase Auth ──
    if (validated.data.newPassword) {
      const { error: authError } = await supabase.auth.updateUser({
        password: validated.data.newPassword,
      });
      if (authError) {
        return NextResponse.json(
          { success: false, error: authError.message },
          { status: 400 }
        );
      }
    }

    // ── Update profile fields ──
    const profileFields: Database["public"]["Tables"]["profiles"]["Update"] = {};
    const allowedFields: (keyof typeof validated.data)[] = [
      "fullName", "userType", "current_position", "experience_years",
      "industry", "current_company", "college_name", "degree",
      "graduation_year", "skills", "desired_role", "desired_company",
      "desired_industry", "salary_range", "work_type",
    ];
    for (const field of allowedFields) {
      if (validated.data[field] !== undefined) {
        // Map camelCase from Zod to snake_case DB column
        const dbField = field === "fullName" ? "full_name" : field;
        (profileFields as Record<string, unknown>)[dbField] = validated.data[field];
      }
    }

    if (Object.keys(profileFields).length > 0) {
      profileFields.updated_at = new Date().toISOString();
      const { error } = await supabase
        .from("profiles")
        .update(profileFields)
        .eq("id", session.user.id);

      if (error) throw new Error(error.message);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    await logError(e, "profile update");
    return fail("Unable to update your profile. Please try again.", 500);
  }
}
