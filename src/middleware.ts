import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized({ req, token }) {
      const path = req.nextUrl.pathname;
      if (path.startsWith("/login") || path.startsWith("/sign-up")) {
        return true;
      }
      if (path.startsWith("/dashboard") || path.startsWith("/builder") || path.startsWith("/preview")) {
        return !!token;
      }
      return true;
    },
  },
});

export const config = {
  matcher: ["/dashboard/:path*", "/builder/:path*", "/preview/:path*"],
};
