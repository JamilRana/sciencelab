"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { getNavigationForRole, NavGroup } from "@/lib/navigation";
import { DynamicIcon } from "./DynamicIcon";
import {
  ChevronsLeft,
  ChevronsRight,
  GraduationCap,
  X,
  Shield,
  UserCheck,
  User,
} from "lucide-react";

interface SidebarProps {
  role: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  role,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const navGroups: NavGroup[] = getNavigationForRole(role);

  const roleLabels: Record<string, { label: string; badgeClass: string }> = {
    ADMIN: { label: "Administrator", badgeClass: "bg-indigo-100 text-indigo-800" },
    STAFF: { label: "Staff Panel", badgeClass: "bg-zinc-100 text-zinc-800" },
    TEACHER: { label: "Faculty Portal", badgeClass: "bg-emerald-100 text-emerald-800" },
    STUDENT: { label: "Student Portal", badgeClass: "bg-sky-100 text-sky-800" },
  };

  const currentRoleInfo = roleLabels[role.toUpperCase()] || {
    label: role,
    badgeClass: "bg-zinc-100 text-zinc-800",
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-zinc-200 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-zinc-100">
        <Link
          href={role === "STUDENT" ? "/student-route/dashboard" : role === "TEACHER" ? "/teacher-route/dashboard" : "/admin-route/dashboard"}
          className="flex items-center gap-2.5 min-w-0"
        >
          <div className="h-8 w-8 rounded-lg bg-zinc-50 border border-zinc-200/80 flex items-center justify-center p-1 shrink-0 shadow-2xs overflow-hidden">
            <Image
              src="/logo2.png"
              alt="Science Lab"
              width={32}
              height={32}
              className="h-full w-auto object-contain"
            />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-bold tracking-tight text-zinc-900 truncate">
                Science Lab
              </h1>
              <p className="text-[10px] text-zinc-400 font-medium tracking-wide uppercase">
                Coaching Center
              </p>
            </div>
          )}
        </Link>

        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Role Pill */}
      {!isCollapsed && (
        <div className="px-4 py-2 bg-zinc-50/60 border-b border-zinc-100 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-zinc-500">Access Mode</span>
          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider", currentRoleInfo.badgeClass)}>
            {currentRoleInfo.label}
          </span>
        </div>
      )}

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {navGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-1">
            {group.title && !isCollapsed && (
              <p className="px-2.5 pb-1 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                {group.title}
              </p>
            )}

            {group.items.map((item) => {
              const isExact = pathname === item.href;
              const hasMoreSpecificMatch = navGroups.some((g) =>
                g.items.some(
                  (other) =>
                    other.href !== item.href &&
                    other.href.startsWith(item.href) &&
                    (pathname === other.href || pathname.startsWith(other.href + "/"))
                )
              );
              const isChild =
                item.href !== "/admin-route/dashboard" &&
                pathname.startsWith(item.href + "/") &&
                !hasMoreSpecificMatch;
              const isActive = isExact || isChild;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onCloseMobile?.()}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-medium transition-all group relative",
                    isActive
                      ? "bg-indigo-50 text-indigo-700 font-semibold shadow-xs"
                      : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80"
                  )}
                >
                  <div
                    className={cn(
                      "shrink-0 transition-colors",
                      isActive ? "text-indigo-600" : "text-zinc-400 group-hover:text-zinc-600"
                    )}
                  >
                    <DynamicIcon name={item.iconName} className="h-4 w-4" />
                  </div>

                  {!isCollapsed && (
                    <span className="truncate flex-1">{item.label}</span>
                  )}

                  {isActive && !isCollapsed && (
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Collapse Toggle Footer */}
      {onToggleCollapse && (
        <div className="hidden lg:flex items-center justify-between p-3 border-t border-zinc-100">
          {!isCollapsed && (
            <span className="text-[11px] text-zinc-400 font-medium">Collapse menu</span>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors focus-ring ml-auto"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <ChevronsLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={cn(
          "hidden lg:block fixed top-0 left-0 z-40 h-screen transition-all duration-200 ease-in-out",
          isCollapsed ? "w-[72px]" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in-0 duration-150"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
