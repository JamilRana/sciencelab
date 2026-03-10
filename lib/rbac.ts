import { Role } from "@prisma/client";

export type UserRole = Role | "ADMIN" | "STAFF" | "TEACHER" | "STUDENT";

const permissions: Record<UserRole, string[]> = {
  ADMIN: ["marks:read", "marks:write", "marks:delete"],
  STAFF: ["marks:read", "marks:write"],
  TEACHER: ["marks:read", "marks:write"],
  STUDENT: ["marks:read"],
};

export function hasPermission(role: UserRole | undefined | null, permission: string): boolean {
  if (!role) return false;
  return permissions[role]?.includes(permission) ?? false;
}
