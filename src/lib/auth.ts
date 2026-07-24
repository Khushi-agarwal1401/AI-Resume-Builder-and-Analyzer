import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import LinkedInProvider from "next-auth/providers/linkedin";
import CredentialsProvider from "next-auth/providers/credentials";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

        const supabase = await createServerSupabaseClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (error || !data.user) return null;

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
      console.log("[JWT Callback] Starting. token.id:", token.id, "email:", token.email);
      if (user && account?.provider === "credentials") {
        token.id = user.id;
      }

      const isValidUUID = typeof token.id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token.id);
      console.log("[JWT Callback] isValidUUID:", isValidUUID);

      if ((account?.provider && account.provider !== "credentials") || (token.id && !isValidUUID)) {
        console.log("[JWT Callback] Needs Supabase UUID mapping.");
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
          
          console.log("[JWT Callback] Found profile:", profile);

          if (!profile) {
            console.log("[JWT Callback] Profile not found, creating user in auth.users...");
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
              email: token.email,
              email_confirm: true,
              user_metadata: {
                full_name: token.name || token.email,
                avatar_url: token.picture || "",
              },
            });
            console.log("[JWT Callback] createUser result:", authData, "error:", authError);
            
            if (authData?.user) {
              profile = { id: authData.user.id };
              token.isNewUser = true;
            } else if (authError?.message?.includes("already been registered") || authError?.message?.includes("already registered")) {
              console.log("[JWT Callback] User already registered. Looking up via listUsers...");
              const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
              const authUser = listData?.users?.find(u => u.email === token.email);
              
              if (authUser) {
                console.log("[JWT Callback] Found existing auth.users ID:", authUser.id);
                profile = { id: authUser.id };
                
                // Re-create the missing profile
                await supabaseAdmin.from("profiles").upsert({
                  id: authUser.id,
                  email: token.email,
                  full_name: token.name || token.email,
                  avatar_url: token.picture || "",
                });
                console.log("[JWT Callback] Re-created missing profile.");
              }
            }
          }

          if (profile) {
            console.log("[JWT Callback] Overriding token.id with profile.id:", profile.id);
            token.id = profile.id;
          }
        }
      }

      if (user && !token.id) {
        token.id = user.id;
      }

      console.log("[JWT Callback] Returning token.id:", token.id);
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
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
  },
  secret: process.env.NEXTAUTH_SECRET,
};
