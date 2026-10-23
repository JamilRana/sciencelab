import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export type Role = "ADMIN" | "STAFF" | "TEACHER" | "STUDENT";

export interface AuthenticatedUser {
  id: string;
  username: string;
  role: Role;
  name?: string;
  teacherId?: number;
  studentId?: number;
}

/**
 * Retrieves the current session on the server.
 * Validates that the user still exists and is active in the database.
 */
export async function getCurrentSession() {
  let session: any = null;
  try {
    session = await getServerSession(authOptions);
  } catch {
    // When called outside Next.js request scope (e.g. CLI/tests), check test mock
    if ((globalThis as any).__TEST_SESSION_USER__) {
      return { user: (globalThis as any).__TEST_SESSION_USER__ };
    }
    return null;
  }

  if (!session?.user?.id) {
    if ((globalThis as any).__TEST_SESSION_USER__) {
      return { user: (globalThis as any).__TEST_SESSION_USER__ };
    }
    return null;
  }

  // Double-check user active status directly from DB to prevent deactivated users
  const userId = parseInt(session.user.id);
  if (isNaN(userId)) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, active: true },
  });

  if (!user || !user.active) {
    return null;
  }

  return {
    ...session,
    user: {
      ...session.user,
      role: user.role as Role,
    },
  };
}

/**
 * Server Action guard: throws an Error if not authenticated or not in allowed roles.
 */
export async function requireAuth(allowedRoles?: Role[]): Promise<AuthenticatedUser> {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    throw new Error("Unauthorized: Authentication required. Please sign in.");
  }

  const role = session.user.role as Role;

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    throw new Error(`Forbidden: Access denied for role '${role}'.`);
  }

  return session.user as AuthenticatedUser;
}

/**
 * Convenient alias for Server Actions requiring specific roles.
 */
export async function requireRole(allowedRoles: Role | Role[]): Promise<AuthenticatedUser> {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return requireAuth(roles);
}

/**
 * API Route Handler guard: returns { user } or { errorResponse: NextResponse }.
 */
export async function requireApiAuth(allowedRoles?: Role | Role[]): Promise<
  | { user: AuthenticatedUser; errorResponse?: never }
  | { user?: never; errorResponse: NextResponse }
> {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    return {
      errorResponse: NextResponse.json(
        { error: "Unauthorized: Authentication required" },
        { status: 401 }
      ),
    };
  }

  const role = session.user.role as Role;
  const roles = allowedRoles ? (Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]) : undefined;

  if (roles && roles.length > 0 && !roles.includes(role)) {
    return {
      errorResponse: NextResponse.json(
        { error: `Forbidden: Access denied for role '${role}'` },
        { status: 403 }
      ),
    };
  }

  return { user: session.user as AuthenticatedUser };
}

/**
 * Guard for automated cron job routes (e.g., daily digest, day close).
 * Validates CRON_SECRET from:
 * 1. Authorization: Bearer <CRON_SECRET> (standard Vercel Cron header)
 * 2. Header: x-cron-secret or x-job-secret
 * 3. URL query parameter: ?key=<CRON_SECRET> or ?secret=<CRON_SECRET>
 * Uses crypto.timingSafeEqual to prevent timing attacks.
 */
export function requireJobSecret(request: Request): {
  authorized: boolean;
  errorResponse?: NextResponse;
} {
  const configuredSecret = process.env.CRON_SECRET;
  if (!configuredSecret) {
    console.error("[requireJobSecret] CRON_SECRET environment variable is not configured");
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { error: "Server misconfiguration: CRON_SECRET is not configured" },
        { status: 500 }
      ),
    };
  }

  // Check Authorization header (Bearer token)
  let providedSecret = "";
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    providedSecret = authHeader.slice(7).trim();
  }

  // Check custom headers
  if (!providedSecret) {
    providedSecret =
      request.headers.get("x-cron-secret")?.trim() ||
      request.headers.get("x-job-secret")?.trim() ||
      "";
  }

  // Check URL query parameters
  if (!providedSecret) {
    try {
      const url = new URL(request.url);
      providedSecret =
        url.searchParams.get("key")?.trim() ||
        url.searchParams.get("secret")?.trim() ||
        "";
    } catch {
      // Ignore URL parsing errors
    }
  }

  if (!providedSecret) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { error: "Unauthorized: Missing job secret token" },
        { status: 401 }
      ),
    };
  }

  // Constant-time comparison to prevent timing attacks
  const configuredBuf = Buffer.from(configuredSecret, "utf8");
  const providedBuf = Buffer.from(providedSecret, "utf8");

  if (
    configuredBuf.length !== providedBuf.length ||
    !crypto.timingSafeEqual(configuredBuf, providedBuf)
  ) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { error: "Unauthorized: Invalid job secret token" },
        { status: 401 }
      ),
    };
  }

  return { authorized: true };
}
