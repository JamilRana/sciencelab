"use client";

import { useState } from "react";
import { Search, Menu, Command } from "lucide-react";
import { Breadcrumbs } from "./Breadcrumbs";
import { QuickActionsMenu } from "./QuickActionsMenu";
import { NotificationsMenu } from "./NotificationsMenu";
import { UserNavMenu } from "./UserNavMenu";
import { CommandPalette } from "./CommandPalette";

interface TopBarProps {
  role: string;
  onOpenMobileMenu?: () => void;
}

export function TopBar({ role, onOpenMobileMenu }: TopBarProps) {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-zinc-200 bg-white/95 px-4 sm:px-6 backdrop-blur-md">
        {/* Left Section: Mobile Menu Trigger + Breadcrumbs */}
        <div className="flex items-center gap-3">
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-1.5 text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors focus-ring"
              title="Open Navigation Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <div className="hidden sm:block">
            <Breadcrumbs />
          </div>
        </div>

        {/* Center / Right Section: Search + Quick Actions + Notifications + User Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global Search / ⌘K trigger */}
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-400 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-colors focus-ring w-36 sm:w-56 justify-between"
          >
            <div className="flex items-center gap-1.5 truncate">
              <Search className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <span className="truncate">Search students...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-white border border-zinc-200 rounded">
              ⌘K
            </kbd>
          </button>

          {/* Quick Action Trigger */}
          <QuickActionsMenu role={role} />

          {/* Notifications */}
          <NotificationsMenu />

          <div className="h-4 w-px bg-zinc-200 mx-0.5 hidden sm:block" />

          {/* User Profile Menu with Logout */}
          <UserNavMenu role={role} />
        </div>
      </header>

      {/* Global ⌘K Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        role={role}
      />
    </>
  );
}
