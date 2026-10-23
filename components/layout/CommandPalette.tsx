"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, User, ArrowRight, Sparkles, Command, Calendar, CreditCard, GraduationCap } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: "Navigation" | "Actions" | "Students";
  href: string;
  icon?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  role?: string;
}

export function CommandPalette({ isOpen, onClose, role = "ADMIN" }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [studentResults, setStudentResults] = useState<CommandItem[]>([]);
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebouncedValue(query, 250);

  // Static navigation items based on role
  const defaultItems: CommandItem[] = [
    { id: "nav-dash", title: "Dashboard", category: "Navigation", href: role === "STUDENT" ? "/student-route/dashboard" : role === "TEACHER" ? "/teacher-route/dashboard" : "/admin-route/dashboard" },
    { id: "nav-routine", title: "Class Routine & Day Planner", subtitle: "Daily schedule, assign faculty, exam duty", category: "Navigation", href: "/admin-route/routine" },
    { id: "nav-routine-reports", title: "Routine Analytics & Reports", subtitle: "Classes per teacher & batch, exam duty remuneration, cancellations", category: "Navigation", href: "/admin-route/routine/reports" },
    { id: "nav-students", title: "Students Directory", subtitle: "Enrollments, profiles, roster", category: "Navigation", href: "/admin-route/students" },
    { id: "nav-teachers", title: "Teachers Directory", subtitle: "Faculty profiles & rates", category: "Navigation", href: "/admin-route/teachers" },
    { id: "nav-batches", title: "Batches Management", subtitle: "Classes, batches & enrolled students", category: "Navigation", href: "/admin-route/batches" },
    { id: "nav-special-batch", title: "Special Batches & Programs", subtitle: "SSC & JSC special programs, model tests & fees", category: "Navigation", href: "/admin-route/special-batch" },
    { id: "nav-schools", title: "Partner Schools", subtitle: "Registered feeder schools & institutions", category: "Navigation", href: "/admin-route/schools" },
    { id: "nav-exams", title: "Exam Schedules", subtitle: "Assessments, subjects, schedule", category: "Navigation", href: role === "TEACHER" ? "/teacher-route/exams" : "/admin-route/exams" },
    { id: "nav-attendance", title: "Exam Attendance Sheet", subtitle: "Generate exam attendance signature sheets", category: "Navigation", href: "/admin-route/exams/attendance" },
    { id: "nav-results", title: "Results & Merit Lists", subtitle: "View published exam results & rankings", category: "Navigation", href: role === "STUDENT" ? "/student-route/results" : role === "TEACHER" ? "/teacher-route/results" : "/admin-route/exams" },
    { id: "nav-marks", title: "Marks Entry Spreadsheet", subtitle: "Fast bulk marks recording (Staff/Admin)", category: "Navigation", href: "/admin-route/marks" },
    { id: "nav-fees", title: "Fees Matrix", subtitle: "Monthly student tuition collection", category: "Navigation", href: "/admin-route/fees" },
    { id: "nav-receipts", title: "Receipts Log", subtitle: "Fee payment receipts & voucher history", category: "Navigation", href: "/admin-route/receipts" },
    { id: "nav-expenses", title: "Operating Expenses", subtitle: "Institutional expenses & vouchers", category: "Navigation", href: "/admin-route/expenses" },
    { id: "nav-payments", title: "Teacher Payroll", subtitle: "Faculty payments, dues & salary ledger", category: "Navigation", href: role === "TEACHER" ? "/teacher-route/payments" : "/admin-route/payments" },
    { id: "nav-accounts", title: "Accounts Hub", subtitle: "Overall cashflow, receipts & expenses", category: "Navigation", href: "/admin-route/accounts" },
    { id: "nav-classlog", title: "Teacher Class Log", subtitle: "Daily tasks & notebook checks", category: "Navigation", href: role === "TEACHER" ? "/teacher-route/class-log" : "/admin-route/class-log" },
    { id: "nav-rosters", title: "Print Student Rosters", subtitle: "Printable batch & class student rosters", category: "Navigation", href: "/admin-route/students/print" },
    { id: "nav-backup", title: "Database Backup & Restore", subtitle: "Download backups & restore institutional database snapshots", category: "Navigation", href: "/admin-route/backup" },
    { id: "nav-users", title: "User Access Control", subtitle: "Manage admin, staff & user logins", category: "Navigation", href: "/admin-route/users" },
    { id: "act-admission", title: "+ New Student Admission", subtitle: "Create new student profile", category: "Actions", href: "/admin-route/students?action=create" },
    { id: "act-exam", title: "+ Schedule New Exam", subtitle: "Monthly or Annual assessment", category: "Actions", href: "/admin-route/exams?action=create" },
    { id: "act-fee", title: "+ Collect Student Fee", subtitle: "Record payment & print receipt", category: "Actions", href: "/admin-route/fees" },
    { id: "act-special-course-fee", title: "+ Collect Course Fee (Special Batch)", subtitle: "Record installment & print receipt", category: "Actions", href: "/admin-route/special-batch?tab=fees" },
  ];

  // Filter items by role
  const filteredDefaultItems = defaultItems.filter((item) => {
    if (role === "STUDENT") {
      return item.href.startsWith("/student-route");
    }
    if (role === "TEACHER") {
      return item.href.startsWith("/teacher-route") || item.category === "Actions";
    }
    if (role === "STAFF") {
      return !item.href.includes("accounts") && !item.href.includes("users");
    }
    return true;
  });

  // Query students dynamically when typing
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setStudentResults([]);
      setIsSearchingStudents(false);
      return;
    }

    let isMounted = true;
    setIsSearchingStudents(true);

    fetch(`/api/students?search=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!isMounted) return;
        const results: CommandItem[] = Array.isArray(data)
          ? data.slice(0, 5).map((s: any) => ({
              id: `student-${s.id}`,
              title: s.name,
              subtitle: `Roll: ${s.roll} · Class: ${s.class} · Mobile: ${s.mobile}`,
              category: "Students",
              href: `/admin-route/students?search=${encodeURIComponent(s.name)}`,
            }))
          : [];
        setStudentResults(results);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsSearchingStudents(false);
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery]);

  // Combined visible items
  const matchingStatic = filteredDefaultItems.filter((item) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return item.title.toLowerCase().includes(q) || item.subtitle?.toLowerCase().includes(q);
  });

  const allItems = [...matchingStatic, ...studentResults];

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(allItems.length, 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + allItems.length) % Math.max(allItems.length, 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (allItems[selectedIndex]) {
          router.push(allItems[selectedIndex].href);
          onClose();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, allItems, router, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in-0 duration-150">
      <div
        className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-zinc-200 overflow-hidden text-zinc-900 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-zinc-100 gap-3">
          <Search className="h-4 w-4 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search students, marks, fees, or jump to page... (Esc to close)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full py-3.5 text-sm bg-transparent border-0 outline-none placeholder:text-zinc-400 text-zinc-900"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 hover:bg-zinc-100 rounded text-zinc-400 hover:text-zinc-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-100 rounded border border-zinc-200">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {allItems.length === 0 ? (
            <div className="py-8 text-center text-sm text-zinc-400">
              No matching pages, actions, or students found.
            </div>
          ) : (
            allItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    router.push(item.href);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors ${
                    isSelected ? "bg-indigo-50 text-indigo-900" : "text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-md ${
                        isSelected
                          ? "bg-indigo-600 text-white"
                          : item.category === "Students"
                          ? "bg-emerald-50 text-emerald-600"
                          : item.category === "Actions"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {item.category === "Students" ? (
                        <User className="h-4 w-4" />
                      ) : item.category === "Actions" ? (
                        <Sparkles className="h-4 w-4" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                    </div>
                    <div className="truncate">
                      <p className="font-medium text-xs sm:text-sm text-zinc-900 truncate">
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className="text-[11px] text-zinc-400 truncate">{item.subtitle}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 ml-2 shrink-0">
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded text-[10px] ml-1">↓</kbd> navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded text-[10px]">↵</kbd> select
            </span>
          </div>
          <span className="text-zinc-400">Science Lab Portal</span>
        </div>
      </div>
    </div>
  );
}
