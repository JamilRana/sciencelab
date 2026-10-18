"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileTabBar } from "./MobileTabBar";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  role: string;
}

export function AppShell({ children, role }: AppShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 flex">
      {/* Desktop Persistent Sidebar & Mobile Drawer */}
      <Sidebar
        role={role}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Container */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out pb-16 lg:pb-0",
          isCollapsed ? "lg:pl-[72px]" : "lg:pl-64"
        )}
      >
        {/* Top Header */}
        <TopBar
          role={role}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>

        {/* Bottom Navigation for Mobile */}
        <MobileTabBar role={role} />
      </div>
    </div>
  );
}
