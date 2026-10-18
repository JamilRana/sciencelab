import { Role } from "@prisma/client";
import { Permission, hasPermission } from "./permissions";

export interface NavItem {
  label: string;
  href: string;
  iconName: string;
  badge?: string | number;
  permission?: Permission;
}

export interface NavGroup {
  title?: string;
  items: NavItem[];
}

export interface QuickAction {
  label: string;
  href?: string;
  actionId?: string;
  iconName: string;
  description?: string;
}

export function getNavigationForRole(role: Role | string): NavGroup[] {
  const normalizedRole = role as Role;

  if (normalizedRole === "ADMIN") {
    return [
      {
        items: [
          { label: "Dashboard", href: "/admin-route/dashboard", iconName: "LayoutDashboard" },
        ],
      },
      {
        title: "Academics",
        items: [
          { label: "Exams", href: "/admin-route/exams", iconName: "CalendarDays" },
          { label: "Attendance Sheet", href: "/admin-route/exams/attendance", iconName: "BookOpenCheck" },
          { label: "Marks Entry", href: "/admin-route/marks", iconName: "GraduationCap" },
          { label: "Class Log", href: "/admin-route/class-log", iconName: "CalendarPlus" },
        ],
      },
      {
        title: "People",
        items: [
          { label: "Students", href: "/admin-route/students", iconName: "Users" },
          { label: "Teachers", href: "/admin-route/teachers", iconName: "UserCheck" },
          { label: "Batches", href: "/admin-route/batches", iconName: "Layers" },
          { label: "Special Batches", href: "/admin-route/special-batch", iconName: "Sparkles" },
          { label: "Schools", href: "/admin-route/schools", iconName: "School" },
        ],
      },
      {
        title: "Finance",
        items: [
          { label: "Accounts Hub", href: "/admin-route/accounts", iconName: "Wallet" },
          { label: "Fees Matrix", href: "/admin-route/fees", iconName: "CreditCard" },
          { label: "Receipts", href: "/admin-route/receipts", iconName: "Receipt" },
          { label: "Expenses", href: "/admin-route/expenses", iconName: "TrendingDown" },
          { label: "Teacher Payments", href: "/admin-route/payments", iconName: "Banknote" },
        ],
      },
      {
        title: "System",
        items: [
          { label: "User Access", href: "/admin-route/users", iconName: "ShieldAlert" },
          { label: "Print Rosters", href: "/admin-route/students/print", iconName: "Printer" },
          { label: "Settings & Profile", href: "/admin-route/profile", iconName: "User" },
        ],
      },
    ];
  }

  if (normalizedRole === "STAFF") {
    return [
      {
        items: [
          { label: "Dashboard", href: "/admin-route/dashboard", iconName: "LayoutDashboard" },
        ],
      },
      {
        title: "Academics",
        items: [
          { label: "Exams", href: "/admin-route/exams", iconName: "CalendarDays" },
          { label: "Attendance Sheet", href: "/admin-route/exams/attendance", iconName: "BookOpenCheck" },
          { label: "Marks Entry", href: "/admin-route/marks", iconName: "GraduationCap" },
          { label: "Class Log", href: "/admin-route/class-log", iconName: "CalendarPlus" },
        ],
      },
      {
        title: "People",
        items: [
          { label: "Students", href: "/admin-route/students", iconName: "Users" },
          { label: "Teachers", href: "/admin-route/teachers", iconName: "UserCheck" },
          { label: "Batches", href: "/admin-route/batches", iconName: "Layers" },
          { label: "Special Batches", href: "/admin-route/special-batch", iconName: "Sparkles" },
          { label: "Schools", href: "/admin-route/schools", iconName: "School" },
        ],
      },
      {
        title: "Tools & Account",
        items: [
          { label: "Print Rosters", href: "/admin-route/students/print", iconName: "Printer" },
          { label: "My Profile", href: "/admin-route/profile", iconName: "User" },
        ],
      },
    ];
  }

  if (normalizedRole === "TEACHER") {
    return [
      {
        items: [
          { label: "Dashboard", href: "/teacher-route/dashboard", iconName: "LayoutDashboard" },
        ],
      },
      {
        title: "Academics",
        items: [
          { label: "My Exams", href: "/teacher-route/exams", iconName: "CalendarDays" },
          { label: "Marks Entry", href: "/teacher-route/marks", iconName: "GraduationCap" },
          { label: "Results & Merit", href: "/teacher-route/results", iconName: "Award" },
        ],
      },
      {
        title: "Work & Earnings",
        items: [
          { label: "Class Log", href: "/teacher-route/class-log", iconName: "BookOpenCheck" },
          { label: "Payments", href: "/teacher-route/payments", iconName: "Wallet" },
        ],
      },
      {
        title: "Account",
        items: [
          { label: "Profile", href: "/teacher-route/profile", iconName: "User" },
        ],
      },
    ];
  }

  // STUDENT
  return [
    {
      items: [
        { label: "Home", href: "/student-route/dashboard", iconName: "LayoutDashboard" },
        { label: "My Results", href: "/student-route/results", iconName: "Award" },
        { label: "Fees & Receipts", href: "/student-route/fees", iconName: "Receipt" },
        { label: "My Profile", href: "/student-route/profile", iconName: "User" },
      ],
    },
  ];
}

