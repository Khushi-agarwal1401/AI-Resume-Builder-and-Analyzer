import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { createServerClient } from "@/lib/db/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyPassword } from "@/lib/password";

/**
 * NextAuth configuration.
 *
 * Auth is fully self-hosted: Google/GitHub OAuth through NextAuth, and
 * email+password credentials verified against the `profiles` table (the
 * app's own user store — no external auth provider). The profiles table is
 * keyed by our own UUIDs; the JWT carries `id` (profile id) + `role`.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Rate limit: 5 login attempts per minute per email
        const allowed = await checkRateLimit(`login:${credentials.email}`, 5, 60000);
        if (!allowed) {
          return null;
        }

        const db = await createServerClient();
        const { data: profile, error } = await db
          .from("profiles")
          .select("id, email, full_name, avatar_url, password_hash, role, is_active")
          .eq("email", credentials.email)
          .maybeSingle();

        if (error || !profile) return null;

        // Reject deactivated accounts (admin R-11 toggle).
        if (profile.is_active === false) return null;

        const valid = await verifyPassword(credentials.password, profile.password_hash as string | null);
        if (!valid) return null;

        return {
          id: profile.id,
          email: profile.email as string,
          name: profile.full_name || (profile.email as string),
          image: profile.avatar_url || null,
          role: profile.role as string | undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Credentials sign-in: token.id is already our profile UUID.
      if (user && account?.provider === "credentials") {
        token.id = user.id;
        token.role = user.role;
      }

      const db = await createServerClient();
      const email = token.email || user?.email;

      // OAuth sign-in (google/github): ensure a profile exists.
      if (user && account?.provider && account.provider !== "credentials") {
        if (email) {
          let { data: profile } = await db
            .from("profiles")
            .select("id, role, is_active")
            .eq("email", email)
            .maybeSingle();

          if (!profile) {
            const { data: created } = await db
              .from("profiles")
              .insert({
                email,
                full_name: user.name || email,
                avatar_url: user.image || "",
                role: "user",
              })
              .select("id, role, is_active")
              .single();
            profile = created || null;
            token.isNewUser = true;
          }

          if (profile) {
            token.id = profile.id;
            token.role = profile.role as string | undefined;
          }
        }
      }

      // If we still lack an id (edge case), fall back to the user's id.
      if (user && !token.id) {
        token.id = user.id;
      }

      // Self-heal stale sessions: if token.id does not reference an existing
      // profile (e.g. cookie signed against a previous database, or an OAuth
      // sign-in whose profile insert failed silently), re-key the session by
      // email — otherwise child rows (resumes, etc.) fail with an FK violation.
      if (token.id) {
        try {
          const { data: existing } = await db
            .from("profiles")
            .select("id, role")
            .eq("id", token.id)
            .maybeSingle();

          if (!existing && email) {
            let { data: byEmail } = await db
              .from("profiles")
              .select("id, role")
              .eq("email", email)
              .maybeSingle();

            if (!byEmail) {
              const { data: created } = await db
                .from("profiles")
                .insert({
                  email,
                  full_name: user?.name || email,
                  avatar_url: user?.image || "",
                  role: "user",
                })
                .select("id, role")
                .single();
              byEmail = created || null;
              token.isNewUser = true;
            }

            if (byEmail) {
              token.id = byEmail.id;
              token.role = byEmail.role as string | undefined;
            }
          }
        } catch {
          // best-effort; never break the auth flow
        }
      }

      // Track last activity (fire-and-forget) for admin active-users analytics (R-20).
      if (token.id) {
        try {
          await db
            .from("profiles")
            .update({ last_seen_at: new Date().toISOString() })
            .eq("id", token.id);
        } catch {
          // best-effort; never break the auth flow
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string | undefined;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    // Session expiry (30 days) with refresh every 7 days (rolling).
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 7 * 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.callback-url" : "next-auth.callback-url",
      options: {
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.csrf-token" : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
