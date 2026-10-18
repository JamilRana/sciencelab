"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import React from "react";

const labelMap: Record<string, string> = {
  "admin-route": "Admin",
  "teacher-route": "Teacher",
  "student-route": "Student",
  "dashboard": "Dashboard",
  "students": "Students",
  "teachers": "Teachers",
  "batches": "Batches & Schools",
  "special-batch": "Special Batches",
  "schools": "Schools",
  "exams": "Exams",
  "marks": "Marks Entry",
  "results": "Results",
  "class-log": "Class Log",
  "accounts": "Accounts",
  "fees": "Fees",
  "receipts": "Receipts",
  "expenses": "Expenses",
  "payments": "Teacher Payments",
  "users": "Users",
  "profile": "Profile",
  "attendance": "Attendance",
  "print": "Print View",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  // Build breadcrumb items
  const breadcrumbItems = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label = labelMap[segment] || segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const isLast = index === segments.length - 1;

    return { href, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-xs text-zinc-500 font-medium">
      <Link
        href={breadcrumbItems[0]?.href || "/"}
        className="flex items-center gap-1 hover:text-zinc-900 transition-colors"
      >
        <Home className="h-3.5 w-3.5 text-zinc-400" />
      </Link>

      {breadcrumbItems.map((item, idx) => {
        // Skip first segment if it's admin-route/teacher-route/student-route for cleaner breadcrumb
        if (idx === 0) return null;

        return (
          <React.Fragment key={item.href}>
            <ChevronRight className="h-3 w-3 text-zinc-300 mx-1.5 flex-shrink-0" />
            {item.isLast ? (
              <span className="text-zinc-800 font-semibold truncate max-w-[150px] sm:max-w-none">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-zinc-900 transition-colors truncate max-w-[120px] sm:max-w-none"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
