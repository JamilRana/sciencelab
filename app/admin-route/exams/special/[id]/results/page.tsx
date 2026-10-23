import { notFound } from "next/navigation";
import { getSpecialExamResultsAction } from "@/app/actions/special-exams";
import { SpecialExamResultsClient } from "@/components/special-batch/SpecialExamResultsClient";

export const dynamic = "force-dynamic";

export default async function SpecialExamResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const examId = parseInt(resolvedParams.id);

  if (isNaN(examId)) {
    notFound();
  }

  const result = await getSpecialExamResultsAction(examId);

  if (!result.success || !result.data) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-zinc-200">
        <h3 className="text-base font-bold text-zinc-900">Exam Results Not Found</h3>
        <p className="text-xs text-zinc-500 mt-1">
          {result.error || "The requested special exam could not be loaded."}
        </p>
      </div>
    );
  }

  return (
    <SpecialExamResultsClient
      exam={result.data.exam}
      meritList={result.data.meritList}
      subjectsConfig={result.data.subjectsConfig}
      canEditMarks={true}
      backUrl="/admin-route/special-batch?tab=exams"
    />
  );
}