export function getMobileTabsForRole(role: Role | string): NavItem[] {
  const normalizedRole = role as Role;

  if (normalizedRole === "STUDENT") {
    return [
      { label: "Home", href: "/student-route/dashboard", iconName: "LayoutDashboard" },
      { label: "Results", href: "/student-route/results", iconName: "Award" },
      { label: "Fees", href: "/student-route/fees", iconName: "Receipt" },
      { label: "Profile", href: "/student-route/profile", iconName: "User" },
    ];
  }

  if (normalizedRole === "TEACHER") {
    return [
      { label: "Home", href: "/teacher-route/dashboard", iconName: "LayoutDashboard" },
      { label: "Exams", href: "/teacher-route/exams", iconName: "CalendarDays" },
      { label: "Marks", href: "/teacher-route/marks", iconName: "GraduationCap" },
      { label: "Class Log", href: "/teacher-route/class-log", iconName: "BookOpenCheck" },
      { label: "Profile", href: "/teacher-route/profile", iconName: "User" },
    ];
  }

  if (normalizedRole === "STAFF") {
    return [
      { label: "Dashboard", href: "/admin-route/dashboard", iconName: "LayoutDashboard" },
      { label: "Students", href: "/admin-route/students", iconName: "Users" },
      { label: "Marks", href: "/admin-route/marks", iconName: "GraduationCap" },
      { label: "Exams", href: "/admin-route/exams", iconName: "CalendarDays" },
      { label: "Profile", href: "/admin-route/profile", iconName: "User" },
    ];
  }

  // Admin uses responsive drawer on mobile, but can have quick bottom tabs as well
  return [
    { label: "Dashboard", href: "/admin-route/dashboard", iconName: "LayoutDashboard" },
    { label: "Students", href: "/admin-route/students", iconName: "Users" },
    { label: "Marks", href: "/admin-route/marks", iconName: "GraduationCap" },
    { label: "Fees", href: "/admin-route/fees", iconName: "CreditCard" },
    { label: "Profile", href: "/admin-route/profile", iconName: "User" },
  ];
}

export function getQuickActionsForRole(role: Role | string): QuickAction[] {
  const normalizedRole = role as Role;

  if (normalizedRole === "ADMIN") {
    return [
      { label: "+ New Admission", href: "/admin-route/students?action=create", iconName: "UserPlus", description: "Enroll new student" },
      { label: "+ Record Marks", href: "/admin-route/marks", iconName: "GraduationCap", description: "Bulk spreadsheet entry" },
      { label: "+ Collect Fee", href: "/admin-route/fees", iconName: "CreditCard", description: "Record student tuition" },
      { label: "+ Schedule Exam", href: "/admin-route/exams?action=create", iconName: "CalendarPlus", description: "Create monthly or annual test" },
      { label: "+ Log Daily Class", href: "/admin-route/class-log?action=create", iconName: "BookOpenCheck", description: "Add teacher class log" },
    ];
  }

  if (normalizedRole === "STAFF") {
    return [
      { label: "+ New Admission", href: "/admin-route/students?action=create", iconName: "UserPlus", description: "Enroll new student" },
      { label: "+ Record Marks", href: "/admin-route/marks", iconName: "GraduationCap", description: "Bulk spreadsheet entry" },
      { label: "+ Schedule Exam", href: "/admin-route/exams?action=create", iconName: "CalendarPlus", description: "Create monthly or annual test" },
      { label: "+ Log Daily Class", href: "/admin-route/class-log?action=create", iconName: "BookOpenCheck", description: "Add teacher class log" },
    ];
  }

  if (normalizedRole === "TEACHER") {
    return [
      { label: "+ Record Marks", href: "/teacher-route/marks", iconName: "GraduationCap", description: "Input exam scores" },
      { label: "+ Log Today's Class", href: "/teacher-route/class-log?action=create", iconName: "BookOpenCheck", description: "Record teaching activity" },
    ];
  }

  return [];
}
