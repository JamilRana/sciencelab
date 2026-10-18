"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveSpecialMarksAction } from "@/app/actions/special-exams";
import { generateDisplayRoll } from "@/lib/roll";
import {
  ArrowLeft,
  Save,
  Loader2,
  Search,
  CheckCircle2,
  AlertCircle,
  Keyboard,
  Printer,
  Sparkles,
  Layers,
  FileSpreadsheet,
} from "lucide-react";

interface SpecialMarksEntryClientProps {
  exam: any;
  students: any[];
}

interface StudentRowEntry {
  studentId: number;
  cq: string;
  mcq: string;
  practical: string;
  single: string;
  isAbsent: boolean;
  hasExisting: boolean;
  isDirty: boolean;
}

export function SpecialMarksEntryClient({
  exam,
  students,
}: SpecialMarksEntryClientProps) {
  const router = useRouter();
  const subjects = exam.subjects || [];

  const [selectedSubjectId, setSelectedSubjectId] = useState<number>(
    subjects[0]?.id || 0
  );
  const [sectionFilter, setSectionFilter] = useState<"ALL" | "BOYS" | "GIRLS">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState<Record<number, StudentRowEntry>>({});

  // Keyboard navigation refs: grid of [rowIndex][colIndex]
  const cellRefs = useRef<Array<Array<HTMLInputElement | null>>>([]);

  // Current active subject
  const currentSpecialSubject = useMemo(
    () => subjects.find((s: any) => s.id === selectedSubjectId),
    [subjects, selectedSubjectId]
  );

  const hasCQ = (currentSpecialSubject?.cqMax || 0) > 0;
  const hasMCQ = (currentSpecialSubject?.mcqMax || 0) > 0;
  const hasPractical = (currentSpecialSubject?.practicalMax || 0) > 0;
  const isMultiComponent = (hasCQ && hasMCQ) || hasPractical;

  // Initialize entries when selectedSubjectId changes
  useEffect(() => {
    if (!currentSpecialSubject) return;

    const existingMarks = currentSpecialSubject.marks || [];
    const markMap = new Map<number, any>();
    existingMarks.forEach((m: any) => markMap.set(m.studentId, m));

    const initial: Record<number, StudentRowEntry> = {};
    students.forEach((stu) => {
      const existing = markMap.get(stu.id);
      if (existing) {
        initial[stu.id] = {
          studentId: stu.id,
          cq: existing.cq !== null && existing.cq !== undefined ? String(existing.cq) : "",
          mcq: existing.mcq !== null && existing.mcq !== undefined ? String(existing.mcq) : "",
          practical: existing.practical !== null && existing.practical !== undefined ? String(existing.practical) : "",
          single: existing.total !== null && existing.total !== undefined ? String(existing.total) : "",
          isAbsent: existing.isAbsent || false,
          hasExisting: true,
          isDirty: false,
        };
      } else {
        initial[stu.id] = {
          studentId: stu.id,
          cq: "",
          mcq: "",
          practical: "",
          single: "",
          isAbsent: false,
          hasExisting: false,
          isDirty: false,
        };
      }
    });

    setEntries(initial);
  }, [currentSpecialSubject, students]);

  // Filter students by section & search query
  const filteredStudents = useMemo(() => {
    return students.filter((stu) => {
      // Section filter
      if (sectionFilter === "BOYS") {
        const isBoy = stu.gender === "Male" || stu.batch?.name?.toLowerCase().includes("boy");
        if (!isBoy) return false;
      } else if (sectionFilter === "GIRLS") {
        const isGirl = stu.gender === "Female" || stu.batch?.name?.toLowerCase().includes("girl");
        if (!isGirl) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const batchCode = stu.batch?.code || exam.batch?.code || 0;
        const displayRoll = String(batchCode ? batchCode * 100 + stu.roll : stu.roll);
        const nameMatch = stu.name.toLowerCase().includes(q);
        const rollMatch = displayRoll.includes(q) || String(stu.roll).includes(q);
        const schoolMatch = stu.school?.name?.toLowerCase().includes(q);
        return nameMatch || rollMatch || schoolMatch;
      }

      return true;
    });
  }, [students, sectionFilter, searchQuery, exam.batch]);

  // Update entry input
  const updateField = useCallback(
    (studentId: number, field: "cq" | "mcq" | "practical" | "single", value: string) => {
      if (value !== "" && !/^\d*\.?\d*$/.test(value)) return;

      const numVal = parseFloat(value) || 0;
      let maxLimit = currentSpecialSubject?.totalMax || 100;
      if (field === "cq" && hasCQ) maxLimit = currentSpecialSubject.cqMax;
      if (field === "mcq" && hasMCQ) maxLimit = currentSpecialSubject.mcqMax;
      if (field === "practical" && hasPractical) maxLimit = currentSpecialSubject.practicalMax;

      if (numVal > maxLimit) {
        toast.error(`Value cannot exceed maximum allowed (${maxLimit})`);
        return;
      }

      setEntries((prev) => {
        const current = prev[studentId] || {
          studentId,
          cq: "",
          mcq: "",
          practical: "",
          single: "",
          isAbsent: false,
          hasExisting: false,
          isDirty: false,
        };

        return {
          ...prev,
          [studentId]: {
            ...current,
            [field]: value,
            isAbsent: false, // entering mark clears absent
            isDirty: true,
          },
        };
      });
    },
    [currentSpecialSubject, hasCQ, hasMCQ, hasPractical]
  );

  // Toggle absent
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
          isDirty: true,
        },
      };
    });
  }, []);

  // Compute calculated total for a row
  const getRowTotal = (entry?: StudentRowEntry) => {
    if (!entry) return 0;
    if (entry.isAbsent) return 0;
    if (isMultiComponent) {
      const cq = parseFloat(entry.cq) || 0;
      const mcq = parseFloat(entry.mcq) || 0;
      const prac = parseFloat(entry.practical) || 0;
      return cq + mcq + prac;
    }
    return parseFloat(entry.single || entry.cq) || 0;
  };

  // Keyboard navigation
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    colIndex: number,
    studentId: number
  ) => {
    if (e.key === "ArrowDown" || e.key === "Enter") {
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
      if (input.selectionStart === input.value.length) {
        const nextCol = colIndex + 1;
        cellRefs.current[rowIndex]?.[nextCol]?.focus();
        cellRefs.current[rowIndex]?.[nextCol]?.select();
      }
    } else if (e.key === "ArrowLeft") {
      const input = e.currentTarget;
      if (input.selectionStart === 0) {
        const prevCol = colIndex - 1;
        if (prevCol >= 0) {
          cellRefs.current[rowIndex]?.[prevCol]?.focus();
          cellRefs.current[rowIndex]?.[prevCol]?.select();
        }
      }
    } else if (e.key === "a" || e.key === "A") {
      if (e.currentTarget.value === "") {
        e.preventDefault();
        toggleAbsent(studentId);
      }
    }
  };

  // Save all dirty entries
  const handleSaveAll = async () => {
    if (!currentSpecialSubject) return;

    const dirtyList = Object.values(entries).filter((e) => e.isDirty);
    if (dirtyList.length === 0) {
      toast.info("No unsaved changes");
      return;
    }

    setSaving(true);
    try {
      const marksPayload = dirtyList.map((e) => {
        const cq = parseFloat(e.cq) || 0;
        const mcq = parseFloat(e.mcq) || 0;
        const practical = parseFloat(e.practical) || 0;
        const total = isMultiComponent ? cq + mcq + practical : parseFloat(e.single || e.cq) || 0;

        return {
          studentId: e.studentId,
          cq,
          mcq,
          practical,
          total,
          isAbsent: e.isAbsent,
        };
      });

      const res = await saveSpecialMarksAction({
        specialExamSubjectId: currentSpecialSubject.id,
        marks: marksPayload,
      });

      if (res.success) {
        toast.success(`Successfully saved marks for ${dirtyList.length} students`);
        setEntries((prev) => {
          const updated = { ...prev };
          dirtyList.forEach((d) => {
            if (updated[d.studentId]) {
              updated[d.studentId] = {
                ...updated[d.studentId],
                isDirty: false,
                hasExisting: true,
              };
            }
          });
          return updated;
        });
        router.refresh();
      } else {
        toast.error(res.error || "Failed to save marks");
      }
    } catch (err) {
      console.error("Save marks error:", err);
      toast.error("Database error saving marks");
    } finally {
      setSaving(false);
    }
  };

  // Global hotkey: Cmd+S / Ctrl+S
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

  const dirtyCount = Object.values(entries).filter((e) => e.isDirty).length;
  const enteredCount = Object.values(entries).filter(
    (e) => (e.hasExisting || e.isDirty) && (e.cq !== "" || e.single !== "" || e.isAbsent)
  ).length;

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin-route/special-batch?tab=exams"
              className="text-xs text-zinc-500 hover:text-zinc-800 inline-flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Back to Special Exams</span>
            </Link>
            <span className="text-zinc-300">·</span>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
              {exam.kind.replace("_", " ")}
            </span>
          </div>

          <h1 className="text-xl font-bold text-zinc-900">{exam.title}</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {exam.program?.name} · {exam.batch?.name || "All Program Batches"} · Fast Keyboard Spreadsheet
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/admin-route/exams/special/${exam.id}/results`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-lg shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-indigo-600" />
            <span>View Board Results</span>
          </Link>

          <button
            onClick={handleSaveAll}
            disabled={saving || dirtyCount === 0}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-2xs transition-colors"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span>Save Marks {dirtyCount > 0 && `(${dirtyCount})`}</span>
          </button>
        </div>
      </div>

      {/* Subject Tabs (if multiple subjects exist in exam) */}
      {subjects.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-white p-2 rounded-xl border border-zinc-200">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-2">Subject:</span>
          {subjects.map((s: any) => {
            const isSelected = s.id === selectedSubjectId;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedSubjectId(s.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                {s.programSubject?.name || "Subject"}
                <span className="text-[10px] opacity-80 ml-1.5">
                  ({s.totalMax}m)
                </span>
                {s.isCompulsory === false && (
                  <span className="ml-1 text-[9px] bg-amber-400 text-amber-950 px-1 py-0.2 rounded font-bold">
                    Opt
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Toolbar: Section filter & Search */}
      <div className="bg-white p-3.5 rounded-xl border border-zinc-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 font-medium">Filter Section:</span>
          <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 text-xs">
            {(["ALL", "BOYS", "GIRLS"] as const).map((sec) => (
              <button
                key={sec}
                onClick={() => setSectionFilter(sec)}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  sectionFilter === sec
                    ? "bg-white text-zinc-900 shadow-2xs border border-zinc-200"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {sec === "ALL" ? "All Sections" : sec === "BOYS" ? "Boys Only" : "Girls Only"}
              </button>
            ))}
          </div>

          <div className="text-xs text-zinc-500 ml-2 hidden sm:block">
            <span>Subject Max: </span>
            <strong className="text-zinc-900 font-bold">{currentSpecialSubject?.totalMax || 100}</strong>
            {hasCQ && <span className="ml-1 text-zinc-400">(CQ: {currentSpecialSubject?.cqMax})</span>}
            {hasMCQ && <span className="ml-1 text-zinc-400">(MCQ: {currentSpecialSubject?.mcqMax})</span>}
            {hasPractical && <span className="ml-1 text-zinc-400">(Prac: {currentSpecialSubject?.practicalMax})</span>}
          </div>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search student or roll..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg outline-none text-zinc-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Spreadsheet Grid */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden">
        {/* Helper Strip */}
        <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-800">
              {currentSpecialSubject?.programSubject?.name || "Subject Marks Entry"}
            </span>
            <span>·</span>
            <span>{filteredStudents.length} candidates listed</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-zinc-400">
            <Keyboard className="h-3.5 w-3.5" />
            <span>Enter / Arrows to move · Press &apos;A&apos; for Absent</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-[620px]">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 bg-zinc-100/90 backdrop-blur-xs border-b border-zinc-200 z-10 text-[11px] font-bold text-zinc-600 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center">#</th>
                <th className="py-2.5 px-3 w-28">Roll</th>
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3 w-36">Feeder School</th>
                {isMultiComponent ? (
                  <>
                    {hasCQ && <th className="py-2.5 px-3 w-24 text-center">CQ ({currentSpecialSubject?.cqMax})</th>}
                    {hasMCQ && <th className="py-2.5 px-3 w-24 text-center">MCQ ({currentSpecialSubject?.mcqMax})</th>}
                    {hasPractical && <th className="py-2.5 px-3 w-24 text-center">Prac ({currentSpecialSubject?.practicalMax})</th>}
                  </>
                ) : (
                  <th className="py-2.5 px-3 w-28 text-center">Mark ({currentSpecialSubject?.totalMax})</th>
                )}
                <th className="py-2.5 px-3 w-20 text-center">Total</th>
                <th className="py-2.5 px-3 w-24 text-center">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100">
              {filteredStudents.map((student, rowIndex) => {
                const entry = entries[student.id] || {
                  studentId: student.id,
                  cq: "",
                  mcq: "",
                  practical: "",
                  single: "",
                  isAbsent: false,
                  hasExisting: false,
                  isDirty: false,
                };

                const total = getRowTotal(entry);
                const isOverMax = currentSpecialSubject && total > currentSpecialSubject.totalMax;
                const batchCode = student.batch?.code || exam.batch?.code || 0;
                const displayRoll = batchCode ? generateDisplayRoll(batchCode, student.roll) : student.roll;

                // Ensure cellRefs has capacity for this row
                if (!cellRefs.current[rowIndex]) {
                  cellRefs.current[rowIndex] = [];
                }

                return (
                  <tr
                    key={student.id}
                    className={`hover:bg-zinc-50/70 transition-colors ${
                      entry.isAbsent
                        ? "bg-rose-50/40"
                        : entry.isDirty
                        ? "bg-indigo-50/20"
                        : ""
                    }`}
                  >
                    {/* Index */}
                    <td className="py-2 px-3 text-center text-zinc-400 tabular-nums">
                      {rowIndex + 1}
                    </td>

                    {/* Roll */}
                    <td className="py-2 px-3">
                      <span className="font-bold text-xs text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded tabular-nums">
                        {displayRoll}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="py-2 px-3 font-semibold text-zinc-900">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{student.name}</span>
                        {entry.isDirty && (
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0"
                            title="Unsaved changes"
                          />
                        )}
                      </div>
                    </td>

                    {/* School */}
                    <td className="py-2 px-3 text-zinc-500 truncate max-w-[150px]">
                      {student.school?.name || "—"}
                    </td>

                    {/* Multi-component inputs vs Single input */}
                    {isMultiComponent ? (
                      <>
                        {hasCQ && (
                          <td className="py-1.5 px-2 text-center">
                            <input
                              ref={(el) => {
                                cellRefs.current[rowIndex][0] = el;
                              }}
                              type="text"
                              disabled={entry.isAbsent}
                              placeholder="—"
                              value={entry.cq}
                              onChange={(e) => updateField(student.id, "cq", e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, rowIndex, 0, student.id)}
                              className={`w-16 py-1 text-center font-bold text-xs rounded-lg border tabular-nums transition-colors outline-none ${
                                entry.isAbsent
                                  ? "bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed"
                                  : entry.isDirty
                                  ? "border-indigo-400 bg-white text-indigo-900 ring-1 ring-indigo-200"
                                  : "border-zinc-200 bg-zinc-50/70 hover:bg-white text-zinc-900"
                              }`}
                            />
                          </td>
                        )}

                        {hasMCQ && (
                          <td className="py-1.5 px-2 text-center">
                            <input
                              ref={(el) => {
                                cellRefs.current[rowIndex][1] = el;
                              }}
                              type="text"
                              disabled={entry.isAbsent}
                              placeholder="—"
                              value={entry.mcq}
                              onChange={(e) => updateField(student.id, "mcq", e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, rowIndex, 1, student.id)}
                              className={`w-16 py-1 text-center font-bold text-xs rounded-lg border tabular-nums transition-colors outline-none ${
                                entry.isAbsent
                                  ? "bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed"
                                  : entry.isDirty
                                  ? "border-indigo-400 bg-white text-indigo-900 ring-1 ring-indigo-200"
                                  : "border-zinc-200 bg-zinc-50/70 hover:bg-white text-zinc-900"
                              }`}
                            />
                          </td>
                        )}

                        {hasPractical && (
                          <td className="py-1.5 px-2 text-center">
                            <input
                              ref={(el) => {
                                cellRefs.current[rowIndex][2] = el;
                              }}
                              type="text"
                              disabled={entry.isAbsent}
                              placeholder="—"
                              value={entry.practical}
                              onChange={(e) => updateField(student.id, "practical", e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, rowIndex, 2, student.id)}
                              className={`w-16 py-1 text-center font-bold text-xs rounded-lg border tabular-nums transition-colors outline-none ${
                                entry.isAbsent
                                  ? "bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed"
                                  : entry.isDirty
                                  ? "border-indigo-400 bg-white text-indigo-900 ring-1 ring-indigo-200"
                                  : "border-zinc-200 bg-zinc-50/70 hover:bg-white text-zinc-900"
                              }`}
                            />
                          </td>
                        )}
                      </>
                    ) : (
                      /* Single Score Input */
                      <td className="py-1.5 px-2 text-center">
                        <input
                          ref={(el) => {
                            cellRefs.current[rowIndex][0] = el;
                          }}
                          type="text"
                          disabled={entry.isAbsent}
                          placeholder="—"
                          value={entry.single || entry.cq}
                          onChange={(e) => updateField(student.id, "single", e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, 0, student.id)}
                          className={`w-20 py-1 text-center font-bold text-xs rounded-lg border tabular-nums transition-colors outline-none ${
                            entry.isAbsent
                              ? "bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed"
                              : entry.isDirty
                              ? "border-indigo-400 bg-white text-indigo-900 ring-1 ring-indigo-200"
                              : "border-zinc-200 bg-zinc-50/70 hover:bg-white text-zinc-900"
                          }`}
                        />
                      </td>
                    )}

                    {/* Calculated Total */}
                    <td className="py-2 px-3 text-center font-bold tabular-nums">
                      {entry.isAbsent ? (
                        <span className="text-rose-600 font-bold">ABS</span>
                      ) : (
                        <span className={isOverMax ? "text-rose-600" : "text-zinc-900"}>
                          {total > 0 ? total : "—"}
                        </span>
                      )}
                    </td>

                    {/* Absent Toggle Button */}
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggleAbsent(student.id)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                          entry.isAbsent
                            ? "bg-rose-100 text-rose-700 border border-rose-300"
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

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 border-t border-zinc-200 px-6 py-2.5 backdrop-blur-md shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs">
          <span className="font-semibold text-zinc-800 tabular-nums">
            {enteredCount} of {filteredStudents.length} entered
          </span>

          <span className="text-zinc-300">|</span>

          {dirtyCount > 0 ? (
            <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{dirtyCount} unsaved updates</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>All changes saved</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:inline text-[11px] text-zinc-400">
            Press <kbd className="px-1.5 py-0.5 bg-zinc-100 border border-zinc-200 rounded text-[10px]">⌘S</kbd> to save
          </span>

          <button
            onClick={handleSaveAll}
            disabled={saving || dirtyCount === 0}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-2xs transition-colors"
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
