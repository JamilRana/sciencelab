"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FileText, User, Trophy, Search } from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CLASSES = ["6", "7", "8", "9", "10", "11", "12"];

interface Mark {
  id: number;
  studentId: number;
  written: number;
  objective: number;
  student: {
    id: number;
    name: string;
    class: string;
  };
}

interface ExamSubject {
  id: number;
  subject: string;
  totalMark: number;
  exam: {
    id: number;
    type: string;
    month: string;
    class: string;
  };
  marks: Mark[];
}

function getCompetitionPosition(
  ranked: Array<{ studentId: number; total: number }>,
  targetStudentId: number
): number | null {
  if (ranked.length === 0) return null;

  let position = 1;
  
  for (let i = 0; i < ranked.length; i++) {
    const entry = ranked[i];
    
    if (entry.studentId === targetStudentId) {
      return position;
    }
    
    // Update position only when score drops (handles ties)
    if (i < ranked.length - 1 && ranked[i + 1].total < entry.total) {
      position = i + 2;
    }
  }
  
  return position;
}

export default function TeacherResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [examSubjects, setExamSubjects] = useState<ExamSubject[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filterMonth, setFilterMonth] = useState("All");
  const [filterClass, setFilterClass] = useState("All");
  const [filterSubject, setFilterSubject] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch("/api/teacher/results");
        const data = await res.json();
        setExamSubjects(data);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Get unique values for filters
  const uniqueMonths = useMemo(() => {
    const months = new Set(examSubjects.map((sub) => sub.exam.month));
    return Array.from(months);
  }, [examSubjects]);

  const uniqueClasses = useMemo(() => {
    const classes = new Set(examSubjects.map((sub) => sub.exam.class));
    return Array.from(classes);
  }, [examSubjects]);

  const uniqueSubjects = useMemo(() => {
    const subjects = new Set(examSubjects.map((sub) => sub.subject));
    return Array.from(subjects);
  }, [examSubjects]);

  // Filter exam subjects
  const filteredExamSubjects = examSubjects.filter((sub) => {
    const monthMatch = filterMonth === "All" || sub.exam.month === filterMonth;
    const classMatch = filterClass === "All" || sub.exam.class === filterClass;
    const subjectMatch = filterSubject === "All" || sub.subject === filterSubject;
    return monthMatch && classMatch && subjectMatch;
  });

  // Add ranking to each exam subject
  const examSubjectsWithRanking = useMemo(() => {
    return filteredExamSubjects.map((sub) => {
      // Calculate total for each student
      const studentTotals = sub.marks.map((mark) => ({
        studentId: mark.studentId,
        total: mark.written + mark.objective,
      }));

      // Sort descending
      const sorted = [...studentTotals].sort((a, b) => b.total - a.total);

      // Add rank to each mark
      const marksWithRank = sub.marks.map((mark) => ({
        ...mark,
        total: mark.written + mark.objective,
        rank: getCompetitionPosition(sorted, mark.studentId),
      }));

      return {
        ...sub,
        marks: marksWithRank,
      };
    });
  }, [filteredExamSubjects]);

  const clearFilters = () => {
    setFilterMonth("All");
    setFilterClass("All");
    setFilterSubject("All");
    setSearchQuery("");
  };

  const hasFilters = filterMonth !== "All" || filterClass !== "All" || filterSubject !== "All" || searchQuery;

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Results & Ranking</h1>
          <p className="text-gray-500 mt-1">View exam results with competition ranking.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 no-print"
        >
          Print
        </button>
      </div>

      <div className="hidden print:block text-center mb-4">
        <h1 className="text-xl font-bold">Coaching Center</h1>
        <p className="text-sm">Exam Results</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6 no-print">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Months</option>
              {uniqueMonths.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Classes</option>
              {uniqueClasses.map((c) => (
                <option key={c} value={c}>Class {c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Subjects</option>
              {uniqueSubjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Student</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Student name..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {examSubjectsWithRanking.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <p className="text-gray-500">No results available</p>
        </div>
      ) : (
        <div className="space-y-6">
          {examSubjectsWithRanking.map((sub) => {
            const filteredMarks = sub.marks.filter((mark) =>
              !searchQuery || mark.student.name.toLowerCase().includes(searchQuery.toLowerCase())
            );

            return (
              <div key={sub.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{sub.subject}</h2>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>{sub.exam.type} - {sub.exam.month}</span>
                        <span>•</span>
                        <span>Class {sub.exam.class}</span>
                        <span>•</span>
                        <span>Max: {sub.totalMark}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-center font-medium text-gray-600 w-16">Rank</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Student</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-600">Written</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-600">Objective</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-600">Total</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-600">Percentage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredMarks.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                            No marks entered yet
                          </td>
                        </tr>
                      ) : (
                        filteredMarks
                          .sort((a, b) => (b.rank || 999) - (a.rank || 999))
                          .map((mark) => {
                            const percentage = (mark.total / sub.totalMark) * 100;
                            
                            return (
                              <tr key={mark.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-center">
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded font-bold ${
                                    mark.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                                    mark.rank === 2 ? 'bg-gray-100 text-gray-700' :
                                    mark.rank === 3 ? 'bg-amber-100 text-amber-700' :
                                    'bg-gray-50 text-gray-600'
                                  }`}>
                                    {mark.rank === 1 && <Trophy className="h-3 w-3" />}
                                    {mark.rank || "-"}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-400" />
                                    <span className="font-medium text-gray-900">{mark.student.name}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">{mark.written}</td>
                                <td className="px-4 py-3 text-center">{mark.objective}</td>
                                <td className="px-4 py-3 text-center font-bold">{mark.total}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    percentage >= 60 ? 'bg-green-100 text-green-700' : 
                                    percentage >= 40 ? 'bg-yellow-100 text-yellow-700' : 
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {percentage.toFixed(1)}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
