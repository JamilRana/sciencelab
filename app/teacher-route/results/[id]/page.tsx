"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

import ExamResultsHeader from "@/components/results/ExamResultsHeader";
import PrintHeader from "@/components/results/PrintHeader";
import NoResults from "@/components/results/NoResults";
import { calculateResults } from "@/lib/calculateResults";
import MeritListTable from "@/components/results/MeritListTable";

export default function ExamResultsPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const id = params?.id as string;
  const role = searchParams.get("role") || "TEACHER";
  const studentId = searchParams.get("studentId")
    ? parseInt(searchParams.get("studentId")!)
    : null;

  const isStudent = role === "STUDENT";
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [printLimit, setPrintLimit] = useState<number | null>(null);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!id) return;

    async function fetchExam() {
      try {
        const res = await fetch(`/api/exams/${id}`);
        const data = await res.json();
        setExam(data);
      } catch (error) {
        console.error("Error fetching exam:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchExam();
  }, [id]);

  if (loading) return <div className="text-center py-12 text-sm text-zinc-500">Loading results...</div>;

  if (!exam || exam.error)
    return <div className="text-center py-12 text-sm text-zinc-500">Exam not found</div>;

  const results = calculateResults(exam, isStudent, studentId);

  return (
    <div className="py-6 px-4 md:px-6 max-w-7xl mx-auto">
      <ExamResultsHeader
        exam={exam}
        year={currentYear}
        role={role}
        printLimit={printLimit}
        onPrintLimitChange={setPrintLimit}
        totalStudents={results.length}
      />

      <PrintHeader
        exam={exam}
        year={currentYear}
        printLimit={printLimit}
        totalStudents={results.length}
      />

      {results.length === 0 ? (
        <NoResults examId={exam.id} isStudent={isStudent} />
      ) : (
        <MeritListTable
          data={exam}
          results={results}
          printLimit={printLimit}
          onPrintLimitChange={setPrintLimit}
        />
      )}
    </div>
  );
}