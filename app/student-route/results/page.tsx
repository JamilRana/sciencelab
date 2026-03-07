"use client";

import { 
  getStudentExamSummariesAction, 
  getStudentExamDetailAction,
  ExamSummary,
  ExamDetailResponse 
} from "@/app/actions/student-results";
import { useState, useEffect, useMemo } from "react";
import { ResultsSkeleton } from "../components/ResultSheetSkeleton";
import { ExamCard } from "../components/ExamCard";
import { ResultSheetModal } from "../components/ResultSheetModal";

export default function StudentResultsPage() {
  const [student, setStudent] = useState<any>(null);
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [selectedExam, setSelectedExam] = useState<ExamDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterMonth, setFilterMonth] = useState("");
  const [filterType, setFilterType] = useState("");

  // 🔹 Initial load: Fetch exam summaries (card view)
  useEffect(() => {
    async function fetchSummaries() {
      try {
        const data = await getStudentExamSummariesAction();
        setStudent(data.student);
        setExams(data.exams);
      } catch (error) {
        console.error("Error fetching exam summaries:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSummaries();
  }, []);

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

  // 🔹 Handle exam card click → fetch detailed view
  const handleViewDetails = async (examId: number) => {
    try {
      setLoading(true);
      const detailed = await getStudentExamDetailAction(examId);
      setSelectedExam(detailed);
    } catch (error) {
      console.error("Error loading exam details:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Close modal → return to card view
  const handleCloseModal = () => {
    setSelectedExam(null);
  };

  // 🔹 Loading state
  if (loading && !selectedExam) {
    return <ResultsSkeleton />;
  }

  // 🔹 Error state
  if (!student) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Student profile not found. Please contact administration.
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
            onClick={() => selectedExam && window.print()}
            disabled={!selectedExam}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedExam
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            } no-print`}
          >
            🖨️ Print
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        
        {/* 🔹 Filters (Only in card view) */}
        {!selectedExam && (
          <div className="bg-card p-4 rounded-xl shadow-sm mb-6 no-print">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Month</label>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary bg-background"
                >
                  {months.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Exam Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary bg-background"
                >
                  {types.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              {(filterMonth !== "All" || filterType !== "All") && (
                <button
                  onClick={() => { setFilterMonth("All"); setFilterType("All"); }}
                  className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* 🔹 Card View (Default) */}
        {!selectedExam && (
          <>
            {filteredExams.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-dashed">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-muted-foreground">No exam results found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {(filterMonth !== "All" || filterType !== "All") && "Try clearing filters"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredExams.map((exam) => (
                  <ExamCard
                    key={exam.id}
                    exam={exam}
                    onViewDetails={() => handleViewDetails(exam.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* 🔹 Detailed Result Sheet (Modal) */}
        {selectedExam && (
          <ResultSheetModal
            data={selectedExam}
            onClose={handleCloseModal}
            onBack={() => setSelectedExam(null)}
          />
        )}

      </main>

      {/* 🔹 Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .print\\:block { display: block !important; }
        }
      `}</style>
    </div>
  );
}