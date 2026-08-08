import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import LinkedInProvider from "next-auth/providers/linkedin";
import CredentialsProvider from "next-auth/providers/credentials";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

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
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      authorization: {
        params: { scope: "openid profile email" },
      },
      issuer: "https://www.linkedin.com",
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

        const supabase = await createServerSupabaseClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (error || !data.user) return null;

        // Reject deactivated accounts (admin R-11 toggle).
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_active")
          .eq("id", data.user.id)
          .single();

        if (profile?.is_active === false) return null;

        return {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.full_name || data.user.email,
          image: data.user.user_metadata?.avatar_url || null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user && account?.provider === "credentials") {
        token.id = user.id;
        // Fetch role for credentials sign-in
        const { createClient } = await import("@supabase/supabase-js");
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profile?.role) {
          token.role = profile.role;
        }
      }

      const isValidUUID = typeof token.id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token.id);

      if ((account?.provider && account.provider !== "credentials") || (token.id && !isValidUUID)) {
        if (token.email) {
          const { createClient } = await import("@supabase/supabase-js");
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
          const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
          const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false },
          });

          let { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("email", token.email)
            .single();

          if (!profile) {
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
              email: token.email,
              email_confirm: true,
              user_metadata: {
                full_name: token.name || token.email,
                avatar_url: token.picture || "",
              },
            });

            if (authData?.user) {
              profile = { id: authData.user.id };
              token.isNewUser = true;
            } else if (authError?.message?.includes("already been registered") || authError?.message?.includes("already registered")) {
              const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
              const authUser = listData?.users?.find(u => u.email === token.email);

              if (authUser) {
                profile = { id: authUser.id };

                // Re-create the missing profile
                await supabaseAdmin.from("profiles").upsert({
                  id: authUser.id,
                  email: token.email,
                  full_name: token.name || token.email,
                  avatar_url: token.picture || "",
                });
              }
            }
          }

          if (profile) {
            token.id = profile.id;
            // Fetch role for admin checks
            const { data: profileWithRole } = await supabaseAdmin
              .from("profiles")
              .select("role")
              .eq("id", profile.id)
              .single();
            if (profileWithRole?.role) {
              token.role = profileWithRole.role;
            }
          }
        }
      }

      if (user && !token.id) {
        token.id = user.id;
      }

      // Track last activity (fire-and-forget) for admin active-users analytics (R-20).
      if (token.id) {
        try {
          const supabase = await createServerSupabaseClient();
          await supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", token.id);
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
