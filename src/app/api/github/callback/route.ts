import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/encryption";

export const dynamic = "force-dynamic";

/** GET /api/github/callback — handle OAuth redirect from GitHub */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(
      new URL("/login?error=unauthorized", request.url)
    );
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error === "access_denied") {
    return NextResponse.redirect(
      new URL("/integrations/github?error=access_denied", request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/integrations/github?error=no_code", request.url)
    );
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return NextResponse.redirect(
        new URL("/integrations/github?error=token_exchange_failed", request.url)
      );
    }

    // Encrypt the token before storing
    const encryptedToken = encrypt(tokenData.access_token);

    // Save to profile
    const supabase = await createServerSupabaseClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        github_connected: true,
        github_token: encryptedToken,
      })
      .eq("id", session.user.id);

    if (updateError) {
      return NextResponse.redirect(
        new URL("/integrations/github?error=save_failed", request.url)
      );
    }

    // Redirect back to integration page with success
    return NextResponse.redirect(
      new URL("/integrations/github?connected=true", request.url)
    );
  } catch {
    return NextResponse.redirect(
      new URL("/integrations/github?error=callback_failed", request.url)
    );
  }
}
