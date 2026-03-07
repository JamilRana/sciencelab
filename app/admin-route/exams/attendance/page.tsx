// app/admin-route/exams/attendance/page.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { generateDisplayRoll } from "@/lib/roll";

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
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [examSubjects, setExamSubjects] = useState<ExamSubject[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [genderFilter, setGenderFilter] = useState<"All" | "Male" | "Female">("All");
  const [batchFilter, setBatchFilter] = useState<string>("All");

  const examParam = searchParams.get("exam");
  const selectedExamId = examParam ? parseInt(examParam) : null;

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const examsRes = await fetch("/api/exams");
        const examsData = await examsRes.json();
        setExams(examsData);

        if (selectedExamId) {
          const attendanceRes = await fetch(`/api/exams/attendance?examId=${selectedExamId}`);
          const attendanceData = await attendanceRes.json();
          setStudents(attendanceData.students || []);
          setExamSubjects(attendanceData.subjects || []);
          
          // Extract unique batches from students with proper typing
          const batchMap = new Map<number, Batch>();
          
          (attendanceData.students || []).forEach((s: Student) => {
            if (s.batch?.id) {
              batchMap.set(s.batch.id, {
                id: s.batch.id,
                name: s.batch.name || "",
                code: s.batch.code || 0,
              });
            }
          });
          
          setBatches(Array.from(batchMap.values()));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedExamId]);

  const defaultExamId = selectedExamId || (exams.length > 0 ? exams[0].id : null);
  const selectedExam = exams.find(e => e.id === (selectedExamId || defaultExamId));

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesGender = genderFilter === "All" || student.gender === genderFilter;
    const matchesBatch = batchFilter === "All" || student.batch?.id.toString() === batchFilter;
    return matchesGender && matchesBatch;
  });

  const maleStudents = filteredStudents.filter(s => s.gender === "Male");
  const femaleStudents = filteredStudents.filter(s => s.gender === "Female");

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6 print:p-0">
      <div className="max-w-[1400px] mx-auto print:max-w-none">
        {/* Print Header - Only visible when printing */}
        <div className="hidden print:block text-center mb-6 print:mb-4">
          <h1 className="text-2xl font-bold mb-2">Coaching Center</h1>
          <h2 className="text-xl font-semibold mb-1">
            {selectedExam?.type} Examination - {selectedExam?.month} {new Date().getFullYear()}
          </h2>
          <p className="text-gray-600">Class: {selectedExam?.class}</p>
          {(genderFilter !== "All" || batchFilter !== "All") && (
            <p className="text-sm text-gray-500 mt-2">
              Filter: {genderFilter !== "All" && `Gender: ${genderFilter}`}
              {genderFilter !== "All" && batchFilter !== "All" && " | "}
              {batchFilter !== "All" && `Batch: ${batches.find(b => b.id.toString() === batchFilter)?.name}`}
            </p>
          )}
        </div>

        {/* UI Controls - Hidden when printing */}
        <div className="no-print space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <Link
              href="/admin-route/exams"
              className="text-blue-600 hover:underline flex items-center gap-2"
            >
              ← Back to Exams
            </Link>
            <button
              onClick={handlePrint}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
            >
              <span>📄</span> Print Attendance Sheet
            </button>
          </div>

          {/* Filters */}
          {defaultExamId && (
            <div className="border p-6">
              <h2 className="text-lg font-bold mb-4">Filters</h2>
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value as "All" | "Male" | "Female")}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="All">All Students</option>
                    <option value="Male">Male Only</option>
                    <option value="Female">Female Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Batch
                  </label>
                  <select
                    value={batchFilter}
                    onChange={(e) => setBatchFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="All">All Batches</option>
                    {batches.map((batch) => (
                      <option key={batch.id} value={batch.id.toString()}>
                        {batch.name} ({batch.code})
                      </option>
                    ))}
                  </select>
                </div>

                {(genderFilter !== "All" || batchFilter !== "All") && (
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setGenderFilter("All");
                        setBatchFilter("All");
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-600 mt-4">
                Showing: <span className="font-semibold">{filteredStudents.length}</span> students
                {genderFilter !== "All" && <span> • Gender: {genderFilter}</span>}
                {batchFilter !== "All" && <span> • Batch: {batches.find(b => b.id.toString() === batchFilter)?.name}</span>}
              </p>
            </div>
          )}
        </div>

        {/* Attendance Tables */}
        {defaultExamId && examSubjects.length > 0 && filteredStudents.length > 0 && (
          <div className="space-y-6 print:space-y-4">
            {/* Male Students */}
            {maleStudents.length > 0 && (
              <div className="border overflow-hidden print:mb-4">
                <div className="p-4 bg-blue-50 border-b no-print">
                  <h2 className="text-xl font-bold text-blue-800">
                    Male Students ({maleStudents.length})
                  </h2>
                </div>
                
                <div className="print:block">
                  <h3 className="hidden print:block text-lg font-bold mb-3 px-4 py-2 bg-gray-100">
                    Male Students ({maleStudents.length})
                  </h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse print:text-[8pt]">
                      <thead>
                        <tr className="bg-gray-50 print:bg-gray-200">
                          <th className="px-1 py-1 text-center font-bold border border-gray-300 print:border-gray-600 w-5">
                            Roll
                          </th>
                          <th className="px-1 py-1 text-center font-bold border border-gray-300 print:border-gray-600 w-48">
                            Name
                          </th>
                          {examSubjects.map((sub) => (
                            <th
                              key={sub.id}
                              className="px-1 py-1 text-center font-bold border border-gray-300 print:border-gray-600 min-w-[100px]"
                              colSpan={2}
                            >
                              {sub.subject}
                            </th>
                          ))}
                        </tr>
                        <tr className="bg-gray-50 print:bg-gray-200">
                          <th className="px-3 py-2 text-left font-bold border border-gray-300 print:border-gray-600"></th>
                          <th className="px-3 py-2 text-left font-bold border border-gray-300 print:border-gray-600"></th>
                          {examSubjects.map((sub) => (
                            <th key={`wri-${sub.id}`} className="px-2 py-2 text-center font-bold border border-gray-300 print:border-gray-600 w-12">
                              Wri
                            </th>
                          ))}
                          {examSubjects.map((sub) => (
                            <th key={`obj-${sub.id}`} className="px-2 py-2 text-center font-bold border border-gray-300 print:border-gray-600 w-12">
                              Obj
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {maleStudents.map((student) => (
                          <tr key={student.id} className="hover:bg-gray-50 print:hover:bg-transparent">
                            <td className="px-3 py-2 border text-center border-gray-300 print:border-gray-600 font-mono font-medium">
                              {student.batch?.code
                                ? generateDisplayRoll(student.batch.code, student.roll)
                                : student.roll}
                            </td>
                            <td className="px-3 py-2 border text-left border-gray-300 print:border-gray-600">{student.name}</td>
                            {examSubjects.map((sub) => {
                              const mark = student.marks.find(m => m.examSubjectId === sub.id);
                              return (
                                <td
                                  key={`${student.id}-wri-${sub.id}`}
                                  className="px-2 py-2 text-center border border-gray-300 print:border-gray-600"
                                >
                                  {mark && mark.written > 0 ? mark.written : ""}
                                </td>
                              );
                            })}
                            {examSubjects.map((sub) => {
                              const mark = student.marks.find(m => m.examSubjectId === sub.id);
                              return (
                                <td
                                  key={`${student.id}-obj-${sub.id}`}
                                  className="px-2 py-2 text-center border border-gray-300 print:border-gray-600"
                                >
                                  {mark && mark.objective > 0 ? mark.objective : ""}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Female Students */}
            {femaleStudents.length > 0 && (
              <div className="border overflow-hidden">
                <div className="p-4 bg-pink-50 border-b no-print">
                  <h2 className="text-xl font-bold text-pink-800">
                    Female Students ({femaleStudents.length})
                  </h2>
                </div>
                
                <div className="print:block print:mt-4">
                  <h3 className="hidden print:block text-lg font-bold mb-3 px-4 py-2 bg-gray-100">
                    Female Students ({femaleStudents.length})
                  </h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse print:text-[8pt]">
                      <thead>
                        <tr className="bg-gray-50 print:bg-gray-200">
                          <th className="px-3 py-3 text-center font-bold border border-gray-300 print:border-gray-600 w-10">
                            Roll
                          </th>
                          <th className="px-3 py-3 text-center font-bold border border-gray-300 print:border-gray-600 w-48">
                            Name
                          </th>
                          {examSubjects.map((sub) => (
                            <th
                              key={sub.id}
                              className="px-2 py-2 text-center font-bold border border-gray-300 print:border-gray-600 min-w-[100px]"
                              colSpan={2}
                            >
                              {sub.subject}
                            </th>
                          ))}
                        </tr>
                        <tr className="bg-gray-50 print:bg-gray-200">
                          <th className="px-3 py-2 text-left font-bold border border-gray-300 print:border-gray-600"></th>
                          <th className="px-3 py-2 text-left font-bold border border-gray-300 print:border-gray-600"></th>
                          {examSubjects.map((sub) => (
                            <th key={`wri-${sub.id}`} className="px-2 py-2 text-center font-bold border border-gray-300 print:border-gray-600 w-12">
                              Wri
                            </th>
                          ))}
                          {examSubjects.map((sub) => (
                            <th key={`obj-${sub.id}`} className="px-2 py-2 text-center font-bold border border-gray-300 print:border-gray-600 w-12">
                              Obj
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {femaleStudents.map((student) => (
                          <tr key={student.id} className="hover:bg-gray-50 print:hover:bg-transparent">
                            <td className="px-3 py-2 text-center border border-gray-300 print:border-gray-600 font-mono font-medium">
                              {student.batch?.code
                                ? generateDisplayRoll(student.batch.code, student.roll)
                                : student.roll}
                            </td>
                            <td className="px-3 py-2 text-left border border-gray-300 print:border-gray-600">{student.name}</td>
                            {examSubjects.map((sub) => {
                              const mark = student.marks.find(m => m.examSubjectId === sub.id);
                              return (
                                <td
                                  key={`${student.id}-wri-${sub.id}`}
                                  className="px-2 py-2 text-center border border-gray-300 print:border-gray-600"
                                >
                                  {mark && mark.written > 0 ? mark.written : ""}
                                </td>
                              );
                            })}
                            {examSubjects.map((sub) => {
                              const mark = student.marks.find(m => m.examSubjectId === sub.id);
                              return (
                                <td
                                  key={`${student.id}-obj-${sub.id}`}
                                  className="px-2 py-2 text-center border border-gray-300 print:border-gray-600"
                                >
                                  {mark && mark.objective > 0 ? mark.objective : ""}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {(!defaultExamId || filteredStudents.length === 0) && (
          <div className="border p-12 text-center text-gray-500">
            <p className="text-lg font-medium mb-2">
              {exams.length === 0 
                ? "No exams found" 
                : filteredStudents.length === 0 
                  ? "No students match the selected filters" 
                  : "Select an exam to view attendance"}
            </p>
            <p className="text-sm">
              {exams.length === 0 
                ? "Please create exams first" 
                : filteredStudents.length === 0
                  ? "Try adjusting your filters"
                  : "Choose an exam from the dropdown above"}
            </p>
          </div>
        )}
      </div>

      {/* Print Styles */}
<style jsx global>{`
@media print {

  @page {
    size: A4 portrait;
    margin: 10mm;
  }

  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    background: white !important;
  }

  /* Hide sidebar & burger */
  aside,
  button,
  .lg\\:hidden,
  .fixed {
    display: none !important;
  }

  /* Remove shadows */
  * {
    box-shadow: none !important;
  }

  .no-print {
    display: none !important;
  }

  table {
    font-size: 9pt;
    page-break-inside: auto;
  }

  tr {
    page-break-inside: avoid;
  }

  thead {
    display: table-header-group;
  }

  .bg-blue-50,
  .bg-pink-50 {
    background-color: #f3f4f6 !important;
  }

  .border {
    border-color: #9ca3af !important;
  }

  .overflow-x-auto {
    overflow: visible !important;
  }

  .bg-white {
    background: white !important;
  }

}
`}</style>
    </div>
  );
}