// app/admin-route/marks/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { toast } from "sonner";
import { saveMarkAction, bulkSaveMarksAction } from "@/app/actions/marks";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  UserX,
  Keyboard,
  ArrowUpDown,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton-loaders";
import { generateDisplayRoll } from "@/lib/roll";

interface Student {
  id: number;
  name: string;
  roll: number;
  class: string;
  batch: { id: number; code: number; name: string };
}

interface ExamSubject {
  id: number;
  subject: string;
  totalMark: number;
  teacherId: number;
  exam: {
    id: number;
    type: string;
    month: string;
    class: string;
  };
}

interface MarkEntry {
  studentId: number;
  written: string;
  objective: string;
  isAbsent: boolean;
  hasExistingMark: boolean;
  isDirty: boolean;
}

export default function BulkMarksEntryPage() {
  const [exams, setExams] = useState<ExamSubject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState<Record<number, MarkEntry>>({});

  // Filters
  const [filterMonth, setFilterMonth] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);

  // Keyboard navigation refs: grid of [rowIndex][colIndex]
  // Col 0: Written, Col 1: Objective
  const cellRefs = useRef<Array<Array<HTMLInputElement | null>>>([]);

  // 🔹 Fetch exams on mount (Single query with embedded subjects)
  useEffect(() => {
    async function fetchExams() {
      try {
        const res = await fetch("/api/exams");
        const data = await res.json();

        const allSubjects: ExamSubject[] = [];
        if (Array.isArray(data)) {
          for (const exam of data) {
            if (exam.subjects) {
              allSubjects.push(
                ...exam.subjects.map((s: any) => ({
                  ...s,
                  exam: {
                    id: exam.id,
                    type: exam.type,
                    month: exam.month,
                    class: exam.class,
                  },
                }))
              );
            }
          }
        }
        setExams(allSubjects);

        // Auto-select first available subject if none selected
        if (allSubjects.length > 0 && !selectedSubjectId) {
          setSelectedSubjectId(allSubjects[0].id);
        }
      } catch (error) {
        console.error("Error fetching exams:", error);
        toast.error("Failed to load exams list");
      } finally {
        setLoading(false);
      }
    }
    fetchExams();
  }, []);

  // Filter unique months and classes
  const uniqueMonths = useMemo(() => {
    const months = new Set(exams.map((e) => e.exam.month));
    return Array.from(months);
  }, [exams]);

  const uniqueClasses = useMemo(() => {
    const classes = new Set(exams.map((e) => e.exam.class));
    return Array.from(classes).sort();
  }, [exams]);

  const filteredSubjects = useMemo(() => {
    return exams.filter((sub) => {
      const monthMatch = !filterMonth || sub.exam.month === filterMonth;
      const classMatch = !filterClass || sub.exam.class === filterClass;
      return monthMatch && classMatch;
    });
  }, [exams, filterMonth, filterClass]);

  // Selected subject metadata
  const selectedSubject = useMemo(
    () => exams.find((e) => e.id === selectedSubjectId),
    [exams, selectedSubjectId]
  );

  // 🔹 When subject changes, fetch students & marks map
  useEffect(() => {
    if (!selectedSubjectId) {
      setStudents([]);
      setEntries({});
      return;
    }

    async function fetchMarksData() {
      setStudentsLoading(true);
      try {
        const res = await fetch(`/api/marks/exam-subject/${selectedSubjectId}`);
        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to load marks");
        }

        const studentList: Student[] = data.students || [];
        setStudents(studentList);

        // Initialize grid entries
        const initial: Record<number, MarkEntry> = {};
        studentList.forEach((s) => {
          const existing = data.marksMap?.[s.id];
          const isAbsent = existing ? existing.written === 0 && existing.objective === 0 && existing.absent : false;

          initial[s.id] = {
            studentId: s.id,
            written: existing ? (existing.written === 0 && isAbsent ? "" : existing.written.toString()) : "",
            objective: existing ? (existing.objective === 0 && isAbsent ? "" : existing.objective.toString()) : "",
            isAbsent,
            hasExistingMark: !!existing,
            isDirty: false,
          };
        });
        setEntries(initial);
      } catch (error) {
        console.error("Error loading marks:", error);
        toast.error("Failed to load students for this subject");
      } finally {
        setStudentsLoading(false);
      }
    }

    fetchMarksData();
  }, [selectedSubjectId]);

  // Filter students by local search
  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.roll.toString().includes(q) ||
        s.batch?.name.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  // Reset cell refs when filtered students change
  cellRefs.current = filteredStudents.map(() => [null, null]);

  // 🔹 Update marks entry with validation
  const updateEntry = useCallback(
    (studentId: number, field: "written" | "objective", value: string) => {
      // Allow only numbers and decimals
      if (value !== "" && !/^\d*\.?\d*$/.test(value)) return;

      const numVal = parseFloat(value) || 0;
      const maxMark = selectedSubject?.totalMark || 100;

      if (numVal > maxMark) {
        toast.error(`Value cannot exceed total marks (${maxMark})`);
        return;
      }

      setEntries((prev) => {
        const current = prev[studentId] || {
          studentId,
          written: "",
          objective: "",
          isAbsent: false,
          hasExistingMark: false,
          isDirty: false,
        };

        return {
          ...prev,
          [studentId]: {
            ...current,
            [field]: value,
            isAbsent: false, // Entering marks clears absent
            isDirty: true,
          },
        };
      });
    },
    [selectedSubject]
  );

  // 🔹 Toggle Absent for student
  const toggleAbsent = useCallback((studentId: number) => {
    setEntries((prev) => {
      const current = prev[studentId];
      if (!current) return prev;

      const nextAbsent = !current.isAbsent;
      return {
        ...prev,
        [studentId]: {
          ...current,
          isAbsent: nextAbsent,
          written: nextAbsent ? "0" : current.written === "0" ? "" : current.written,
          objective: nextAbsent ? "0" : current.objective === "0" ? "" : current.objective,
          isDirty: true,
        },
      };
    });
  }, []);

  // 🔹 Keyboard Spreadsheet navigation handler
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    colIndex: number,
    studentId: number
  ) => {
    // Arrow Down or Enter: Move to next row
    if (e.key === "ArrowDown" || e.key === "Enter") {
      e.preventDefault();
      const nextRow = rowIndex + 1;
      if (nextRow < filteredStudents.length) {
        cellRefs.current[nextRow]?.[colIndex]?.focus();
        cellRefs.current[nextRow]?.[colIndex]?.select();
      }
    }
    // Arrow Up: Move to previous row
    else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevRow = rowIndex - 1;
      if (prevRow >= 0) {
        cellRefs.current[prevRow]?.[colIndex]?.focus();
        cellRefs.current[prevRow]?.[colIndex]?.select();
      }
    }
    // Arrow Right: Move to objective column if on written
    else if (e.key === "ArrowRight" && colIndex === 0) {
      const input = e.currentTarget;
      if (input.selectionStart === input.value.length) {
        e.preventDefault();
        cellRefs.current[rowIndex]?.[1]?.focus();
        cellRefs.current[rowIndex]?.[1]?.select();
      }
    }
    // Arrow Left: Move to written column if on objective
    else if (e.key === "ArrowLeft" && colIndex === 1) {
      const input = e.currentTarget;
      if (input.selectionStart === 0) {
        e.preventDefault();
        cellRefs.current[rowIndex]?.[0]?.focus();
        cellRefs.current[rowIndex]?.[0]?.select();
      }
    }
    // 'a' or 'A': Toggle absent
    else if (e.key === "a" || e.key === "A") {
      if (e.currentTarget.value === "") {
        e.preventDefault();
        toggleAbsent(studentId);
      }
    }
  };

  // 🔹 Save all dirty marks
  const handleSaveAll = async () => {
    if (!selectedSubjectId) return;

    const dirtyEntries = Object.values(entries)
      .filter((e) => e.isDirty)
      .map((e) => ({
        examSubjectId: selectedSubjectId,
        studentId: e.studentId,
        written: e.written ? parseFloat(e.written) : 0,
        objective: e.objective ? parseFloat(e.objective) : 0,
      }));

    if (dirtyEntries.length === 0) {
      toast.info("No unsaved changes to commit");
      return;
    }

    setSaving(true);
    try {
      const result = await bulkSaveMarksAction(dirtyEntries);
      if (result.success) {
        setEntries((prev) => {
          const updated = { ...prev };
          dirtyEntries.forEach((d) => {
            if (updated[d.studentId]) {
              updated[d.studentId] = {
                ...updated[d.studentId],
                isDirty: false,
                hasExistingMark: true,
              };
            }
          });
          return updated;
        });
        toast.success(`Successfully saved marks for ${dirtyEntries.length} students`);
      } else {
        toast.error(result.error || "Failed to save marks");
      }
    } catch (error) {
      console.error("Save marks error:", error);
      toast.error("Database error saving marks");
    } finally {
      setSaving(false);
    }
  };

  // Global hotkey: Cmd+S / Ctrl+S to save marks
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSaveAll();
      }
    }
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  });

  // Calculate statistics
  const totalStudents = students.length;
  const totalEntered = Object.values(entries).filter(
    (e) => (e.hasExistingMark || e.isDirty) && (e.written !== "" || e.objective !== "" || e.isAbsent)
  ).length;
  const totalDirty = Object.values(entries).filter((e) => e.isDirty).length;
  const progressPercent = totalStudents > 0 ? Math.round((totalEntered / totalStudents) * 100) : 0;

  return (
    <div className="space-y-4 pb-20">
      <PageHeader
        title="Marks Entry Spreadsheet"
        description="Keyboard-accelerated grid for rapid written and objective score entry."
      >
        <button
          onClick={handleSaveAll}
          disabled={saving || totalDirty === 0}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors focus-ring"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          <span>Save Changes ({totalDirty})</span>
        </button>
      </PageHeader>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-zinc-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap flex-1">
          {/* Month selector */}
          <select
            value={filterMonth}
            onChange={(e) => {
              setFilterMonth(e.target.value);
            }}
            className="px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 outline-none focus-ring"
          >
            <option value="">All Months</option>
            {uniqueMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Class selector */}
          <select
            value={filterClass}
            onChange={(e) => {
              setFilterClass(e.target.value);
            }}
            className="px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 outline-none focus-ring"
          >
            <option value="">All Classes</option>
            {uniqueClasses.map((c) => (
              <option key={c} value={c}>
                Class {c}
              </option>
            ))}
          </select>

          {/* Subject selector */}
          <select
            value={selectedSubjectId || ""}
            onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
            className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg outline-none focus-ring flex-1 max-w-sm"
          >
            {filteredSubjects.length === 0 ? (
              <option value="">No subjects found for selection</option>
            ) : (
              filteredSubjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.subject} · Class {sub.exam.class} ({sub.exam.month}) · Max: {sub.totalMark}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Search within subject */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search student or roll..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg outline-none text-zinc-900 focus-ring"
          />
        </div>
      </div>

      {/* Main Grid View */}
      {studentsLoading ? (
        <SkeletonTable rows={10} cols={6} />
      ) : filteredStudents.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title="No Students Available"
          description={
            selectedSubjectId
              ? "No enrolled students found matching the selected class and subject."
              : "Please select an exam subject above to open the marks entry spreadsheet."
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
          {/* Header strip with subject metadata */}
          <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between text-xs text-zinc-600">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-zinc-900">
                {selectedSubject?.subject} (Class {selectedSubject?.exam.class})
              </span>
              <span className="text-zinc-300">·</span>
              <span>Total Marks: <strong className="text-zinc-900 tabular-nums">{selectedSubject?.totalMark}</strong></span>
              <span className="text-zinc-300">·</span>
              <span>Month: {selectedSubject?.exam.month}</span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-zinc-400">
              <Keyboard className="h-3.5 w-3.5" />
              <span>Use Enter or Arrow keys to move cells</span>
            </div>
          </div>

          {/* Spreadsheet Table */}
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead className="sticky top-0 bg-zinc-50 border-b border-zinc-200 z-10 select-none text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4 w-12 text-center">#</th>
                  <th className="py-2.5 px-4 w-28">Roll</th>
                  <th className="py-2.5 px-4">Student Name</th>
                  <th className="py-2.5 px-4 w-28 text-center">Batch</th>
                  <th className="py-2.5 px-4 w-32 text-center">Written</th>
                  <th className="py-2.5 px-4 w-32 text-center">Objective</th>
                  <th className="py-2.5 px-4 w-24 text-center">Total</th>
                  <th className="py-2.5 px-4 w-24 text-center">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-100">
                {filteredStudents.map((student, rowIndex) => {
                  const entry = entries[student.id] || {
                    studentId: student.id,
                    written: "",
                    objective: "",
                    isAbsent: false,
                    hasExistingMark: false,
                    isDirty: false,
                  };

                  const writtenNum = parseFloat(entry.written) || 0;
                  const objectiveNum = parseFloat(entry.objective) || 0;
                  const total = writtenNum + objectiveNum;
                  const isOverMax = selectedSubject && total > selectedSubject.totalMark;

                  const displayRoll = student.batch?.code
                    ? generateDisplayRoll(student.batch.code, student.roll)
                    : student.roll;

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-zinc-50/70 transition-colors ${
                        entry.isAbsent ? "bg-rose-50/30" : entry.isDirty ? "bg-indigo-50/20" : ""
                      }`}
                    >
                      {/* Row Index */}
                      <td className="py-2 px-4 text-center text-xs text-zinc-400 tabular-nums">
                        {rowIndex + 1}
                      </td>

                      {/* Display Roll */}
                      <td className="py-2 px-4">
                        <span className="font-semibold text-xs text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded tabular-nums">
                          {displayRoll}
                        </span>
                      </td>

                      {/* Student Name */}
                      <td className="py-2 px-4 font-medium text-zinc-900">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{student.name}</span>
                          {entry.isDirty && (
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" title="Unsaved change" />
                          )}
                        </div>
                      </td>

                      {/* Batch */}
                      <td className="py-2 px-4 text-center">
                        <span className="text-xs text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded">
                          {student.batch?.name}
                        </span>
                      </td>

                      {/* Written Mark Input (Col 0) */}
                      <td className="py-1.5 px-3 text-center">
                        <input
                          ref={(el) => {
                            if (!cellRefs.current[rowIndex]) cellRefs.current[rowIndex] = [null, null];
                            cellRefs.current[rowIndex][0] = el;
                          }}
                          type="text"
                          disabled={entry.isAbsent}
                          placeholder="—"
                          value={entry.written}
                          onChange={(e) => updateEntry(student.id, "written", e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, 0, student.id)}
                          className={`w-20 py-1 text-center font-semibold text-xs rounded-lg border tabular-nums transition-colors outline-none focus-ring ${
                            entry.isAbsent
                              ? "bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed"
                              : isOverMax
                              ? "border-rose-400 bg-rose-50 text-rose-700 ring-2 ring-rose-200"
                              : entry.isDirty
                              ? "border-indigo-400 bg-white text-indigo-900"
                              : "border-zinc-200 bg-zinc-50/70 hover:bg-white text-zinc-900"
                          }`}
                        />
                      </td>

                      {/* Objective Mark Input (Col 1) */}
                      <td className="py-1.5 px-3 text-center">
                        <input
                          ref={(el) => {
                            if (!cellRefs.current[rowIndex]) cellRefs.current[rowIndex] = [null, null];
                            cellRefs.current[rowIndex][1] = el;
                          }}
                          type="text"
                          disabled={entry.isAbsent}
                          placeholder="—"
                          value={entry.objective}
                          onChange={(e) => updateEntry(student.id, "objective", e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, 1, student.id)}
                          className={`w-20 py-1 text-center font-semibold text-xs rounded-lg border tabular-nums transition-colors outline-none focus-ring ${
                            entry.isAbsent
                              ? "bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed"
                              : isOverMax
                              ? "border-rose-400 bg-rose-50 text-rose-700 ring-2 ring-rose-200"
                              : entry.isDirty
                              ? "border-indigo-400 bg-white text-indigo-900"
                              : "border-zinc-200 bg-zinc-50/70 hover:bg-white text-zinc-900"
                          }`}
                        />
                      </td>

                      {/* Calculated Total */}
                      <td className="py-2 px-4 text-center font-bold text-xs tabular-nums">
                        {entry.isAbsent ? (
                          <span className="text-rose-600 font-semibold">0</span>
                        ) : (
                          <span className={isOverMax ? "text-rose-600" : "text-zinc-900"}>
                            {total > 0 ? total : "—"}
                          </span>
                        )}
                      </td>

                      {/* Absent Toggle Button */}
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => toggleAbsent(student.id)}
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                            entry.isAbsent
                              ? "bg-rose-100 text-rose-700 border border-rose-200"
                              : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 border border-transparent"
                          }`}
                          title="Toggle Absent (press A in cell)"
                        >
                          {entry.isAbsent ? "Absent" : "Present"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sticky Bottom Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 border-t border-zinc-200 px-4 sm:px-6 py-2.5 backdrop-blur-md shadow-lg flex items-center justify-between">
        {/* Progress & Entry Status */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-800 tabular-nums">
              {totalEntered} of {totalStudents} entered
            </span>
            <div className="w-24 sm:w-32 h-1.5 bg-zinc-200 rounded-full overflow-hidden hidden sm:block">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-zinc-400 text-[11px] tabular-nums hidden sm:inline">
              ({progressPercent}%)
            </span>
          </div>

          <span className="text-zinc-300">|</span>

          {/* Unsaved indicator */}
          <div className="flex items-center gap-1.5">
            {totalDirty > 0 ? (
              <span className="inline-flex items-center gap-1 text-amber-600 font-medium text-xs">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{totalDirty} unsaved changes</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-xs">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>All changes saved</span>
              </span>
            )}
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-3">
          <span className="hidden md:inline text-[11px] text-zinc-400">
            Press <kbd className="px-1.5 py-0.5 bg-zinc-100 border border-zinc-200 rounded text-[10px]">⌘S</kbd> to save
          </span>

          <button
            onClick={handleSaveAll}
            disabled={saving || totalDirty === 0}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors focus-ring"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span>Save Marks</span>
          </button>
        </div>
      </div>
    </div>
  );
}