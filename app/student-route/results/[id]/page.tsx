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

  const role = searchParams.get("role");
  const studentId = searchParams.get("studentId")
    ? parseInt(searchParams.get("studentId")!)
    : null;

  const isStudent = role === "STUDENT";

  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!id) return;

    async function fetchExam() {
      try {
        const res = await fetch(`/api/exams/${id}`);
        const data = await res.json();
        console.log("no data",data);
        setExam(data);
      } catch (error) {
        console.error("Error fetching exam:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchExam();
  }, [id]);

  if (loading) return <div className="text-center py-6">Loading...</div>;

  if (!exam || exam.error)
    return <div className="text-center py-6">Exam not found</div>;

  const results = calculateResults(exam, isStudent, studentId);

  return (
    <div className="py-6 px-4 md:px-0">

      <ExamResultsHeader exam={exam} year={currentYear} role={role} />

      <PrintHeader exam={exam} year={currentYear} />

      {results.length === 0 ? (
        <NoResults examId={exam.id}
         isStudent={isStudent} />
      ) : (
        <MeritListTable
          data={exam}
          results={results}
        />
      )}
    </div>
  );
}