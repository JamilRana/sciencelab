import { Role } from "@prisma/client";

export type Permission = 
  | "dashboard:view"
  | "dashboard:view_full"
  | "users:view"
  | "users:create"
  | "users:edit"
  | "users:delete"
  | "schools:view"
  | "schools:create"
  | "schools:edit"
  | "schools:delete"
  | "batches:view"
  | "batches:create"
  | "batches:edit"
  | "batches:delete"
  | "students:view"
  | "students:create"
  | "students:edit"
  | "students:delete"
  | "teachers:view"
  | "teachers:create"
  | "teachers:edit"
  | "teachers:delete"
  | "fees:view"
  | "fees:create"
  | "fees:edit"
  | "fees:delete"
  | "receipts:view"
  | "receipts:create"
  | "receipts:edit"
  | "receipts:delete"
  | "exams:view"
  | "exams:create"
  | "exams:edit"
  | "exams:delete"
  | "marks:view"
  | "marks:create"
  | "marks:edit"
  | "marks:delete"
  | "results:view"
  | "results:view_full"
  | "expenses:view"
  | "expenses:create"
  | "expenses:edit"
  | "expenses:delete"
  | "payments:view"
  | "payments:create"
  | "payments:edit"
  | "payments:delete"
  | "settings:view"
  | "settings:edit"
  | "profile:view"
  | "profile:edit";

const rolePermissions: Record<Role, Permission[]> = {
  ADMIN: [
    "dashboard:view",
    "dashboard:view_full",
    "users:view",
    "users:create",
    "users:edit",
    "users:delete",
    "schools:view",
    "schools:create",
    "schools:edit",
    "schools:delete",
    "batches:view",
    "batches:create",
    "batches:edit",
    "batches:delete",
    "students:view",
    "students:create",
    "students:edit",
    "students:delete",
    "teachers:view",
    "teachers:create",
    "teachers:edit",
    "teachers:delete",
    "fees:view",
    "fees:create",
    "fees:edit",
    "fees:delete",
    "receipts:view",
    "receipts:create",
    "receipts:edit",
    "receipts:delete",
    "exams:view",
    "exams:create",
    "exams:edit",
    "exams:delete",
    "marks:view",
    "marks:create",
    "marks:edit",
    "marks:delete",
    "results:view",
    "results:view_full",
    "expenses:view",
    "expenses:create",
    "expenses:edit",
    "expenses:delete",
    "payments:view",
    "payments:create",
    "payments:edit",
    "payments:delete",
    "settings:view",
    "settings:edit",
    "profile:view",
    "profile:edit",
  ],
  STAFF: [
    "dashboard:view",
    "schools:view",
    "schools:create",
    "schools:edit",
    "schools:delete",
    "batches:view",
    "batches:create",
    "batches:edit",
    "batches:delete",
    "students:view",
    "students:create",
    "students:edit",
    "students:delete",
    "teachers:view",
    "teachers:create",
    "teachers:edit",
    "exams:view",
    "exams:create",
    "exams:edit",
    "exams:delete",
    "marks:view",
    "marks:create",
    "marks:edit",
    "marks:delete",
    "results:view",
    "profile:view",
    "profile:edit",
  ],
  TEACHER: [
    "dashboard:view",
    "exams:view",
    "marks:view",
    "marks:create",
    "marks:edit",
    "results:view",
    "profile:view",
    "profile:edit",
  ],
  STUDENT: [
    "dashboard:view",
    "results:view",
    "profile:view",
    "profile:edit",
  ],
};

export function hasPermission(role: Role | string, permission: Permission): boolean {
  const permissions = rolePermissions[role as Role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

export function getPermissions(role: Role | string): Permission[] {
  return rolePermissions[role as Role] || [];
}

export function canAccess(role: Role | string, module: string, action: "view" | "create" | "edit" | "delete"): boolean {
  return hasPermission(role, `${module}:${action}` as Permission);
}

export interface NavItem {
  label: string;
  href: string;
  permission?: Permission;
  icon?: string;
}

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin-route/dashboard", permission: "dashboard:view" },
  { label: "Users", href: "/admin-route/users", permission: "users:view" },
  { label: "Schools", href: "/admin-route/schools", permission: "schools:view" },
  { label: "Students", href: "/admin-route/students", permission: "students:view" },
  { label: "Teachers", href: "/admin-route/teachers", permission: "teachers:view" },
  { label: "Batches", href: "/admin-route/batches", permission: "batches:view" },
  { label: "Exams", href: "/admin-route/exams", permission: "exams:view" },
  { label: "Fees", href: "/admin-route/fees", permission: "fees:view" },
  { label: "Receipts", href: "/admin-route/receipts", permission: "receipts:view" },
  { label: "Expenses", href: "/admin-route/expenses", permission: "expenses:view" },
  { label: "Payments", href: "/admin-route/payments", permission: "payments:view" },
  { label: "Profile", href: "/admin-route/profile", permission: "profile:view" },
];

export function getNavItemsForRole(role: Role | string): NavItem[] {
  return navItems.filter(item => {
    if (!item.permission) return true;
    return hasPermission(role, item.permission);
  });
}
