import { withAuth } from "next-auth/middleware";
import type { NextRequest } from "next/server";

// const ADMIN_ROLES = ["admin", "owner"];

// function hasAdminRole(role?: string): boolean {
//   return !!role && ADMIN_ROLES.includes(role);
// }

export default withAuth(
  function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    /*
     * The authenticated token is available through
     * request.nextauth in some NextAuth versions, but
     * TypeScript does not expose it on the standard
     * NextRequest type.
     *
     * For now, authorization is handled through the
     * authorized callback below.
     */

    /*
     * -------------------------------------------------------
     * PROTECTED API ROUTES
     * -------------------------------------------------------
     *
     * withAuth has already verified that a valid session
     * token exists before this middleware runs.
     *
     * Resource-level authorization should still be enforced
     * inside each API route.
     */
    if (
      pathname.startsWith("/api/dashboard") ||
      pathname.startsWith("/api/projects") ||
      pathname.startsWith("/api/organizations") ||
      pathname.startsWith("/api/users")
    ) {
      return;
    }

    /*
     * -------------------------------------------------------
     * ADMIN ROUTES
     * -------------------------------------------------------
     *
     * Role-based authorization will be enabled once
     * role information is added to the JWT.
     */
    if (
      pathname === "/admin" ||
      pathname.startsWith("/admin/")
    ) {
      /*
       * Role checking will be added here after the JWT
       * contains the user's role.
       */
      return;
    }

    /*
     * Dashboard routes are protected by withAuth.
     */
    return;
  },
  {
    callbacks: {
      /*
       * -----------------------------------------------------
       * AUTHENTICATION CHECK
       * -----------------------------------------------------
       *
       * No valid JWT/session token means the request is
       * unauthenticated and will be redirected to /signin.
       */
      authorized: ({ token }) => {
        return !!token;
      },
    },

    pages: {
      signIn: "/signin",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Protected dashboard pages
     */
    "/dashboard/:path*",

    /*
     * Protected admin pages
     */
    "/admin/:path*",

    /*
     * Protected application APIs
     */
    "/api/dashboard/:path*",
    "/api/projects/:path*",
    "/api/organizations/:path*",
    "/api/users/:path*",
  ],
};