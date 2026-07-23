import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized({ req, token }) {
      const path = req.nextUrl.pathname;
      if (path.startsWith("/login") || path.startsWith("/sign-up")) {
        return true;
      }
      if (path.startsWith("/pricing") || path.startsWith("/templates")) {
        return true;
      }
      if (
        path.startsWith("/dashboard") ||
        path.startsWith("/builder") ||
        path.startsWith("/preview") ||
        path.startsWith("/tools") ||
        path.startsWith("/integrations") ||
        path.startsWith("/resume") ||
        path.startsWith("/settings") ||
        path.startsWith("/jobs") ||
        path.startsWith("/updates") ||
        path.startsWith("/analytics")
      ) {
        return !!token;
      }
      return true;
    },
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/builder/:path*",
    "/preview/:path*",
    "/tools/:path*",
    "/integrations/:path*",
    "/resume/:path*",
    "/settings/:path*",
    "/jobs/:path*",
    "/updates/:path*",
    "/analytics/:path*",
  ],
};
// TODO: Sync NextAuth JWT expiry with Supabase session refresh to prevent auth desync (see Issue #13)
