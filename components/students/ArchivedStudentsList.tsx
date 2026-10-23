"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  Search,
  Printer,
  RotateCcw,
  History,
  Users,
  ChevronDown,
  Calendar,
  Layers,
  GraduationCap,
  Sparkles,
  Phone,
  School as SchoolIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ArrowLeft,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { restoreArchivedStudentAction } from "@/app/actions/archiving";
import type { Batch } from "@/types";
import { exportToCSV } from "@/lib/export";

export interface ArchivedStudentItem {
  id: number;
  name: string;
  fatherName: string;
  motherName: string;
  mobile: string;
  homeMobile: string;
  class: string;
  roll: number;
  displayRoll: number;
  batchId: number;
  batchName: string;
  gender: string;
  schoolName: string;
  archivedYear: number | null;
  archivedReason: string | null;
  archivedAt: Date | string | null;
  academicHistories?: {
    id: number;
    year: number;
    class: string;
    roll: number;
    batch?: { name: string; code: number } | null;
    note?: string | null;
  }[];
}

interface ArchivedStudentsListProps {
  initialStudents: ArchivedStudentItem[];
  batches: Batch[];
}

export function ArchivedStudentsList({
  initialStudents,
  batches,
}: ArchivedStudentsListProps) {
  const router = useRouter();

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [selectedReason, setSelectedReason] = useState<string>("ALL");

  // Restore modal state
  const [restoreStudent, setRestoreStudent] = useState<ArchivedStudentItem | null>(null);
  const [targetBatchId, setTargetBatchId] = useState<string>("");
  const [isRestoring, setIsRestoring] = useState(false);

  // Expanded history student ID for drawer/row details
  const [expandedStudentId, setExpandedStudentId] = useState<number | null>(null);

  // Available filter options extracted from data
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    initialStudents.forEach((s) => {
      if (s.archivedYear) years.add(s.archivedYear);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [initialStudents]);

  const availableClasses = useMemo(() => {
    const classes = new Set<string>();
    initialStudents.forEach((s) => {
      if (s.class) classes.add(s.class);
    });
    return Array.from(classes).sort();
  }, [initialStudents]);

  const availableReasons = useMemo(() => {
    const reasons = new Set<string>();
    initialStudents.forEach((s) => {
      if (s.archivedReason) reasons.add(s.archivedReason);
    });
    return Array.from(reasons);
  }, [initialStudents]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return initialStudents.filter((student) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = student.name.toLowerCase().includes(q);
        const matchesMobile = student.mobile.includes(q) || (student.homeMobile && student.homeMobile.includes(q));
        const matchesRoll =
          String(student.roll).includes(q) || String(student.displayRoll).includes(q);
        const matchesSchool = student.schoolName.toLowerCase().includes(q);
        if (!matchesName && !matchesMobile && !matchesRoll && !matchesSchool) {
          return false;
        }
      }

      // Year
      if (selectedYear !== "ALL" && String(student.archivedYear) !== selectedYear) {
        return false;
      }

      // Class
      if (selectedClass !== "ALL" && student.class !== selectedClass) {
        return false;
      }

      // Reason
      if (selectedReason !== "ALL" && student.archivedReason !== selectedReason) {
        return false;
      }

      return true;
    });
  }, [initialStudents, searchQuery, selectedYear, selectedClass, selectedReason]);

  const handleOpenRestore = (student: ArchivedStudentItem) => {
    setRestoreStudent(student);
    // Default target batch to their last batch or first active batch with matching class
    const matchingBatch = batches.find((b) => b.id === student.batchId) || batches.find((b) => b.classId === student.class);
    setTargetBatchId(matchingBatch ? String(matchingBatch.id) : "");
  };

  const handleConfirmRestore = async () => {
    if (!restoreStudent) return;
    setIsRestoring(true);
    try {
      const targetId = targetBatchId ? parseInt(targetBatchId) : undefined;
      const res = await restoreArchivedStudentAction(restoreStudent.id, targetId);
      if (res.success) {
        toast.success(res.message || "Student restored successfully");
        setRestoreStudent(null);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to restore student");
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred");
    } finally {
      setIsRestoring(false);
    }
  };

  const handleExportArchived = () => {
    if (filteredStudents.length === 0) {
      toast.error("No archived records to export");
      return;
    }

    const yearSuffix = selectedYear !== "ALL" ? `Session_${selectedYear}` : "all";
    const filename = `archived_students_${yearSuffix}_${new Date().toISOString().split("T")[0]}`;

    const headers = [
      { key: "displayRoll", label: "Display Roll", format: (v: any) => String(v) },
      { key: "roll", label: "Raw Roll", format: (v: any) => String(v) },
      { key: "name", label: "Student Name" },
      { key: "gender", label: "Gender" },
      { key: "class", label: "Class", format: (c: any) => `Class ${c}` },
      { key: "batchName", label: "Batch" },
      { key: "schoolName", label: "School" },
      { key: "mobile", label: "Student Mobile" },
      { key: "homeMobile", label: "Guardian Mobile" },
      { key: "fatherName", label: "Father Name" },
      { key: "motherName", label: "Mother Name" },
      { key: "archivedYear", label: "Archived Session" },
      { key: "archivedReason", label: "Archive Reason" },
      {
        key: "archivedAt",
        label: "Archived Date",
        format: (d: any) => (d ? new Date(d).toISOString().split("T")[0] : ""),
      },
    ];

    exportToCSV(filteredStudents, filename, headers);
    toast.success(`Exported ${filteredStudents.length} archived student records`);
  };

  return (
    <div className="space-y-6">
      {/* Print-only Header */}
      <div className="hidden print:block mb-6 text-center border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Science Lab Coaching Center
        </h1>
        <p className="text-sm text-zinc-600 mt-1">Archived Students Directory Report</p>
        <div className="flex justify-between items-center text-xs text-zinc-500 mt-3 pt-2 border-t">
          <span>Printed on: {new Date().toLocaleDateString("en-GB", { dateStyle: "long" })}</span>
          <span>
            Total Filtered Records: {filteredStudents.length} of {initialStudents.length}
          </span>
          {selectedYear !== "ALL" && <span>Archived Session: {selectedYear}</span>}
        </div>
      </div>

      {/* Screen Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin-route/students"
              className="text-zinc-500 hover:text-zinc-800 transition-colors inline-flex items-center gap-1 text-xs font-medium"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Active Students</span>
            </Link>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
              <Archive className="h-6 w-6 text-amber-600" />
              Archived Students
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              {filteredStudents.length} {filteredStudents.length === 1 ? "Record" : "Records"}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Historical repository of alumni, year-end Class 10 graduates, and completed SSC program cohorts.
          </p>
        </div>

        {/* Quick Nav & Print Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin-route/class-ten-lifecycle"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>Class 10 Lifecycle</span>
          </Link>
          <Link
            href="/admin-route/promotion"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
          >
            <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
            <span>Promotion Wizard</span>
          </Link>
          <button
            type="button"
            onClick={handleExportArchived}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-lg transition-colors shadow-2xs"
            title="Export filtered archived students to CSV"
          >
            <Download className="h-3.5 w-3.5 text-zinc-500" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg shadow-xs transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Archive Roster</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs space-y-3 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, roll, mobile..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Archived Year */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
            >
              <option value="ALL">All Archived Years</option>
              {availableYears.map((yr) => (
                <option key={yr} value={String(yr)}>
                  Session {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Class */}
          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
            >
              <option value="ALL">All Classes</option>
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>
                  Class {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
            >
              <option value="ALL">All Archive Reasons</option>
              {availableReasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filter Badges */}
        {(selectedYear !== "ALL" ||
          selectedClass !== "ALL" ||
          selectedReason !== "ALL" ||
          searchQuery) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100 text-xs">
            <span className="text-zinc-400 font-medium">Active Filters:</span>
            {selectedYear !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                Year: {selectedYear}
                <button type="button" onClick={() => setSelectedYear("ALL")}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedClass !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                Class: {selectedClass}
                <button type="button" onClick={() => setSelectedClass("ALL")}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedReason !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                Reason: {selectedReason}
                <button type="button" onClick={() => setSelectedReason("ALL")}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                Search: &ldquo;{searchQuery}&rdquo;
                <button type="button" onClick={() => setSearchQuery("")}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setSelectedYear("ALL");
                setSelectedClass("ALL");
                setSelectedReason("ALL");
                setSearchQuery("");
              }}
              className="text-xs text-zinc-500 hover:text-zinc-800 underline ml-1"
            >
              Reset All
            </button>
          </div>
        )}
      </div>

      {/* Main Roster Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs print:border-none print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-600 border-collapse">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-700 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Roll</th>
                <th className="py-3 px-4">Student Profile</th>
                <th className="py-3 px-4">Final Class & Batch</th>
                <th className="py-3 px-4">Archive Details</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Academic History</th>
                <th className="py-3 px-4 text-right print:hidden">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    <Archive className="h-8 w-8 mx-auto text-zinc-300 mb-2" />
                    <p className="font-medium text-zinc-600">No archived students found</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {initialStudents.length === 0
                        ? "No students have been archived yet."
                        : "Try adjusting your search query or filter selections."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const isExpanded = expandedStudentId === student.id;
                  const histories = student.academicHistories || [];

                  return (
                    <React.Fragment key={student.id}>
                      <tr className="hover:bg-zinc-50/70 transition-colors">
                        {/* Roll */}
                        <td className="py-3 px-4 font-bold text-zinc-900 tabular-nums">
                          <span className="bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded text-xs border border-zinc-200">
                            #{student.displayRoll}
                          </span>
                        </td>

                        {/* Student Name */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-zinc-900">{student.name}</div>
                          <div className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                            <span>F: {student.fatherName || "—"}</span>
                            <span>•</span>
                            <span>M: {student.motherName || "—"}</span>
                          </div>
                          {student.schoolName && student.schoolName !== "N/A" && (
                            <div className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                              <SchoolIcon className="h-3 w-3 text-zinc-400 shrink-0" />
                              <span className="truncate max-w-[180px]">{student.schoolName}</span>
                            </div>
                          )}
                        </td>

                        {/* Final Class & Batch */}
                        <td className="py-3 px-4">
                          <div className="font-medium text-zinc-800">Class {student.class}</div>
                          <div className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                            <Layers className="h-3 w-3 text-zinc-400 shrink-0" />
                            <span>{student.batchName}</span>
                          </div>
                        </td>

                        {/* Archive Details */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="font-semibold text-zinc-900">
                              Session {student.archivedYear || "—"}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide border ${
                                student.archivedReason?.includes("SSC")
                                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                  : student.archivedReason?.includes("Year-End")
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-zinc-100 text-zinc-700 border-zinc-200"
                              }`}
                            >
                              {student.archivedReason || "Archived"}
                            </span>
                            {student.archivedAt && (
                              <span className="text-[10px] text-zinc-400">
                                {new Date(student.archivedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Contact Info */}
                        <td className="py-3 px-4">
                          <div className="font-medium text-zinc-800 tabular-nums flex items-center gap-1">
                            <Phone className="h-3 w-3 text-zinc-400 shrink-0" />
                            <span>{student.mobile}</span>
                          </div>
                          {student.homeMobile && (
                            <div className="text-[10px] text-zinc-400 tabular-nums mt-0.5">
                              Home: {student.homeMobile}
                            </div>
                          )}
                        </td>

                        {/* Academic History */}
                        <td className="py-3 px-4">
                          {histories.length > 0 ? (
                            <div className="space-y-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedStudentId(isExpanded ? null : student.id)
                                }
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors print:hidden"
                              >
                                <History className="h-3 w-3" />
                                <span>{histories.length} Sessions Logged</span>
                                <ChevronDown
                                  className={`h-3 w-3 transition-transform ${
                                    isExpanded ? "rotate-180" : ""
                                  }`}
                                />
                              </button>
                              <div className="hidden print:block text-[10px] text-zinc-600">
                                {histories.map((h) => (
                                  <div key={h.id}>
                                    {h.year}: Class {h.class} (#{h.roll})
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <span className="text-zinc-400 text-[11px] italic">None recorded</span>
                          )}
                        </td>

                        {/* Action Column */}
                        <td className="py-3 px-4 text-right print:hidden">
                          <button
                            type="button"
                            onClick={() => handleOpenRestore(student)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg shadow-xs transition-colors"
                          >
                            <RotateCcw className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Restore</span>
                          </button>
                        </td>
                      </tr>

                      {/* Expanded History Sub-row */}
                      {isExpanded && histories.length > 0 && (
                        <tr className="bg-indigo-50/40 print:hidden">
                          <td colSpan={7} className="px-6 py-3 border-b border-indigo-100">
                            <div className="flex items-center gap-2 mb-2">
                              <History className="h-3.5 w-3.5 text-indigo-600" />
                              <span className="font-semibold text-zinc-900 text-xs">
                                Academic Progression Timeline for {student.name}:
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                              {histories.map((hist) => (
                                <div
                                  key={hist.id}
                                  className="bg-white p-2.5 rounded-lg border border-indigo-100 shadow-2xs text-xs"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-indigo-700">
                                      Academic Year {hist.year}
                                    </span>
                                    <span className="px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-700 text-[10px] font-mono">
                                      Roll #{hist.roll}
                                    </span>
                                  </div>
                                  <div className="text-zinc-700 mt-1">
                                    Class: <span className="font-semibold">{hist.class}</span>
                                  </div>
                                  <div className="text-[11px] text-zinc-500">
                                    Batch: {hist.batch?.name || "Unassigned"}
                                  </div>
                                  {hist.note && (
                                    <div className="text-[10px] text-zinc-400 mt-1 italic">
                                      Note: {hist.note}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restore Student Modal */}
      {restoreStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">Restore Student</h3>
                  <p className="text-xs text-zinc-500">
                    Reactivate student back to active enrollments
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRestoreStudent(null)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-zinc-500">Student:</span>
                <span className="font-semibold text-zinc-900">{restoreStudent.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Archived In:</span>
                <span className="font-medium text-zinc-800">
                  Session {restoreStudent.archivedYear || "—"} ({restoreStudent.archivedReason || "Archived"})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Previous Class:</span>
                <span className="font-medium text-zinc-800">Class {restoreStudent.class}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Previous Batch:</span>
                <span className="font-medium text-zinc-800">{restoreStudent.batchName}</span>
              </div>
            </div>

            {/* Target Batch Selection */}
            <div className="mt-4 space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-700">
                Assign To Active Batch:
              </label>
              <select
                value={targetBatchId}
                onChange={(e) => setTargetBatchId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              >
                <option value="">Keep Previous Batch ({restoreStudent.batchName})</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    Class {b.classId} — {b.name} (Code: {b.code})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-zinc-400">
                If a new batch is selected, the student will automatically receive the next roll number in that batch.
              </p>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRestoreStudent(null)}
                disabled={isRestoring}
                className="px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                {isRestoring ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Restoring...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Confirm Restore</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
