import { withAuth } from "next-auth/middleware";

// ─── Routes accessible without authentication ────────────────────────────
const publicPaths = [
  "/",
  "/pricing",
  "/login",
  "/sign-up",
  "/signup",
  "/api/auth",        // NextAuth API routes
  "/_next/static",
  "/_next/image",
  "/favicon",
  "/images",
];

export default withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ req, token }) {
      const { pathname } = req.nextUrl;

      // Always allow static files and API auth routes
      if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/favicon") ||
        pathname.startsWith("/images")
      ) {
        return true;
      }

      // Allow public pages
      if (publicPaths.some((p) => pathname === p)) {
        return true;
      }

      // Allow public path prefixes (e.g., /pricing/anything)
      if (publicPaths.some((p) => p !== "/" && pathname.startsWith(p))) {
        return true;
      }

      // Allow Supabase auth callback
      if (pathname.startsWith("/api/auth")) {
        return true;
      }

      // All other routes require authentication
      return !!token;
    },
  },
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (public images)
     * - api/auth (NextAuth API)
     */
    "/((?!_next/static|_next/image|favicon|images|api/auth).*)",
  ],
};
