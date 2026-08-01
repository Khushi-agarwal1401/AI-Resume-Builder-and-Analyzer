import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/encryption";
import { GITHUB_OAUTH_STATE_COOKIE } from "@/lib/github-oauth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // CSRF protection: bind a random state to the browser, verify on callback
  const state = randomBytes(16).toString("hex");
  const redirectUrl = new URL("https://github.com/login/oauth/authorize");
  redirectUrl.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID || "");
  redirectUrl.searchParams.set("scope", "read:user,public_repo");
  redirectUrl.searchParams.set("redirect_uri", `${process.env.NEXTAUTH_URL}/api/github/callback`);
  redirectUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set(GITHUB_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return response;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { code } = await request.json();
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
      return NextResponse.json({ success: false, error: "Failed to get access token" }, { status: 400 });
    }

    const reposRes = await fetch("https://api.github.com/user/repos?sort=updated&per_page=50", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const repos = await reposRes.json();

    const repoList = (Array.isArray(repos) ? repos : []).map((r: Record<string, unknown>) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      url: r.html_url,
      stars: r.stargazers_count,
      forks: r.forks_count,
      language: r.language,
      updatedAt: r.updated_at,
    }));

    // Encrypt the token before storing
    const encryptedToken = encrypt(tokenData.access_token);

    const supabase = await createServerSupabaseClient();
    await supabase.from("profiles").update({
      github_connected: true,
      github_token: encryptedToken,
    }).eq("id", session.user.id);

    return NextResponse.json({ success: true, data: repoList });
  } catch {
    return NextResponse.json({ success: false, error: "GitHub connect failed" }, { status: 500 });
  }
}
