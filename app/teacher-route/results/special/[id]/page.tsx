import { notFound } from "next/navigation";
import { getSpecialExamResultsAction } from "@/app/actions/special-exams";
import { SpecialExamResultsClient } from "@/components/special-batch/SpecialExamResultsClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeacherSpecialExamResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const examId = parseInt(resolvedParams.id, 10);

  if (isNaN(examId)) {
    notFound();
  }

  const result = await getSpecialExamResultsAction(examId);

  if (!result.success || !result.data) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center bg-white rounded-2xl border border-zinc-200 mt-8">
        <h3 className="text-base font-bold text-zinc-900">Exam Results Not Available</h3>
        <p className="text-xs text-zinc-500 mt-1">
          {result.error || "The requested special exam results could not be loaded."}
        </p>
        <Link
          href="/teacher-route/exams?tab=special"
          className="inline-flex items-center gap-1.5 px-4 py-2 mt-4 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Exams
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <SpecialExamResultsClient
        exam={result.data.exam}
        meritList={result.data.meritList}
        subjectsConfig={result.data.subjectsConfig}
        canEditMarks={false}
        enterMarksUrl={`/teacher-route/exams/special/${examId}/marks`}
        backUrl="/teacher-route/exams?tab=special"
      />
    </div>
  );
}
