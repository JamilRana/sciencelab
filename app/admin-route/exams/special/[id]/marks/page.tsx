import { getSpecialExamDetailsAction } from "@/app/actions/special-exams";
import { SpecialMarksEntryClient } from "@/components/special-batch/SpecialMarksEntryClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface MarksPageProps {
  params: Promise<{ id: string }>;
}

export default async function SpecialExamMarksPage({ params }: MarksPageProps) {
  const { id } = await params;
  const examId = parseInt(id, 10);

  if (isNaN(examId)) {
    notFound();
  }

  const res = await getSpecialExamDetailsAction(examId);
  if (!res.success || !res.data) {
    notFound();
  }

  const exam = res.data;
  const students = (exam as any).allStudents || exam.batch?.students || [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <SpecialMarksEntryClient exam={exam} students={students} />
    </div>
  );
}
