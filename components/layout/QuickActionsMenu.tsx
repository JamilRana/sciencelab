"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Plus, ChevronDown, UserPlus, GraduationCap, CreditCard, CalendarPlus, BookOpenCheck, Sparkles } from "lucide-react";
import { getQuickActionsForRole, QuickAction } from "@/lib/navigation";

interface QuickActionsMenuProps {
  role?: string;
}

export function QuickActionsMenu({ role = "ADMIN" }: QuickActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const actions = getQuickActionsForRole(role);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (actions.length === 0) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors focus-ring"
      >
        <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
        <span className="hidden sm:inline">Quick Action</span>
        <ChevronDown className="h-3 w-3 opacity-80" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-zinc-200 py-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-100">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 mb-1">
            Fast Operations
          </div>
          {actions.map((act) => (
            <Link
              key={act.label}
              href={act.href || "#"}
              onClick={() => setIsOpen(false)}
              className="flex items-start gap-2.5 px-3 py-2 text-xs text-zinc-700 hover:bg-indigo-50 hover:text-indigo-900 transition-colors"
            >
              <div className="p-1 rounded bg-zinc-100 text-zinc-600 group-hover:bg-indigo-100 group-hover:text-indigo-700 shrink-0 mt-0.5">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="font-semibold text-zinc-900">{act.label}</p>
                {act.description && (
                  <p className="text-[11px] text-zinc-400">{act.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
