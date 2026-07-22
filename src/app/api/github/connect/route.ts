import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.redirect(
    `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=read:user,public_repo&redirect_uri=${process.env.NEXTAUTH_URL}/api/github/callback`
  );
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

    const supabase = await createServerSupabaseClient();
    await supabase.from("profiles").update({
      github_connected: true,
      github_token: tokenData.access_token,
    }).eq("id", session.user.id);

    return NextResponse.json({ success: true, data: repoList });
  } catch {
    return NextResponse.json({ success: false, error: "GitHub connect failed" }, { status: 500 });
  }
}
