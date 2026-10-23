// app/teacher-route/marks/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { saveMarkAction, bulkSaveMarksAction } from "@/app/actions/marks";
import { getTeacherAssignedSpecialExamsAction } from "@/app/actions/special-exams";
import { generateDisplayRoll } from "@/lib/roll";
import {
  GraduationCap,
  Sparkles,
  Calendar,
  User,
  Search,
  Lock,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  Award,
  ChevronRight,
  Layers,
  Keyboard,
} from "lucide-react";

interface RegularSubject {
  id: number;
  subject: string;
  totalMark: number;
  examDate: string;
  exam: {
    id: number;
    type: string;
    month: string;
    class: string;
  };
}

interface Student {
  id: number;
  name: string;
  roll: number;
  class: string;
  batch: { id: number; code: number; name: string };
}

interface MarkEntry {
  studentId: number;
  written: string;
  objective: string;
  hasExistingMark: boolean;
  isDirty: boolean;
  isSaved: boolean;
}

export default function TeacherMarksEntryPage() {
  const [activeTab, setActiveTab] = useState<"regular" | "special">("regular");

  // Regular exam state
  const [assignedSubjects, setAssignedSubjects] = useState<RegularSubject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [entries, setEntries] = useState<Record<number, MarkEntry>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [savingSingle, setSavingSingle] = useState<number | null>(null);
  const [bulkSaving, setBulkSaving] = useState(false);

  // Special batch exam state
  const [specialSubjects, setSpecialSubjects] = useState<any[]>([]);
  const [loadingSpecial, setLoadingSpecial] = useState(true);

  // Keyboard navigation refs
  const cellRefs = useRef<Array<Array<HTMLInputElement | null>>>([]);

  // 1. Fetch assigned regular & special exam subjects on mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [regRes, specRes] = await Promise.all([
          fetch("/api/teacher/results")
            .then((r) => r.json())
            .catch(() => []),
          getTeacherAssignedSpecialExamsAction(),
        ]);

        if (Array.isArray(regRes)) {
          const subjectsList: RegularSubject[] = regRes.map((item: any) => ({
            id: item.id,
            subject: item.subject,
            totalMark: item.totalMark,
            examDate: item.examDate,
            exam: item.exam,
          }));
          setAssignedSubjects(subjectsList);
          if (subjectsList.length > 0) {
            setSelectedSubjectId(subjectsList[0].id);
          }
        }

        if (specRes.success && Array.isArray(specRes.data)) {
          setSpecialSubjects(specRes.data);
        }
      } catch (err) {
        console.error("Error loading assigned exams:", err);
        toast.error("Failed to load your assigned exam subjects");
      } finally {
        setLoadingSubjects(false);
        setLoadingSpecial(false);
      }
    }

    loadInitialData();
  }, []);

  // 2. When selected regular subject changes, fetch students & existing marks
  useEffect(() => {
    if (!selectedSubjectId) {
      setStudents([]);
      setEntries({});
      return;
    }

    async function loadSubjectData() {
      setLoadingStudents(true);
      try {
        const res = await fetch(`/api/marks/exam-subject/${selectedSubjectId}`);
        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to load marks");
        }

        const studentList: Student[] = data.students || [];
        setStudents(studentList);

        const initial: Record<number, MarkEntry> = {};
        studentList.forEach((s) => {
          const existing = data.marksMap?.[s.id];
          const hasExistingMark = !!existing;

          initial[s.id] = {
            studentId: s.id,
            written: existing ? String(existing.written) : "",
            objective: existing ? String(existing.objective) : "",
            hasExistingMark,
            isDirty: false,
            isSaved: hasExistingMark,
          };
        });

        setEntries(initial);
      } catch (err: any) {
        console.error("Error loading students:", err);
        toast.error(err.message || "Failed to load students for this subject");
      } finally {
        setLoadingStudents(false);
      }
    }

    loadSubjectData();
  }, [selectedSubjectId]);

  const selectedSubject = useMemo(
    () => assignedSubjects.find((s) => s.id === selectedSubjectId),
    [assignedSubjects, selectedSubjectId]
  );

  // Update entry field
  const updateField = useCallback(
    (studentId: number, field: "written" | "objective", value: string) => {
      if (value !== "" && !/^\d*\.?\d*$/.test(value)) return;
      if (entries[studentId]?.hasExistingMark) return;

      const numVal = parseFloat(value) || 0;
      const maxLimit = selectedSubject?.totalMark || 100;
      if (numVal > maxLimit) {
        toast.error(`Value cannot exceed total subject marks (${maxLimit})`);
        return;
      }

      setEntries((prev) => {
        const current = prev[studentId];
        if (!current || current.hasExistingMark) return prev;
        return {
          ...prev,
          [studentId]: {
            ...current,
            [field]: value,
            isDirty: true,
          },
        };
      });
    },
    [entries, selectedSubject]
  );

  // Single save
  const handleSaveSingle = async (studentId: number) => {
    const entry = entries[studentId];
    if (!entry || !entry.isDirty || entry.hasExistingMark || !selectedSubjectId) return;

    setSavingSingle(studentId);
    try {
      const res = await saveMarkAction({
        examSubjectId: selectedSubjectId,
        studentId,
        written: entry.written ? parseFloat(entry.written) : 0,
        objective: entry.objective ? parseFloat(entry.objective) : 0,
      });

      if (res.success) {
        toast.success("Mark recorded successfully");
        setEntries((prev) => ({
          ...prev,
          [studentId]: {
            ...prev[studentId],
            isDirty: false,
            hasExistingMark: true,
            isSaved: true,
          },
        }));
      } else {
        toast.error(res.error || "Failed to save mark");
      }
    } catch (err) {
      console.error("Save single error:", err);
      toast.error("Error saving mark");
    } finally {
      setSavingSingle(null);
    }
  };

  // Bulk save pending marks
  const handleSaveAll = async () => {
    if (!selectedSubjectId) return;

    const dirtyList = Object.values(entries).filter(
      (e) => e.isDirty && !e.hasExistingMark
    );

    if (dirtyList.length === 0) {
      toast.info("No unsaved pending marks");
      return;
    }

    setBulkSaving(true);
    try {
      const payload = dirtyList.map((e) => ({
        examSubjectId: selectedSubjectId,
        studentId: e.studentId,
        written: e.written ? parseFloat(e.written) : 0,
        objective: e.objective ? parseFloat(e.objective) : 0,
      }));

      const res = await bulkSaveMarksAction(payload);
      if (res.success) {
        toast.success(`Successfully saved ${dirtyList.length} marks`);
        setEntries((prev) => {
          const updated = { ...prev };
          dirtyList.forEach((d) => {
            if (updated[d.studentId]) {
              updated[d.studentId] = {
                ...updated[d.studentId],
                isDirty: false,
                hasExistingMark: true,
                isSaved: true,
              };
            }
          });
          return updated;
        });
      } else {
        toast.error(res.error || "Failed to save marks");
      }
    } catch (err) {
      console.error("Bulk save error:", err);
      toast.error("Error saving marks");
    } finally {
      setBulkSaving(false);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    colIndex: number,
    studentId: number
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveSingle(studentId);
      const nextRow = rowIndex + 1;
      if (nextRow < filteredStudents.length) {
        cellRefs.current[nextRow]?.[colIndex]?.focus();
        cellRefs.current[nextRow]?.[colIndex]?.select();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextRow = rowIndex + 1;
      if (nextRow < filteredStudents.length) {
        cellRefs.current[nextRow]?.[colIndex]?.focus();
        cellRefs.current[nextRow]?.[colIndex]?.select();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevRow = rowIndex - 1;
      if (prevRow >= 0) {
        cellRefs.current[prevRow]?.[colIndex]?.focus();
        cellRefs.current[prevRow]?.[colIndex]?.select();
      }
    } else if (e.key === "ArrowRight") {
      const input = e.currentTarget;
      if (input.selectionStart === input.value.length && colIndex === 0) {
        cellRefs.current[rowIndex]?.[1]?.focus();
        cellRefs.current[rowIndex]?.[1]?.select();
      }
    } else if (e.key === "ArrowLeft") {
      const input = e.currentTarget;
      if (input.selectionStart === 0 && colIndex === 1) {
        cellRefs.current[rowIndex]?.[0]?.focus();
        cellRefs.current[rowIndex]?.[0]?.select();
      }
    }
  };

  // Filter students
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter((s) => {
      const batchCode = s.batch?.code || 0;
      const displayRoll = String(batchCode ? batchCode * 100 + s.roll : s.roll);
      return (
        s.name.toLowerCase().includes(q) ||
        displayRoll.includes(q) ||
        String(s.roll).includes(q) ||
        s.batch?.name?.toLowerCase().includes(q)
      );
    });
  }, [students, searchQuery]);

  const dirtyCount = Object.values(entries).filter(
    (e) => e.isDirty && !e.hasExistingMark
  ).length;

  const recordedCount = Object.values(entries).filter(
    (e) => e.hasExistingMark || e.isSaved
  ).length;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
              <GraduationCap className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold text-zinc-900">Marks Entry</h1>
          </div>
          <p className="text-xs text-zinc-500">
            Enter marks for your assigned exams. Existing marks are locked and cannot be edited.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("regular")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === "regular"
                ? "bg-white text-zinc-900 shadow-2xs font-bold"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Calendar className="h-3.5 w-3.5 text-zinc-500" />
            Regular Exams ({assignedSubjects.length})
          </button>
          <button
            onClick={() => setActiveTab("special")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === "special"
                ? "bg-white text-zinc-900 shadow-2xs font-bold"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            Special Batch ({specialSubjects.length})
          </button>
        </div>
      </div>

      {/* REGULAR EXAMS TAB */}
      {activeTab === "regular" && (
        <div className="space-y-4">
          {/* Subject Selector Bar */}
          <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-2xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
                <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider shrink-0">
                  Select Subject:
                </label>
                {loadingSubjects ? (
                  <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading assigned subjects...
                  </span>
                ) : assignedSubjects.length === 0 ? (
                  <span className="text-xs text-amber-600 font-medium">
                    No regular exam subjects assigned to you.
                  </span>
                ) : (
                  <select
                    value={selectedSubjectId || ""}
                    onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
                    className="w-full sm:max-w-md px-3 py-2 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {assignedSubjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.subject} — {sub.exam.type} ({sub.exam.month}) · Class {sub.exam.class} · Max: {sub.totalMark}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedSubject && (
                <div className="flex items-center gap-2">
                  <Link
                    href={`/teacher-route/results/${selectedSubject.exam.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition"
                  >
                    <Award className="h-3.5 w-3.5" /> View Merit List
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Teacher Policy Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Teacher Entry Policy:</strong> You can enter marks for students with unrecorded marks. Once saved, marks are locked and cannot be edited by teachers (please contact Staff or Admin for revisions).
            </span>
          </div>

          {/* Table Container */}
          {selectedSubject && (
            <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden">
              {/* Table Toolbar */}
              <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-900">{selectedSubject.subject}</span>
                  <span className="text-zinc-300">·</span>
                  <span className="text-zinc-500">{filteredStudents.length} Students</span>
                  <span className="text-zinc-300">·</span>
                  <span className="text-emerald-700 font-semibold">{recordedCount} Recorded</span>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search name or roll..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto max-h-[580px]">
                {loadingStudents ? (
                  <div className="p-12 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                    <span>Loading student marks...</span>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="p-12 text-center text-xs text-zinc-500">
                    No students found.
                  </div>
                ) : (
                  <table className="w-full border-collapse text-left text-xs">
                    <thead className="sticky top-0 bg-zinc-100/90 backdrop-blur-xs border-b border-zinc-200 z-10 text-[11px] font-bold text-zinc-600 uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">#</th>
                        <th className="py-2.5 px-3 w-28">Roll</th>
                        <th className="py-2.5 px-3">Student Name</th>
                        <th className="py-2.5 px-3 w-28">Batch</th>
                        <th className="py-2.5 px-3 w-28 text-center">Written</th>
                        <th className="py-2.5 px-3 w-28 text-center">Objective</th>
                        <th className="py-2.5 px-3 w-24 text-center">Total</th>
                        <th className="py-2.5 px-3 w-28 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredStudents.map((student, rowIndex) => {
                        const entry = entries[student.id] || {
                          studentId: student.id,
                          written: "",
                          objective: "",
                          hasExistingMark: false,
                          isDirty: false,
                          isSaved: false,
                        };

                        const writtenNum = parseFloat(entry.written) || 0;
                        const objNum = parseFloat(entry.objective) || 0;
                        const total = writtenNum + objNum;
                        const isLocked = entry.hasExistingMark;
                        const isSavingRow = savingSingle === student.id;

                        if (!cellRefs.current[rowIndex]) {
                          cellRefs.current[rowIndex] = [];
                        }

                        return (
                          <tr
                            key={student.id}
                            className={`hover:bg-zinc-50/70 transition-colors ${
                              isLocked
                                ? "bg-zinc-50/50"
                                : entry.isDirty
                                ? "bg-indigo-50/20"
                                : ""
                            }`}
                          >
                            <td className="py-2 px-3 text-center text-zinc-400 tabular-nums">
                              {rowIndex + 1}
                            </td>

                            <td className="py-2 px-3 font-semibold text-zinc-800 tabular-nums">
                              <span className="font-bold text-xs text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded">
                                {generateDisplayRoll(student.batch.code, student.roll)}
                              </span>
                            </td>

                            <td className="py-2 px-3 font-semibold text-zinc-900">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate">{student.name}</span>
                                {entry.isDirty && !isLocked && (
                                  <span
                                    className="h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0"
                                    title="Unsaved changes"
                                  />
                                )}
                              </div>
                            </td>

                            <td className="py-2 px-3 text-zinc-500">
                              {student.batch.name}
                            </td>

                            {/* Written Input */}
                            <td className="py-1.5 px-2 text-center">
                              <input
                                ref={(el) => {
                                  cellRefs.current[rowIndex][0] = el;
                                }}
                                type="text"
                                disabled={isLocked || isSavingRow}
                                placeholder="—"
                                value={entry.written}
                                onChange={(e) => updateField(student.id, "written", e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, rowIndex, 0, student.id)}
                                className={`w-20 py-1 text-center font-bold text-xs rounded-lg border tabular-nums transition-colors outline-none ${
                                  isLocked
                                    ? "bg-zinc-100 text-zinc-500 border-zinc-200 cursor-not-allowed font-medium"
                                    : entry.isDirty
                                    ? "border-indigo-400 bg-white text-indigo-900 ring-1 ring-indigo-200"
                                    : "border-zinc-200 bg-zinc-50/70 hover:bg-white text-zinc-900"
                                }`}
                              />
                            </td>

                            {/* Objective Input */}
                            <td className="py-1.5 px-2 text-center">
                              <input
                                ref={(el) => {
                                  cellRefs.current[rowIndex][1] = el;
                                }}
                                type="text"
                                disabled={isLocked || isSavingRow}
                                placeholder="—"
                                value={entry.objective}
                                onChange={(e) => updateField(student.id, "objective", e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, rowIndex, 1, student.id)}
                                className={`w-20 py-1 text-center font-bold text-xs rounded-lg border tabular-nums transition-colors outline-none ${
                                  isLocked
                                    ? "bg-zinc-100 text-zinc-500 border-zinc-200 cursor-not-allowed font-medium"
                                    : entry.isDirty
                                    ? "border-indigo-400 bg-white text-indigo-900 ring-1 ring-indigo-200"
                                    : "border-zinc-200 bg-zinc-50/70 hover:bg-white text-zinc-900"
                                }`}
                              />
                            </td>

                            {/* Total */}
                            <td className="py-2 px-3 text-center font-bold tabular-nums text-zinc-900">
                              {total > 0 ? total : "—"}
                            </td>

                            {/* Status */}
                            <td className="py-2 px-3 text-center">
                              {isSavingRow ? (
                                <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600 font-semibold">
                                  <Loader2 className="h-3 w-3 animate-spin" /> Saving...
                                </span>
                              ) : isLocked ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                                  <Lock className="h-3 w-3 text-zinc-400" /> Locked
                                </span>
                              ) : entry.isDirty ? (
                                <button
                                  type="button"
                                  onClick={() => handleSaveSingle(student.id)}
                                  className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-semibold transition"
                                >
                                  Save
                                </button>
                              ) : (
                                <span className="text-[11px] text-zinc-400 font-medium">Pending</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Table Footer */}
              <div className="p-3 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500">
                <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-zinc-400">
                  <Keyboard className="h-3.5 w-3.5" />
                  <span>Enter to save row · Arrows to navigate cells</span>
                </div>

                {dirtyCount > 0 && (
                  <button
                    onClick={handleSaveAll}
                    disabled={bulkSaving}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition disabled:opacity-50"
                  >
                    {bulkSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    <span>Save {dirtyCount} Pending Marks</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SPECIAL BATCH EXAMS TAB */}
      {activeTab === "special" && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Special Batch Entry Policy:</strong> You can enter marks for your assigned special subjects. Recorded marks are locked. Select any assigned exam below to open the marks entry sheet.
            </span>
          </div>

          {loadingSpecial ? (
            <div className="p-12 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              <span>Loading your assigned special exams...</span>
            </div>
          ) : specialSubjects.length === 0 ? (
            <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
              <Sparkles className="h-10 w-10 text-zinc-300 mx-auto mb-2" />
              <p className="text-zinc-600 font-semibold text-sm">No special exams assigned to you</p>
              <p className="text-xs text-zinc-400 mt-1">
                You will see special exams here when admin or staff assigns your subjects.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {specialSubjects.map((item: any) => {
                const exam = item.exam;
                const subject = item.programSubject;
                return (
                  <div
                    key={item.id}
                    className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs hover:border-indigo-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-zinc-900 text-base">{exam?.title}</h3>
                          {exam?.kind && (
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[10px] font-bold uppercase tracking-wider">
                              {exam.kind.replace("_", " ")}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-zinc-500">
                          {exam?.program && (
                            <div className="flex items-center gap-1">
                              <Layers className="h-3.5 w-3.5 text-zinc-400" />
                              <span>{exam.program.name}</span>
                            </div>
                          )}
                          {exam?.batch && (
                            <div className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5 text-zinc-400" />
                              <span>{exam.batch.name}</span>
                            </div>
                          )}
                          {exam?.examDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                              <span>{new Date(exam.examDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold">
                            Subject: {subject?.name || "Assigned Subject"}
                          </span>
                          <span className="px-2.5 py-0.5 bg-zinc-100 text-zinc-700 rounded-full font-medium">
                            Max: {item.totalMax}
                          </span>
                          {item._count?.marks !== undefined && (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-semibold flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              {item._count.marks} Recorded
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/teacher-route/exams/special/${exam?.id}/marks`}
                        className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition"
                      >
                        <GraduationCap className="h-4 w-4" />
                        Enter Marks
                      </Link>
                      <Link
                        href={`/teacher-route/results/special/${exam?.id}`}
                        className="inline-flex items-center gap-1 px-3 py-2 bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-50 rounded-xl text-xs font-semibold shadow-2xs transition"
                      >
                        <Award className="h-4 w-4 text-zinc-500" />
                        Results
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
