import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const isLoggedIn = !!token;
    const role = (token?.role as string) || "";

    // Prevent logged-in users from accessing the login page
    if (path === "/login" && isLoggedIn) {
      let redirectUrl = "/admin-route/dashboard";
      if (role === "STAFF" || role === "ADMIN") redirectUrl = "/admin-route/dashboard";
      else if (role === "TEACHER") redirectUrl = "/teacher-route/dashboard";
      else if (role === "STUDENT") redirectUrl = "/student-route/dashboard";

      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }

    // Role-based route enforcement
    if (path.startsWith("/admin-route") && role !== "ADMIN" && role !== "STAFF") {
      const fallback = role === "TEACHER" ? "/teacher-route/dashboard" : "/student-route/dashboard";
      return NextResponse.redirect(new URL(fallback, req.url));
    }

    // Financial routes and user management are strictly ADMIN only (STAFF has no financial access)
    const adminOnlyRoutes = [
      "/admin-route/accounts",
      "/admin-route/fees",
      "/admin-route/receipts",
      "/admin-route/expenses",
      "/admin-route/payments",
      "/admin-route/users",
    ];
    if (adminOnlyRoutes.some((route) => path.startsWith(route)) && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/admin-route/dashboard", req.url));
    }

    if (path.startsWith("/teacher-route") && role !== "TEACHER" && role !== "ADMIN" && role !== "STAFF") {
      return NextResponse.redirect(new URL("/student-route/dashboard", req.url));
    }

    if (path.startsWith("/student-route") && role !== "STUDENT" && role !== "ADMIN" && role !== "STAFF") {
      return NextResponse.redirect(new URL("/admin-route/dashboard", req.url));
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
     * Match all request paths except for:
     * - api/auth (NextAuth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
