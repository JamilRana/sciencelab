"use client";

import {
  getStudentExamSummariesAction,
  ExamSummary,
} from "@/app/actions/student-results";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ResultsSkeleton } from "@/app/student-route/components/ResultSheetSkeleton";
import { ExamCard } from "@/app/student-route/components/ExamCard";
import { toast } from "sonner";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function StudentResultsPage() {
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterMonth, setFilterMonth] = useState("");
  const [filterType, setFilterType] = useState("");

  // 🔹 Initial load: Fetch exam summaries
  const fetchSummaries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStudentExamSummariesAction();
      setStudent(data.student);
      setExams(data.exams);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load results";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Error fetching exam summaries:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  // 🔹 Filter options
  const months = useMemo(() => {
    const unique = [...new Set(exams.map((e) => e.month))];
    return ["All", ...unique];
  }, [exams]);

  const types = useMemo(() => {
    const unique = [...new Set(exams.map((e) => e.type))];
    return ["All", ...unique];
  }, [exams]);

  // 🔹 Apply filters
  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const monthMatch = filterMonth === "All" || !filterMonth || exam.month === filterMonth;
      const typeMatch = filterType === "All" || !filterType || exam.type === filterType;
      return monthMatch && typeMatch;
    });
  }, [exams, filterMonth, filterType]);

  // 🔹 Handle exam card click → Navigate to full results page
  const handleViewResults = (examId: number) => {
    router.push(`/student-route/results/${examId}`);
  };

  // Loading state
  if (loading && !error) {
    return <ResultsSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card border rounded-xl p-6 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold">Unable to Load Results</h2>
          <p className="text-muted-foreground">{error}</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={fetchSummaries}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
            <a
              href="/student-route/dashboard"
              className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 🔹 No student data
  if (!student) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card border rounded-xl p-6 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold">Student Profile Not Found</h2>
          <p className="text-muted-foreground">
            Please contact administration to resolve this issue.
          </p>
          <a
            href="/student-route/dashboard"
            className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 🔹 Header */}
      <header className="border-b bg-card/50 sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">📊 My Results</h1>
            <p className="text-sm text-muted-foreground">
              {student.name} • Class {student.class} • Batch {student.batch.name}
            </p>
          </div>
          <button
            onClick={fetchSummaries}
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition flex items-center gap-2"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* 🔹 Filters */}
        <div className="bg-card p-4 rounded-xl shadow-sm mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Month
              </label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary bg-background"
              >
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Exam Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary bg-background"
              >
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            {(filterMonth !== "All" || filterType !== "All") && (
              <button
                onClick={() => {
                  setFilterMonth("All");
                  setFilterType("All");
                }}
                className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* 🔹 Exam Cards Grid */}
        {filteredExams.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-dashed">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-muted-foreground">No exam results found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {(filterMonth !== "All" || filterType !== "All") &&
                "Try clearing filters"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExams.map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                studentId={student.id}
                onViewResults={() => handleViewResults(exam.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}