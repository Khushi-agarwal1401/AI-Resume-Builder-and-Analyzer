import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerClient } from "@/lib/db/server";
import type { Database } from "@/lib/db/types";
import { signUpSchema, updateProfileSchema, validateOrError } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { hashPassword, verifyPassword } from "@/lib/password";
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
    const db = await createServerClient();

    const { data: existing } = await db
      .from("profiles")
      .select("id")
      .eq("email", validated.data.email)
      .maybeSingle();

    if (existing) {
      return fail("An account with this email already exists.", 400);
    }

    const passwordHash = await hashPassword(validated.data.password);
    const now = new Date().toISOString();

    const { data: user, error } = await db
      .from("profiles")
      .insert({
        email: validated.data.email,
        full_name: validated.data.fullName,
        password_hash: passwordHash,
        role: "user",
        is_active: true,
        created_at: now,
        updated_at: now,
      })
      .select("id, email, full_name, avatar_url")
      .single();

    if (error) {
      // Unique email violation (race between the check and the insert).
      if (error.code === "23505") {
        return fail("An account with this email already exists.", 400);
      }
      await logError(error, "signup");
      return fail("Unable to create your account. Please try again.", 400);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          user,
          // No email confirmation step — accounts are active immediately.
          requiresEmailConfirmation: false,
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
    const db = await createServerClient();
    const profileFields: Database["public"]["Tables"]["profiles"]["Update"] = {};

    // ── Email change: update the user's email directly ──
    if (validated.data.email) {
      const { data: other } = await db
        .from("profiles")
        .select("id")
        .eq("email", validated.data.email)
        .neq("id", session.user.id)
        .maybeSingle();
      if (other) {
        return NextResponse.json(
          { success: false, error: "An account with this email already exists." },
          { status: 400 }
        );
      }
      profileFields.email = validated.data.email;
    }

    // ── Password change: verify the current password, then hash the new one ──
    if (validated.data.newPassword) {
      if (!validated.data.currentPassword) {
        return NextResponse.json(
          { success: false, error: "Current password is required." },
          { status: 400 }
        );
      }
      const { data: profile } = await db
        .from("profiles")
        .select("password_hash")
        .eq("id", session.user.id)
        .maybeSingle();
      const valid = await verifyPassword(validated.data.currentPassword, profile?.password_hash as string | null);
      if (!valid) {
        return NextResponse.json(
          { success: false, error: "Current password is incorrect." },
          { status: 400 }
        );
      }
      profileFields.password_hash = await hashPassword(validated.data.newPassword);
    }

    // ── Update profile fields ──
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
      const { error } = await db
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
