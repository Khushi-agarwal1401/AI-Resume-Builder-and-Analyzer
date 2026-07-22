import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { success: false, error: "LinkedIn OAuth is not configured. Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET env vars." },
      { status: 400 }
    );
  }

  const redirectUri = `${process.env.NEXTAUTH_URL}/api/linkedin/callback`;
  const scope = "openid%20profile%20email";

  return NextResponse.redirect(
    `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`
  );
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ success: false, error: "Missing authorization code" }, { status: 400 });
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, error: "LinkedIn OAuth is not configured" },
        { status: 400 }
      );
    }

    const redirectUri = `${process.env.NEXTAUTH_URL}/api/linkedin/callback`;

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
      return NextResponse.json(
        { success: false, error: tokenData.error_description || "Failed to get access token" },
        { status: 400 }
      );
    }

    // Fetch LinkedIn profile info
    const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!profileRes.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch LinkedIn profile" },
        { status: 400 }
      );
    }

    const profile = await profileRes.json();

    // Store connection in database
    const supabase = createServerSupabaseClient();
    await supabase.from("profiles").update({
      linkedin_connected: true,
      full_name: profile.name || undefined,
      avatar_url: profile.picture || undefined,
    }).eq("id", session.user.id);

    return NextResponse.json({
      success: true,
      data: {
        name: profile.name,
        email: profile.email,
        picture: profile.picture,
        sub: profile.sub,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "LinkedIn connect failed" }, { status: 500 });
  }
}
