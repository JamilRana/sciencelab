// app/admin-route/fees/page.tsx
"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import useSWR from "swr";
import { saveFee } from "@/app/actions/fees";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import {
  CreditCard,
  Printer,
  Search,
  CheckCircle2,
  AlertCircle,
  Filter,
  DollarSign,
  X,
  Check,
  Calendar,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { CLASSES, MONTHS, type BatchData, type StudentFeeData } from "../types/admin";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { generateDisplayRoll } from "@/lib/roll";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
};

export function FeesClient() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [activeClass, setActiveClass] = useState("Six");
  const [activeBatch, setActiveBatch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);

  // Active cell popover state
  const [selectedCell, setSelectedCell] = useState<{
    studentId: number;
    studentName: string;
    studentRoll: string;
    month: string;
    currentAmount: number;
  } | null>(null);

  const [popoverAmount, setPopoverAmount] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebouncedValue(searchTerm, 250);

  // Fetch students fee records
  const {
    data: students,
    isLoading: studentsLoading,
    mutate,
  } = useSWR<StudentFeeData[]>(
    activeClass
      ? `/api/fees?class=${activeClass}${activeBatch ? `&batchId=${activeBatch}` : ""}&year=${selectedYear}&search=${encodeURIComponent(
          debouncedSearch || ""
        )}`
      : null,
    fetcher
  );

  // Fetch batches for class
  const { data: batches } = useSWR<BatchData[]>(
    activeClass ? `/api/batches?class=${encodeURIComponent(activeClass)}` : null,
    fetcher
  );

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setSelectedCell(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter students if "Overdue only" is active
  const filteredStudents = useMemo(() => {
    if (!students) return [];

    if (!overdueOnly) return students;

    const currentMonthIndex = new Date().getMonth();
    const currentMonthName = MONTHS[currentMonthIndex];

    return students.filter((s) => {
      // Overdue if no receipt exists for current month or preceding months
      const hasCurrentMonthPaid = s.receipts.some((r) => r.month === currentMonthName && r.amount > 0);
      return !hasCurrentMonthPaid;
    });
  }, [students, overdueOnly]);

  // Aggregate metrics
  const { totalCollected, totalReceiptsCount } = useMemo(() => {
    if (!students) return { totalCollected: 0, totalReceiptsCount: 0 };

    let collected = 0;
    let count = 0;

    students.forEach((s) => {
      s.receipts.forEach((r) => {
        if (r.amount > 0) {
          collected += r.amount;
          count++;
        }
      });
    });

    return { totalCollected: collected, totalReceiptsCount: count };
  }, [students]);

  // Open cell payment popover
  const handleCellClick = (student: StudentFeeData, month: string) => {
    const receipt = student.receipts.find((r) => r.month === month);
    const amount = receipt ? receipt.amount : 0;

    const displayRoll = student.batch?.code
      ? String(generateDisplayRoll(student.batch.code, student.roll))
      : String(student.roll);

    setSelectedCell({
      studentId: student.id,
      studentName: student.name,
      studentRoll: displayRoll,
      month,
      currentAmount: amount,
    });
    setPopoverAmount(amount > 0 ? String(amount) : "1500");
  };

  // Save payment
  const handleSavePayment = async (printReceipt = false) => {
    if (!selectedCell) return;

    const amount = parseInt(popoverAmount) || 0;
    setIsSaving(true);

    try {
      const res = await saveFee(selectedCell.studentId, selectedCell.month, amount, selectedYear);
      if (res.success) {
        toast.success(`৳${amount} recorded for ${selectedCell.studentName} (${selectedCell.month} ${selectedYear})`);
        mutate();
        if (printReceipt) {
          window.print();
        }
        setSelectedCell(null);
      } else {
        toast.error(res.error || "Failed to save fee payment");
      }
    } catch {
      toast.error("Error saving fee payment");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Print-only Header with Logo */}
      <div className="hidden print:block text-center border-b-2 border-black pb-3 mb-4">
        <div className="flex items-center justify-center gap-2.5 mb-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo2.png" alt="Science Lab Logo" className="h-9 w-auto object-contain" />
          <h1 className="text-xl font-black uppercase tracking-wider text-black">
            Science Lab Coaching Center
          </h1>
        </div>
        <p className="text-xs font-semibold text-gray-700 uppercase">
          Student Fees & Tuition Ledger Matrix — Class {activeClass} {activeBatch ? `· Batch ${batches?.find((b) => String(b.id) === activeBatch)?.name || ""}` : ""}
        </p>
        <p className="text-[10px] text-gray-500 mt-0.5">
          Generated on: {new Date().toLocaleDateString()}
        </p>
      </div>

      <PageHeader
        title="Student Fees Matrix"
        description="Track and collect monthly tuition payments with color-coded status and quick receipts."
      >
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors shadow-xs"
        >
          <Printer className="h-3.5 w-3.5 text-zinc-500" />
          <span>Print Register</span>
        </button>
      </PageHeader>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Total Collected</p>
            <p className="text-xl font-bold text-zinc-900 mt-0.5 tabular-nums">
              ৳{totalCollected.toLocaleString()}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">
              {totalReceiptsCount} payment receipts recorded
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Enrolled Students</p>
            <p className="text-xl font-bold text-zinc-900 mt-0.5 tabular-nums">
              {students?.length || 0}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">
              Class {activeClass} {activeBatch ? `· Batch ${batches?.find((b) => String(b.id) === activeBatch)?.name || ""}` : ""}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
            <CreditCard className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Matrix Filter</p>
            <button
              onClick={() => setOverdueOnly(!overdueOnly)}
              className={`mt-1.5 px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                overdueOnly
                  ? "bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-100"
                  : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100"
              }`}
            >
              {overdueOnly ? "Showing Overdue Only" : "Show Overdue Only"}
            </button>
            <p className="text-[11px] text-zinc-400 mt-1">
              {overdueOnly ? "Filter active: students missing current month" : "Click to view unpaid students"}
            </p>
          </div>
          <div className={`p-2.5 rounded-lg border ${overdueOnly ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-zinc-50 text-zinc-400 border-zinc-100"}`}>
            <AlertCircle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-zinc-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Academic Year Select */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-2.5 py-1.5 text-xs bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg outline-none font-semibold focus-ring"
            title="Academic Year"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map((yr) => (
              <option key={yr} value={yr}>
                Session {yr}
              </option>
            ))}
          </select>

          {/* Class Select */}
          <select
            value={activeClass}
            onChange={(e) => {
              setActiveClass(e.target.value);
              setActiveBatch("");
            }}
            className="px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 outline-none focus-ring font-medium"
          >
            {CLASSES.map((c) => (
              <option key={c} value={c}>
                Class {c}
              </option>
            ))}
          </select>

          {/* Batch Select */}
          <select
            value={activeBatch}
            onChange={(e) => setActiveBatch(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 outline-none focus-ring"
          >
            <option value="">All Batches</option>
            {batches?.map((b) => (
              <option key={b.id} value={String(b.id)}>
                {b.name} (Code: {b.code})
              </option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search student or roll..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg outline-none text-zinc-900 focus-ring"
          />
        </div>
      </div>

      {/* 12-Month Grid Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[640px]">
          <table className="w-full border-collapse text-left text-[13px]">
            {/* Table Header */}
            <thead className="sticky top-0 bg-zinc-50 border-b border-zinc-200 z-20 select-none text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              <tr>
                <th className="sticky left-0 z-30 bg-zinc-50 py-3 px-3.5 w-24 border-r border-zinc-200 shadow-xs">
                  Roll
                </th>
                <th className="sticky left-24 z-30 bg-zinc-50 py-3 px-4 min-w-[180px] border-r border-zinc-200 shadow-xs">
                  Student Name
                </th>
                {MONTHS.map((m) => (
                  <th
                    key={m}
                    className="py-3 px-2 text-center min-w-[76px] border-r border-zinc-100 last:border-r-0 hover:bg-zinc-100/70 transition-colors"
                  >
                    {m}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-zinc-100">
              {studentsLoading ? (
                <tr>
                  <td colSpan={14} className="p-8 text-center text-xs text-zinc-400">
                    Loading fee records...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={14} className="p-8 text-center text-xs text-zinc-400">
                    No fee records found for the selected class and filters.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const displayRoll = student.batch?.code
                    ? generateDisplayRoll(student.batch.code, student.roll)
                    : student.roll;

                  return (
                    <tr key={student.id} className="hover:bg-zinc-50/50 transition-colors group">
                      {/* Sticky Roll Column */}
                      <td className="sticky left-0 z-10 bg-white group-hover:bg-zinc-50/90 py-2.5 px-3.5 border-r border-zinc-200 shadow-xs">
                        <span className="font-bold text-xs text-indigo-700 tabular-nums">
                          {displayRoll}
                        </span>
                      </td>

                      {/* Sticky Name Column */}
                      <td className="sticky left-24 z-10 bg-white group-hover:bg-zinc-50/90 py-2.5 px-4 border-r border-zinc-200 shadow-xs min-w-[180px]">
                        <p className="font-semibold text-zinc-900 truncate max-w-[160px] text-xs">
                          {student.name}
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate">{student.batchName}</p>
                      </td>

                      {/* 12 Months Cells */}
                      {MONTHS.map((m) => {
                        const receipt = student.receipts.find((r) => r.month === m);
                        const isPaid = receipt && receipt.amount > 0;

                        return (
                          <td
                            key={m}
                            onClick={() => handleCellClick(student, m)}
                            className={`py-2 px-1 text-center border-r border-zinc-100 last:border-r-0 cursor-pointer select-none transition-colors ${
                              isPaid
                                ? "bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-800 font-bold"
                                : "hover:bg-zinc-100 text-zinc-300"
                            }`}
                            title={`Click to manage fee for ${m}`}
                          >
                            {isPaid ? (
                              <div className="flex flex-col items-center justify-center">
                                <span className="text-xs tabular-nums font-bold text-emerald-700">
                                  ৳{receipt.amount}
                                </span>
                              </div>
                            ) : (
                              <span className="text-zinc-300 text-xs">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cell Payment Popover Modal */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/30 backdrop-blur-xs animate-in fade-in-0 duration-150">
          <div
            ref={popoverRef}
            className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-zinc-200 p-5 space-y-4 animate-in zoom-in-95 duration-150"
          >
            {/* Popover Header */}
            <div className="flex items-start justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">
                  Fee Collection — {selectedCell.month}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {selectedCell.studentName} (Roll: {selectedCell.studentRoll})
                </p>
              </div>
              <button
                onClick={() => setSelectedCell(null)}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Amount Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 block">
                Tuition Amount (৳)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">
                  ৳
                </span>
                <input
                  type="number"
                  value={popoverAmount}
                  onChange={(e) => setPopoverAmount(e.target.value)}
                  placeholder="e.g. 1500"
                  className="w-full pl-8 pr-3 py-2 text-sm font-bold bg-zinc-50 border border-zinc-200 rounded-lg outline-none tabular-nums focus-ring text-zinc-900"
                  autoFocus
                />
              </div>
            </div>

            {/* Quick preset amounts */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-zinc-400 text-[11px]">Presets:</span>
              {[1000, 1500, 2000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setPopoverAmount(String(amt))}
                  className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium text-[11px] tabular-nums transition-colors"
                >
                  ৳{amt}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
              {selectedCell.currentAmount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setPopoverAmount("0");
                    setTimeout(() => handleSavePayment(false), 50);
                  }}
                  className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-medium"
                >
                  Unmark Paid
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => handleSavePayment(true)}
                  disabled={isSaving}
                  className="px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors shadow-xs"
                >
                  Save & Print
                </button>

                <button
                  type="button"
                  onClick={() => handleSavePayment(false)}
                  disabled={isSaving}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors focus-ring"
                >
                  {isSaving ? "Saving..." : "Save Payment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
