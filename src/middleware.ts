import { withAuth } from "next-auth/middleware";
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export default withAuth(
  async function middleware(request: NextRequest) {
    return await updateSession(request);
  },
  {
    callbacks: {
      authorized({ req, token }) {
        const path = req.nextUrl.pathname;
        if (path.startsWith("/login") || path.startsWith("/sign-up")) {
          return true;
        }
        if (path.startsWith("/pricing") || path.startsWith("/templates")) {
          return true;
        }
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

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
    "/templates/:path*",
    "/login/:path*",
    "/sign-up/:path*",
  ],
};
