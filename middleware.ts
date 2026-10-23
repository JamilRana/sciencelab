import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

function getRedirectUrl(role?: string, callbackUrl?: string | null): string {
  if (callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") && callbackUrl !== "/login") {
    if (role === "ADMIN" || role === "STAFF") {
      if (callbackUrl.startsWith("/admin-route")) return callbackUrl;
    } else if (role === "TEACHER") {
      if (callbackUrl.startsWith("/teacher-route")) return callbackUrl;
    } else if (role === "STUDENT") {
      if (callbackUrl.startsWith("/student-route")) return callbackUrl;
    }
  }

  if (role === "TEACHER") return "/teacher-route/dashboard";
  if (role === "STUDENT") return "/student-route/dashboard";
  return "/admin-route/dashboard";
}

export async function middleware(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  const token = await getToken({ req, secret });
  const path = req.nextUrl.pathname;
  const isLoggedIn = !!token && !!token.id;
  const role = (token?.role as string) || "";

  // Prevent logged-in users from accessing the login page
  if (path === "/login") {
    if (isLoggedIn) {
      const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");
      const redirectUrl = getRedirectUrl(role, callbackUrl);
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }
    return NextResponse.next();
  }

  // Redirect root path to user dashboard or login
  if (path === "/") {
    if (isLoggedIn) {
      const redirectUrl = getRedirectUrl(role);
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Protected route enforcement: if not logged in, redirect to /login with callbackUrl
  const isProtectedPath =
    path.startsWith("/admin-route") ||
    path.startsWith("/teacher-route") ||
    path.startsWith("/student-route");

  if (isProtectedPath && !isLoggedIn) {
    const signInUrl = new URL("/login", req.url);
    signInUrl.searchParams.set("callbackUrl", path + req.nextUrl.search);
    return NextResponse.redirect(signInUrl);
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
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api/auth (NextAuth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, icons, etc.)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|PNG|JPG)$).*)",
  ],
};
