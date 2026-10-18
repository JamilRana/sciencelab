"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, CheckCircle2, Clock, Calendar, AlertCircle } from "lucide-react";

export function NotificationsMenu() {
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

  const sampleNotifications = [
    { id: 1, title: "Exam marks deadline", time: "Today at 5:00 PM", icon: Clock, type: "warning" },
    { id: 2, title: "Monthly tuition fees due", time: "Oct 20", icon: AlertCircle, type: "info" },
    { id: 3, title: "Class logs synced", time: "1 hour ago", icon: CheckCircle2, type: "success" },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-colors focus-ring"
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-zinc-200 py-2 z-50 animate-in fade-in-50 zoom-in-95 duration-100">
          <div className="px-3 py-1.5 flex items-center justify-between border-b border-zinc-100 mb-1">
            <span className="text-xs font-semibold text-zinc-800">Notifications</span>
            <span className="text-[10px] text-indigo-600 hover:underline cursor-pointer">Mark all read</span>
          </div>
          <div className="divide-y divide-zinc-50">
            {sampleNotifications.map((n) => {
              const Icon = n.icon;
              return (
                <div key={n.id} className="px-3 py-2.5 hover:bg-zinc-50 transition-colors flex items-start gap-2.5">
                  <div className="p-1 rounded bg-zinc-100 text-zinc-600 shrink-0 mt-0.5">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-zinc-900 truncate">{n.title}</p>
                    <p className="text-[10px] text-zinc-400">{n.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
