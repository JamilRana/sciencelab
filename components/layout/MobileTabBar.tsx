"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getMobileTabsForRole, NavItem } from "@/lib/navigation";
import { DynamicIcon } from "./DynamicIcon";

interface MobileTabBarProps {
  role: string;
}

export function MobileTabBar({ role }: MobileTabBarProps) {
  const pathname = usePathname();
  const tabs: NavItem[] = getMobileTabsForRole(role);

  // Show bottom tabs on mobile devices
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-zinc-200 backdrop-blur-md px-2 py-1 safe-area-pb">
      <nav className="flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== "/admin-route/dashboard" && tab.href !== "/student-route/dashboard" && pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center py-1.5 px-2 rounded-lg text-[10px] font-medium transition-colors min-w-[56px]",
                isActive
                  ? "text-indigo-600 font-semibold"
                  : "text-zinc-500 hover:text-zinc-900"
              )}
            >
              <div className={cn("p-1 rounded-md transition-colors", isActive ? "bg-indigo-50" : "bg-transparent")}>
                <DynamicIcon name={tab.iconName} className="h-4 w-4" />
              </div>
              <span className="truncate mt-0.5">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
