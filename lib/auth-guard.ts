import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
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
