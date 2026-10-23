"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Users,
  Sparkles,
  Calendar,
  CheckSquare,
  Square,
  Search,
  Loader2,
  ShieldAlert,
  ArrowUpRight,
  Layers,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import {
  archiveClassTenYearEndAction,
  moveStudentsToSscBatchAction,
  archiveSscBatchAction,
} from "@/app/actions/archiving";

interface StudentItem {
  id: number;
  name: string;
  roll: number;
  displayRoll: number;
  mobile: string;
  gender: string;
  schoolName: string;
  batchName: string;
  isEnrolledInSscBatch: boolean;
}

interface SscBatchItem {
  id: number;
  name: string;
  code: number;
  programName: string;
  studentCount: number;
}

interface ClassTenLifecycleManagerProps {
  initialData: {
    year: number;
    totalRegularTen: number;
    sscBatches: SscBatchItem[];
    students: StudentItem[];
  };
}

export function ClassTenLifecycleManager({ initialData }: ClassTenLifecycleManagerProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"transition" | "archive_ten" | "archive_ssc">("transition");

  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [targetSscBatchId, setTargetSscBatchId] = useState<string>(
    initialData.sscBatches[0]?.id ? String(initialData.sscBatches[0].id) : ""
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [archiveReason, setArchiveReason] = useState(
    `Class Ten Year-End Archive / Non-SSC (${initialData.year})`
  );

  // Filter students
  const filteredStudents = initialData.students.filter((st) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      st.name.toLowerCase().includes(q) ||
      st.displayRoll.toString().includes(q) ||
      (st.mobile && st.mobile.includes(q)) ||
      st.schoolName.toLowerCase().includes(q);

    if (tab === "transition") {
      // In transition view, can show all or those not yet in SSC
      return matchesSearch;
    } else if (tab === "archive_ten") {
      // In year-end archive view, show students who are NOT in an SSC batch
      return matchesSearch && !st.isEnrolledInSscBatch;
    }
    return matchesSearch;
  });

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    }
  };

  const toggleStudent = (id: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Move students to SSC Batch
  const handleMoveToSsc = async () => {
    if (selectedStudentIds.length === 0) {
      toast.error("Please select at least one student");
      return;
    }
    if (!targetSscBatchId) {
      toast.error("Please select a target SSC Special Batch");
      return;
    }

    setSubmitting(true);
    try {
      const res = await moveStudentsToSscBatchAction(
        selectedStudentIds,
        parseInt(targetSscBatchId)
      );

      if (res.success) {
        toast.success(res.message);
        setSelectedStudentIds([]);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to move students");
      }
    } catch (err: any) {
      toast.error(err?.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  // Archive Class Ten non-SSC students
  const handleArchiveTen = async () => {
    if (selectedStudentIds.length === 0) {
      toast.error("Please select at least one student to archive");
      return;
    }

    if (!confirm(`Are you sure you want to archive ${selectedStudentIds.length} Class Ten students? Their records will be archived with reason '${archiveReason}' and removed from active rosters.`)) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await archiveClassTenYearEndAction(
        selectedStudentIds,
        initialData.year,
        archiveReason
      );

      if (res.success) {
        toast.success(res.message);
        setSelectedStudentIds([]);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to archive students");
      }
    } catch (err: any) {
      toast.error(err?.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  // Archive entire SSC batch
  const handleArchiveSscBatch = async (batchId: number, batchName: string) => {
    const reason = prompt(
      `Enter reason for archiving SSC batch '${batchName}':`,
      `Completed SSC Program & Board Exams (${initialData.year})`
    );
    if (!reason) return;

    setSubmitting(true);
    try {
      const res = await archiveSscBatchAction(batchId, reason);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to archive SSC batch");
      }
    } catch (err: any) {
      toast.error(err?.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const nonSscCount = initialData.students.filter((s) => !s.isEnrolledInSscBatch).length;
  const sscCount = initialData.students.filter((s) => s.isEnrolledInSscBatch).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Class Ten Lifecycle & Archiving
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
              Graduation & SSC Transition
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Manage November SSC special batch enrollments and year-end graduation archiving for Class Ten students.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin-route/students/archived"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-lg transition-colors shadow-2xs"
          >
            <Archive className="w-3.5 h-3.5 text-zinc-500" />
            <span>View Archived Directory</span>
          </Link>
          <Link
            href="/admin-route/promotion"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors shadow-2xs"
          >
            <span>Annual Promotion Wizard (Classes 6-9) &rarr;</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Total Class Ten Regulars
          </span>
          <p className="text-3xl font-extrabold text-zinc-900">{initialData.totalRegularTen}</p>
          <p className="text-xs text-zinc-500">Active regular Class 10 roster</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
            Enrolled in SSC Special Batch
          </span>
          <p className="text-3xl font-extrabold text-emerald-700">{sscCount}</p>
          <p className="text-xs text-zinc-500">Moved to SSC intensive test program</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
            Pending Year-End Archive
          </span>
          <p className="text-3xl font-extrabold text-amber-700">{nonSscCount}</p>
          <p className="text-xs text-zinc-500">Graduating students not joining SSC</p>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="border-b border-zinc-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setTab("transition");
              setSelectedStudentIds([]);
            }}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              tab === "transition"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>1. November SSC Transition</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-zinc-100 rounded-full text-zinc-600 font-mono">
              {initialData.students.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab("archive_ten");
              setSelectedStudentIds([]);
            }}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              tab === "archive_ten"
                ? "border-amber-600 text-amber-600"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>2. Year-End Archive (Non-SSC Class 10)</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 rounded-full text-amber-800 font-mono">
              {nonSscCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab("archive_ssc");
              setSelectedStudentIds([]);
            }}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              tab === "archive_ssc"
                ? "border-rose-600 text-rose-600"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>3. SSC Program Completion Archiving</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-rose-100 rounded-full text-rose-800 font-mono">
              {initialData.sscBatches.length} batches
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: November SSC Transition */}
      {/* ========================================================================= */}
      {tab === "transition" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold text-zinc-700">Target SSC Batch:</span>
              <select
                value={targetSscBatchId}
                onChange={(e) => setTargetSscBatchId(e.target.value)}
                className="px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {initialData.sscBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.programName}) · {b.studentCount} enrolled
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={selectedStudentIds.length === 0 || submitting}
                onClick={handleMoveToSsc}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition shadow-xs"
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Move Selected ({selectedStudentIds.length}) to SSC Batch</span>
              </button>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search Class 10 student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg outline-none"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">
                      <button type="button" onClick={toggleSelectAll} className="p-0.5">
                        {selectedStudentIds.length === filteredStudents.length &&
                        filteredStudents.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4 text-zinc-400" />
                        )}
                      </button>
                    </th>
                    <th className="py-2.5 px-4 w-28">Roll</th>
                    <th className="py-2.5 px-4">Student</th>
                    <th className="py-2.5 px-4">School</th>
                    <th className="py-2.5 px-4">Contact</th>
                    <th className="py-2.5 px-4">Current Batch</th>
                    <th className="py-2.5 px-4 text-right">SSC Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-zinc-400">
                        No Class Ten students found.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((st) => (
                      <tr
                        key={st.id}
                        onClick={() => toggleStudent(st.id)}
                        className={`hover:bg-zinc-50/70 transition cursor-pointer ${
                          selectedStudentIds.includes(st.id) ? "bg-indigo-50/30" : ""
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => toggleStudent(st.id)}
                            className="p-0.5"
                          >
                            {selectedStudentIds.includes(st.id) ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4 text-zinc-400" />
                            )}
                          </button>
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-zinc-900">
                          {st.displayRoll}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-zinc-900">
                          {st.name}
                          <span className="block text-[10px] font-normal text-zinc-400">
                            {st.gender}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-zinc-600 truncate max-w-[160px]">
                          {st.schoolName}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-zinc-600">
                          {st.mobile}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-zinc-700">
                          {st.batchName}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {st.isEnrolledInSscBatch ? (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              In SSC Batch
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                              Regular Only
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: Year-End Archive (Non-SSC Class 10) */}
      {/* ========================================================================= */}
      {tab === "archive_ten" && (
        <div className="space-y-4">
          <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
            <p className="font-bold">Year-End Class Ten Graduation Policy:</p>
            <p>
              Every Class Ten student who did not join the SSC special batch is archived at year end. Their historical records stay permanently preserved and can be viewed or printed in the Archived Students Directory, and restored at any time.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 flex-wrap">
              <input
                type="text"
                placeholder="Archive reason note..."
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                className="px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 min-w-[280px]"
              />

              <button
                type="button"
                disabled={selectedStudentIds.length === 0 || submitting}
                onClick={handleArchiveTen}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg transition shadow-xs"
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Archive className="w-3.5 h-3.5" />
                )}
                <span>Archive Selected Non-SSC ({selectedStudentIds.length})</span>
              </button>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg outline-none"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">
                      <button type="button" onClick={toggleSelectAll} className="p-0.5">
                        {selectedStudentIds.length === filteredStudents.length &&
                        filteredStudents.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-amber-600" />
                        ) : (
                          <Square className="w-4 h-4 text-zinc-400" />
                        )}
                      </button>
                    </th>
                    <th className="py-2.5 px-4 w-28">Roll</th>
                    <th className="py-2.5 px-4">Student</th>
                    <th className="py-2.5 px-4">School</th>
                    <th className="py-2.5 px-4">Contact</th>
                    <th className="py-2.5 px-4">Batch</th>
                    <th className="py-2.5 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-zinc-400">
                        No pending Class Ten non-SSC students found.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((st) => (
                      <tr
                        key={st.id}
                        onClick={() => toggleStudent(st.id)}
                        className={`hover:bg-zinc-50/70 transition cursor-pointer ${
                          selectedStudentIds.includes(st.id) ? "bg-amber-50/30" : ""
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => toggleStudent(st.id)}
                            className="p-0.5"
                          >
                            {selectedStudentIds.includes(st.id) ? (
                              <CheckSquare className="w-4 h-4 text-amber-600" />
                            ) : (
                              <Square className="w-4 h-4 text-zinc-400" />
                            )}
                          </button>
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-zinc-900">
                          {st.displayRoll}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-zinc-900">
                          {st.name}
                        </td>
                        <td className="py-2.5 px-4 text-zinc-600 truncate max-w-[160px]">
                          {st.schoolName}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-zinc-600">
                          {st.mobile}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-zinc-700">
                          {st.batchName}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            Pending Archive
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SSC Program Completion Archiving */}
      {/* ========================================================================= */}
      {tab === "archive_ssc" && (
        <div className="space-y-4">
          <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 text-xs text-zinc-600 space-y-1">
            <p className="font-bold text-zinc-800">SSC Program Completion Archiving:</p>
            <p>
              When an SSC special batch completes its final model tests and board exams, staff can archive the entire batch at once. All marks and course payment records remain fully preserved and printable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {initialData.sscBatches.map((b) => (
              <div
                key={b.id}
                className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-md">
                      Batch Code: {b.code}
                    </span>
                    <span className="text-xs font-bold text-zinc-900 bg-zinc-100 px-2.5 py-1 rounded-full">
                      {b.studentCount} Students
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 mt-2">{b.name}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">{b.programName}</p>
                </div>

                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                  <Link
                    href={`/admin-route/special-batch/batches/${b.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    View Batch Workspace &rarr;
                  </Link>

                  <button
                    type="button"
                    disabled={b.studentCount === 0 || submitting}
                    onClick={() => handleArchiveSscBatch(b.id, b.name)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg disabled:opacity-50 transition"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Archive Batch Students</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
