"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { User, LogOut, Settings, ShieldCheck, ChevronDown } from "lucide-react";

interface UserNavMenuProps {
  role: string;
}

export function UserNavMenu({ role }: UserNavMenuProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userName = session?.user?.name || session?.user?.username || "User";
  const userRole = session?.user?.role || role || "STAFF";

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const profileHref =
    userRole === "STUDENT"
      ? "/student-route/profile"
      : userRole === "TEACHER"
      ? "/teacher-route/profile"
      : "/admin-route/profile";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full hover:bg-zinc-100 transition-colors focus-ring"
      >
        <div className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-200">
          {initials || "U"}
        </div>
        <div className="hidden sm:block text-left text-xs">
          <p className="font-semibold text-zinc-800 leading-tight truncate max-w-[100px]">
            {userName}
          </p>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-indigo-600">
            {userRole}
          </span>
        </div>
        <ChevronDown className="h-3 w-3 text-zinc-400 hidden sm:block" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-zinc-200 py-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-100">
          <div className="px-3 py-2 border-b border-zinc-100">
            <p className="text-xs font-semibold text-zinc-900 truncate">{userName}</p>
            <p className="text-[11px] text-zinc-400 truncate">
              {session?.user?.username ? `@${session.user.username}` : userRole}
            </p>
          </div>

          <div className="py-1">
            <Link
              href={profileHref}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <User className="h-3.5 w-3.5 text-zinc-400" />
              <span>Profile Settings</span>
            </Link>
          </div>

          <div className="pt-1 border-t border-zinc-100">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors font-medium text-left"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
