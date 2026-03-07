export type UserRole = "ADMIN" | "STAFF" | "TEACHER" | "STUDENT";

export type Permission = 
  | "dashboard:view"
  | "students:read" | "students:write" | "students:delete"
  | "teachers:read" | "teachers:write" | "teachers:delete"
  | "exams:read" | "exams:write" | "exams:delete"
  | "marks:read" | "marks:write"
  | "receipts:read" | "receipts:write"
  | "expenses:read" | "expenses:write" | "expenses:delete"
  | "gallery:read" | "gallery:write" | "gallery:delete"
  | "syllabus:read" | "syllabus:write" | "syllabus:delete"
  | "users:manage";

const rolePermissions: Record<UserRole, Permission[]> = {
  ADMIN: [
    "dashboard:view",
    "students:read", "students:write", "students:delete",
    "teachers:read", "teachers:write", "teachers:delete",
    "exams:read", "exams:write", "exams:delete",
    "marks:read", "marks:write",
    "receipts:read", "receipts:write",
    "expenses:read", "expenses:write", "expenses:delete",
    "gallery:read", "gallery:write", "gallery:delete",
    "syllabus:read", "syllabus:write", "syllabus:delete",
    "users:manage",
  ],
  STAFF: [
    "dashboard:view",
    "students:read", "students:write",
    "teachers:read",
    "exams:read", "exams:write",
    "marks:read", "marks:write",
    "expenses:read",
    "gallery:read",
    "syllabus:read",
  ],
  TEACHER: [
    "dashboard:view",
    "students:read",
    "teachers:read",
    "exams:read",
    "marks:read", "marks:write",
    "gallery:read",
    "syllabus:read",
  ],
  STUDENT: [
    "dashboard:view",
    "students:read",
    "exams:read",
    "marks:read",
    "gallery:read",
    "syllabus:read",
  ],
};

export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function hasAnyRole(role: UserRole | undefined, roles: UserRole[]): boolean {
  if (!role) return false;
  return roles.includes(role);
}

export function hasAllRoles(role: UserRole | undefined, roles: UserRole[]): boolean {
  if (!role) return false;
  return roles.every((r) => role === r);
}

export const Roles = {
  ADMIN: "ADMIN" as UserRole,
  STAFF: "STAFF" as UserRole,
  TEACHER: "TEACHER" as UserRole,
  STUDENT: "STUDENT" as UserRole,
} as const;

export const routeRoles: Record<string, UserRole[]> = {
  "/admin": [Roles.ADMIN],
  "/staff": [Roles.ADMIN, Roles.STAFF],
  "/teacher": [Roles.ADMIN, Roles.STAFF, Roles.TEACHER],
  "/student": [Roles.ADMIN, Roles.STAFF, Roles.TEACHER, Roles.STUDENT],
};
