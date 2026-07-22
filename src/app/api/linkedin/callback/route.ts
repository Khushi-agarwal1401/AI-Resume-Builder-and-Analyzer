import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(
      new URL("/login?error=unauthorized&redirect=/integrations/linkedin", request.url)
    );
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/integrations/linkedin?error=${error || "no_code"}`, request.url)
    );
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/integrations/linkedin?error=not_configured", request.url)
    );
  }

  const redirectUri = `${process.env.NEXTAUTH_URL}/api/linkedin/callback`;

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return NextResponse.redirect(
        new URL("/integrations/linkedin?error=token_exchange_failed", request.url)
      );
    }

    // Fetch LinkedIn profile
    const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!profileRes.ok) {
      return NextResponse.redirect(
        new URL("/integrations/linkedin?error=profile_fetch_failed", request.url)
      );
    }

    const profile = await profileRes.json();

    // Store in database
    const supabase = await createServerSupabaseClient();
    await supabase.from("profiles").update({
      linkedin_connected: true,
      full_name: profile.name || undefined,
      avatar_url: profile.picture || undefined,
    }).eq("id", session.user.id);

    return NextResponse.redirect(
      new URL("/integrations/linkedin?connected=true", request.url)
    );
  } catch {
    return NextResponse.redirect(
      new URL("/integrations/linkedin?error=callback_failed", request.url)
    );
  }
}
