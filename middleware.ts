import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const isLoggedIn = !!token;

    // Prevent logged-in users from accessing the login page
    if (path === "/login" && isLoggedIn) {
      const role = token.role as string;
      let redirectUrl = "/admin-route/dashboard";
      if (role === "STAFF") redirectUrl = "/staff-route/dashboard";
      else if (role === "TEACHER") redirectUrl = "/teacher-route/dashboard";
      else if (role === "STUDENT") redirectUrl = "/student-route/dashboard";
      
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        if (path === "/login") return true; // Always allow access to login page
        return !!token; // Otherwise requires token
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
