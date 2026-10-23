"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  Calendar,
  User,
  ClipboardList,
  Search,
  Sparkles,
  Layers,
  GraduationCap,
  CheckCircle2,
  Award,
} from "lucide-react";
import { getTeacherAssignedSpecialExamsAction } from "@/app/actions/special-exams";

interface ExamSubject {
  id: number;
  subject: string;
  totalMark: number;
  examDate: Date;
  exam: {
    id: number;
    type: string;
    month: string;
    class: string;
  };
}

export default function TeacherExamsPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "special" ? "special" : "regular";

  const [activeTab, setActiveTab] = useState<"regular" | "special">(initialTab);
  const [examSubjects, setExamSubjects] = useState<ExamSubject[]>([]);
  const [specialSubjects, setSpecialSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for regular exams
  const [filterMonth, setFilterMonth] = useState("All");
  const [filterClass, setFilterClass] = useState("All");
  const [filterSubject, setFilterSubject] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Filters for special exams
  const [specialSearchQuery, setSpecialSearchQuery] = useState("");
  const [specialKindFilter, setSpecialKindFilter] = useState("All");

  useEffect(() => {
    async function fetchData() {
      try {
        const [resRegular, resSpecial] = await Promise.all([
          fetch("/api/teacher/results")
            .then((r) => r.json())
            .catch(() => []),
          getTeacherAssignedSpecialExamsAction(),
        ]);

        // Transform regular data
        const subjectMap = new Map<number, ExamSubject>();
        if (Array.isArray(resRegular)) {
          resRegular.forEach((item: any) => {
            if (!subjectMap.has(item.id)) {
              subjectMap.set(item.id, item);
            }
          });
        }
        setExamSubjects(Array.from(subjectMap.values()));

        // Set special subjects
        if (resSpecial.success && Array.isArray(resSpecial.data)) {
          setSpecialSubjects(resSpecial.data);
        }
      } catch (error) {
        console.error("Error fetching exams:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Unique values for regular filters
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

  // Filter regular exam subjects
  const filteredSubjects = useMemo(() => {
    return examSubjects.filter((sub) => {
      const monthMatch = filterMonth === "All" || sub.exam.month === filterMonth;
      const classMatch = filterClass === "All" || sub.exam.class === filterClass;
      const subjectMatch = filterSubject === "All" || sub.subject === filterSubject;
      const searchMatch =
        !searchQuery ||
        sub.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.exam.type.toLowerCase().includes(searchQuery.toLowerCase());
      return monthMatch && classMatch && subjectMatch && searchMatch;
    });
  }, [examSubjects, filterMonth, filterClass, filterSubject, searchQuery]);

  // Unique values for special filters
  const uniqueSpecialKinds = useMemo(() => {
    const kinds = new Set(specialSubjects.map((s) => s.exam?.kind).filter(Boolean));
    return Array.from(kinds);
  }, [specialSubjects]);

  // Filter special subjects
  const filteredSpecialSubjects = useMemo(() => {
    return specialSubjects.filter((item) => {
      const kindMatch = specialKindFilter === "All" || item.exam?.kind === specialKindFilter;
      const search = specialSearchQuery.toLowerCase();
      const searchMatch =
        !search ||
        (item.exam?.title && item.exam.title.toLowerCase().includes(search)) ||
        (item.programSubject?.name && item.programSubject.name.toLowerCase().includes(search)) ||
        (item.exam?.program?.name && item.exam.program.name.toLowerCase().includes(search));
      return kindMatch && searchMatch;
    });
  }, [specialSubjects, specialKindFilter, specialSearchQuery]);

  const clearFilters = () => {
    setFilterMonth("All");
    setFilterClass("All");
    setFilterSubject("All");
    setSearchQuery("");
  };

  const hasFilters =
    filterMonth !== "All" || filterClass !== "All" || filterSubject !== "All" || searchQuery;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Assigned Exams</h1>
        <p className="text-gray-500 mt-1">View your assigned subjects and published student results.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-2">
        <button
          onClick={() => setActiveTab("regular")}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "regular"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          Regular Exams
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 font-bold">
            {examSubjects.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("special")}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "special"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Special Batch Exams
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-700 font-bold">
            {specialSubjects.length}
          </span>
        </button>
      </div>

      {/* Regular Exams Content */}
      {activeTab === "regular" && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Subject or exam type..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {filteredSubjects.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No assigned regular exams found.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredSubjects.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-white p-6 rounded-2xl shadow-sm border group hover:border-blue-200 transition-all"
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {sub.exam.type} - {sub.exam.month}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <User className="h-4 w-4" />
                            <span>Class {sub.exam.class}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(sub.examDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                            {sub.subject}
                          </span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">
                            Max Marks: {sub.totalMark}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/teacher-route/exams/${sub.exam.id}/subjects/${sub.id}/marks`}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 rounded-xl text-xs font-semibold shadow-2xs transition-all"
                      >
                        <GraduationCap className="h-4 w-4" />
                        Enter Marks
                      </Link>
                      <Link
                        href={`/teacher-route/results/${sub.exam.id}`}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-50 rounded-xl text-xs font-semibold shadow-2xs transition-all"
                      >
                        <Award className="h-4 w-4 text-zinc-500" />
                        View Results
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Special Batch Exams Content */}
      {activeTab === "special" && (
        <>
          {/* Special Filters */}
          <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
                <select
                  value={specialKindFilter}
                  onChange={(e) => setSpecialKindFilter(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="All">All Types</option>
                  {uniqueSpecialKinds.map((k) => (
                    <option key={k} value={k}>{k.replace("_", " ")}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Search Special Exam</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={specialSearchQuery}
                    onChange={(e) => setSpecialSearchQuery(e.target.value)}
                    placeholder="Search by exam title, program, subject..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {filteredSpecialSubjects.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
              <Sparkles className="h-12 w-12 text-indigo-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No assigned special batch exams found.</p>
              <p className="text-gray-400 text-xs mt-1">When administrators assign you to evaluate special batch subjects, they will appear here.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredSpecialSubjects.map((item: any) => {
                const exam = item.exam;
                const subject = item.programSubject;
                return (
                  <div
                    key={item.id}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 group hover:border-indigo-300 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                          <Sparkles className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-gray-900">{exam?.title}</h3>
                            {exam?.kind && (
                              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-xs font-bold uppercase tracking-wider">
                                {exam.kind.replace("_", " ")}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                            {exam?.program && (
                              <div className="flex items-center gap-1.5">
                                <Layers className="h-4 w-4 text-gray-400" />
                                <span>{exam.program.name}</span>
                              </div>
                            )}
                            {exam?.batch && (
                              <div className="flex items-center gap-1.5">
                                <User className="h-4 w-4 text-gray-400" />
                                <span>Batch: {exam.batch.name}</span>
                              </div>
                            )}
                            {exam?.examDate && (
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span>{new Date(exam.examDate).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                              Subject: {subject?.name || "Special Subject"}
                            </span>
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                              Total Max: {item.totalMax}
                              {(item.cqMax > 0 || item.mcqMax > 0 || item.practicalMax > 0) && (
                                <span className="text-gray-500 ml-1">
                                  (CQ: {item.cqMax}, MCQ: {item.mcqMax}
                                  {item.practicalMax > 0 ? `, Prac: ${item.practicalMax}` : ""})
                                </span>
                              )}
                            </span>
                            {item._count?.marks !== undefined && (
                              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                {item._count.marks} Marks Recorded
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/teacher-route/exams/special/${exam.id}/marks`}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 rounded-xl text-xs font-semibold shadow-2xs transition-all"
                        >
                          <GraduationCap className="h-4 w-4" />
                          Enter Marks
                        </Link>
                        <Link
                          href={`/teacher-route/results/special/${exam.id}`}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-50 rounded-xl text-xs font-semibold shadow-2xs transition-all"
                        >
                          <Award className="h-4 w-4 text-zinc-500" />
                          View Results
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
