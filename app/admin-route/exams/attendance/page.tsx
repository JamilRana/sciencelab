// app/admin-route/exams/attendance/page.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import React, { useEffect, useState, useMemo } from "react";
import { generateDisplayRoll } from "@/lib/roll";
import { ArrowLeft, Printer, Search, Filter, Loader2, Sparkles, CheckCircle2 } from "lucide-react";

interface Exam {
  id: number;
  type: string;
  month: string;
  class: string;
}

interface Student {
  id: number;
  name: string;
  gender: string;
  roll: number;
  batch: { id: number; name: string; code: number } | null;
  class: string;
  marks: { examSubjectId: number; written: number; objective: number }[];
}

interface ExamSubject {
  id: number;
  subject: string;
}

interface Batch {
  id: number;
  name: string;
  code: number;
}

export default function ExamAttendancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const examParam = searchParams.get("exam");
  const [selectedExamId, setSelectedExamId] = useState<number | null>(
    examParam ? parseInt(examParam, 10) : null
  );

  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [examSubjects, setExamSubjects] = useState<ExamSubject[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingAttendance, setFetchingAttendance] = useState(false);

  // Filters
  const [genderFilter, setGenderFilter] = useState<"All" | "Male" | "Female">("All");
  const [batchFilter, setBatchFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Fetch exams list on mount
  useEffect(() => {
    async function loadExams() {
      try {
        const res = await fetch("/api/exams");
        const data = await res.json();
        if (Array.isArray(data)) {
          setExams(data);
          // If no exam selected, auto-select the first one
          if (!selectedExamId && data.length > 0) {
            setSelectedExamId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Error fetching exams:", err);
      } finally {
        setLoading(false);
      }
    }
    loadExams();
  }, []);

  // 2. Fetch attendance data when selectedExamId changes
  useEffect(() => {
    if (!selectedExamId) {
      setStudents([]);
      setExamSubjects([]);
      setBatches([]);
      return;
    }

    async function loadAttendance() {
      setFetchingAttendance(true);
      try {
        const res = await fetch(`/api/exams/attendance?examId=${selectedExamId}`);
        const data = await res.json();

        const studentList: Student[] = data.students || [];
        setStudents(studentList);
        setExamSubjects(data.subjects || []);

        // Extract unique batches from students
        const batchMap = new Map<number, Batch>();
        studentList.forEach((s) => {
          if (s.batch && s.batch.id) {
            batchMap.set(s.batch.id, {
              id: s.batch.id,
              name: s.batch.name || `Batch ${s.batch.code}`,
              code: s.batch.code || 0,
            });
          }
        });
        setBatches(Array.from(batchMap.values()).sort((a, b) => a.code - b.code));
      } catch (err) {
        console.error("Error fetching attendance data:", err);
      } finally {
        setFetchingAttendance(false);
      }
    }

    loadAttendance();
  }, [selectedExamId]);

  const selectedExam = useMemo(
    () => exams.find((e) => e.id === selectedExamId),
    [exams, selectedExamId]
  );

  // Handle changing exam
  const handleExamChange = (examId: number) => {
    setSelectedExamId(examId);
    setBatchFilter("All");
    setSearchQuery("");
    router.replace(`/admin-route/exams/attendance?exam=${examId}`, { scroll: false });
  };

  // Filter students based on Gender, Batch, and Search query
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      // Gender filter
      if (genderFilter !== "All") {
        if (student.gender?.toLowerCase() !== genderFilter.toLowerCase()) {
          return false;
        }
      }

      // Batch filter
      if (batchFilter !== "All") {
        if (!student.batch || String(student.batch.id) !== batchFilter) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const batchCode = student.batch?.code || 0;
        const displayRoll = String(batchCode ? batchCode * 100 + student.roll : student.roll);
        const nameMatch = student.name?.toLowerCase().includes(q);
        const rollMatch = displayRoll.includes(q) || String(student.roll).includes(q);
        const batchMatch = student.batch?.name?.toLowerCase().includes(q);
        if (!nameMatch && !rollMatch && !batchMatch) {
          return false;
        }
      }

      return true;
    });
  }, [students, genderFilter, batchFilter, searchQuery]);

  const maleStudents = useMemo(
    () => filteredStudents.filter((s) => s.gender?.toLowerCase() === "male"),
    [filteredStudents]
  );

  const femaleStudents = useMemo(
    () => filteredStudents.filter((s) => s.gender?.toLowerCase() === "female"),
    [filteredStudents]
  );

  const hasActiveFilters =
    genderFilter !== "All" || batchFilter !== "All" || searchQuery.trim().length > 0;

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 p-12 flex items-center justify-center">
        <div className="flex items-center gap-2 text-zinc-500 text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
          <span>Loading assessment attendance...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-4 sm:p-6 print:p-0 print:bg-white text-zinc-900">
      <div className="max-w-[1440px] mx-auto print:max-w-none space-y-6">
        {/* PRINT HEADER - Visible ONLY when printing */}
        <div className="hidden print:block text-center border-b-2 border-black pb-4 mb-4">
          <div className="flex items-center justify-center gap-3 mb-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo2.png" alt="Science Lab Logo" className="h-10 w-auto object-contain" />
            <h1 className="text-2xl font-black uppercase tracking-wider text-black">
              Science Lab Coaching Center
            </h1>
          </div>
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Examination Hall Attendance & Verification Register
          </p>
          <h2 className="text-base font-bold mt-1 text-black">
            {selectedExam?.type} Examination — {selectedExam?.month} {new Date().getFullYear()} (Class {selectedExam?.class})
          </h2>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-700 mt-1">
            <span>Total Candidates: <strong>{filteredStudents.length}</strong></span>
            <span>·</span>
            <span>Boys: <strong>{maleStudents.length}</strong></span>
            <span>·</span>
            <span>Girls: <strong>{femaleStudents.length}</strong></span>
            {batchFilter !== "All" && (
              <>
                <span>·</span>
                <span>Batch: <strong>{batches.find((b) => b.id.toString() === batchFilter)?.name}</strong></span>
              </>
            )}
            <span>·</span>
            <span>Generated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* SCREEN TOP BAR - Hidden during print */}
        <div className="no-print bg-white rounded-2xl border border-zinc-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin-route/exams"
              className="h-9 w-9 rounded-xl bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 transition"
              title="Back to Exams"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-zinc-900">Attendance Sheet</h1>
              <p className="text-xs text-zinc-500">
                Print and verify attendance rosters for regular assessments.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              disabled={filteredStudents.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-2xs transition"
            >
              <Printer className="h-4 w-4" />
              <span>Print Attendance Sheet</span>
            </button>
          </div>
        </div>

        {/* FILTERS PANEL - Hidden during print */}
        <div className="no-print bg-white rounded-2xl border border-zinc-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 uppercase tracking-wider">
              <Filter className="h-3.5 w-3.5 text-indigo-600" />
              <span>Filter Candidates</span>
            </div>

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setGenderFilter("All");
                  setBatchFilter("All");
                  setSearchQuery("");
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Exam Selector */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1">
                Select Exam
              </label>
              <select
                value={selectedExamId || ""}
                onChange={(e) => handleExamChange(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-medium bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.type} — {ex.month} (Class {ex.class})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Gender Filter */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1">
                Gender
              </label>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value as "All" | "Male" | "Female")}
                className="w-full px-3 py-2 text-xs font-medium bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="All">All Students ({students.length})</option>
                <option value="Male">Male Students ({students.filter((s) => s.gender?.toLowerCase() === "male").length})</option>
                <option value="Female">Female Students ({students.filter((s) => s.gender?.toLowerCase() === "female").length})</option>
              </select>
            </div>

            {/* 3. Batch Filter */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1">
                Batch
              </label>
              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="All">All Batches</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id.toString()}>
                    {batch.name} ({batch.code})
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Search Filter */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1">
                Search Candidate
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Name or roll..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
            <span>
              Showing <strong>{filteredStudents.length}</strong> candidates of {students.length}
            </span>
            {selectedExam && (
              <span className="font-medium text-zinc-700">
                Class {selectedExam.class} · {examSubjects.length} subjects registered
              </span>
            )}
          </div>
        </div>

        {/* ATTENDANCE TABLES */}
        {fetchingAttendance ? (
          <div className="p-16 text-center text-xs text-zinc-400 flex items-center justify-center gap-2 bg-white rounded-2xl border border-zinc-200">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
            <span>Loading candidates and subjects...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-16 text-center text-zinc-500 bg-white rounded-2xl border border-zinc-200">
            <p className="text-sm font-semibold text-zinc-800 mb-1">No candidates match your selection</p>
            <p className="text-xs text-zinc-400">Try adjusting your gender, batch, or search filters.</p>
          </div>
        ) : (
          <div className="space-y-6 print:space-y-6">
            {/* MALE STUDENTS SECTION */}
            {maleStudents.length > 0 && (
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xs overflow-hidden print:border-black print:rounded-none">
                <div className="px-5 py-3 bg-blue-50/70 border-b border-zinc-200 flex items-center justify-between no-print">
                  <h2 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-600" />
                    Boys Section ({maleStudents.length} candidates)
                  </h2>
                </div>

                <div className="hidden print:block px-3 py-1.5 bg-gray-100 border-b border-black text-xs font-bold uppercase">
                  Boys Section ({maleStudents.length} candidates)
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs print:text-[8pt]">
                    <thead>
                      <tr className="bg-zinc-100/90 border-b border-zinc-300 print:bg-gray-200 print:border-black text-[11px] font-bold text-zinc-700">
                        <th className="py-2.5 px-3 w-12 text-center border-r border-zinc-200 print:border-black" rowSpan={2}>
                          #
                        </th>
                        <th className="py-2.5 px-3 w-28 text-center border-r border-zinc-200 print:border-black" rowSpan={2}>
                          Roll
                        </th>
                        <th className="py-2.5 px-3 border-r border-zinc-200 print:border-black min-w-[160px]" rowSpan={2}>
                          Candidate Name
                        </th>
                        <th className="py-2.5 px-3 w-28 text-center border-r border-zinc-200 print:border-black" rowSpan={2}>
                          Batch
                        </th>
                        {examSubjects.map((sub) => (
                          <th
                            key={sub.id}
                            colSpan={2}
                            className="py-1.5 px-2 text-center border-r border-zinc-200 print:border-black font-bold"
                          >
                            {sub.subject}
                          </th>
                        ))}
                      </tr>
                      <tr className="bg-zinc-50 border-b border-zinc-300 print:bg-gray-100 print:border-black text-[10px] font-bold text-zinc-500">
                        {examSubjects.map((sub) => (
                          <React.Fragment key={sub.id}>
                            <th className="py-1 px-1.5 text-center w-12 border-r border-zinc-200 print:border-black">Wri</th>
                            <th className="py-1 px-1.5 text-center w-12 border-r border-zinc-200 print:border-black">Obj</th>
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 print:divide-black">
                      {maleStudents.map((student, idx) => {
                        const batchCode = student.batch?.code || 0;
                        const displayRoll = batchCode
                          ? generateDisplayRoll(batchCode, student.roll)
                          : student.roll;

                        return (
                          <tr
                            key={student.id}
                            className="hover:bg-zinc-50/70 transition-colors print:border-b print:border-black"
                          >
                            <td className="py-2 px-3 text-center text-zinc-400 print:text-black tabular-nums border-r border-zinc-200 print:border-black">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-3 text-center border-r border-zinc-200 print:border-black">
                              <span className="font-bold text-xs text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded print:bg-transparent print:border-none print:text-black tabular-nums">
                                {displayRoll}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-semibold text-zinc-900 border-r border-zinc-200 print:border-black">
                              {student.name}
                            </td>
                            <td className="py-2 px-3 text-center text-zinc-500 print:text-black border-r border-zinc-200 print:border-black">
                              {student.batch?.name || "—"}
                            </td>
                            {examSubjects.map((sub) => {
                              const mark = student.marks.find((m) => m.examSubjectId === sub.id);
                              return (
                                <React.Fragment key={sub.id}>
                                  <td className="py-2 px-1.5 text-center font-mono text-zinc-800 border-r border-zinc-200 print:border-black">
                                    {mark && mark.written > 0 ? mark.written : "—"}
                                  </td>
                                  <td className="py-2 px-1.5 text-center font-mono text-zinc-800 border-r border-zinc-200 print:border-black">
                                    {mark && mark.objective > 0 ? mark.objective : "—"}
                                  </td>
                                </React.Fragment>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* FEMALE STUDENTS SECTION */}
            {femaleStudents.length > 0 && (
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xs overflow-hidden print:border-black print:rounded-none">
                <div className="px-5 py-3 bg-rose-50/70 border-b border-zinc-200 flex items-center justify-between no-print">
                  <h2 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-600" />
                    Girls Section ({femaleStudents.length} candidates)
                  </h2>
                </div>

                <div className="hidden print:block px-3 py-1.5 bg-gray-100 border-b border-black text-xs font-bold uppercase">
                  Girls Section ({femaleStudents.length} candidates)
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs print:text-[8pt]">
                    <thead>
                      <tr className="bg-zinc-100/90 border-b border-zinc-300 print:bg-gray-200 print:border-black text-[11px] font-bold text-zinc-700">
                        <th className="py-2.5 px-3 w-12 text-center border-r border-zinc-200 print:border-black" rowSpan={2}>
                          #
                        </th>
                        <th className="py-2.5 px-3 w-28 text-center border-r border-zinc-200 print:border-black" rowSpan={2}>
                          Roll
                        </th>
                        <th className="py-2.5 px-3 border-r border-zinc-200 print:border-black min-w-[160px]" rowSpan={2}>
                          Candidate Name
                        </th>
                        <th className="py-2.5 px-3 w-28 text-center border-r border-zinc-200 print:border-black" rowSpan={2}>
                          Batch
                        </th>
                        {examSubjects.map((sub) => (
                          <th
                            key={sub.id}
                            colSpan={2}
                            className="py-1.5 px-2 text-center border-r border-zinc-200 print:border-black font-bold"
                          >
                            {sub.subject}
                          </th>
                        ))}
                      </tr>
                      <tr className="bg-zinc-50 border-b border-zinc-300 print:bg-gray-100 print:border-black text-[10px] font-bold text-zinc-500">
                        {examSubjects.map((sub) => (
                          <React.Fragment key={sub.id}>
                            <th className="py-1 px-1.5 text-center w-12 border-r border-zinc-200 print:border-black">Wri</th>
                            <th className="py-1 px-1.5 text-center w-12 border-r border-zinc-200 print:border-black">Obj</th>
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 print:divide-black">
                      {femaleStudents.map((student, idx) => {
                        const batchCode = student.batch?.code || 0;
                        const displayRoll = batchCode
                          ? generateDisplayRoll(batchCode, student.roll)
                          : student.roll;

                        return (
                          <tr
                            key={student.id}
                            className="hover:bg-zinc-50/70 transition-colors print:border-b print:border-black"
                          >
                            <td className="py-2 px-3 text-center text-zinc-400 print:text-black tabular-nums border-r border-zinc-200 print:border-black">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-3 text-center border-r border-zinc-200 print:border-black">
                              <span className="font-bold text-xs text-rose-700 bg-rose-50 border border-rose-200/70 px-2 py-0.5 rounded print:bg-transparent print:border-none print:text-black tabular-nums">
                                {displayRoll}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-semibold text-zinc-900 border-r border-zinc-200 print:border-black">
                              {student.name}
                            </td>
                            <td className="py-2 px-3 text-center text-zinc-500 print:text-black border-r border-zinc-200 print:border-black">
                              {student.batch?.name || "—"}
                            </td>
                            {examSubjects.map((sub) => {
                              const mark = student.marks.find((m) => m.examSubjectId === sub.id);
                              return (
                                <React.Fragment key={sub.id}>
                                  <td className="py-2 px-1.5 text-center font-mono text-zinc-800 border-r border-zinc-200 print:border-black">
                                    {mark && mark.written > 0 ? mark.written : "—"}
                                  </td>
                                  <td className="py-2 px-1.5 text-center font-mono text-zinc-800 border-r border-zinc-200 print:border-black">
                                    {mark && mark.objective > 0 ? mark.objective : "—"}
                                  </td>
                                </React.Fragment>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background: white !important;
          }
          aside,
          button,
          nav,
          .no-print {
            display: none !important;
          }
          table {
            font-size: 8pt;
            width: 100% !important;
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
          }
          thead {
            display: table-header-group;
          }
          .border {
            border-color: #000 !important;
          }
          .overflow-x-auto {
            overflow: visible !important;
          }
        }
      `}</style>
    </div>
  );
}
