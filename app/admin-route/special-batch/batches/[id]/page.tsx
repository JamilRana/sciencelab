import { notFound } from "next/navigation";
import { getSpecialBatchDetailsAction } from "@/app/actions/special-batch-detail";
import { SpecialBatchDetailClient } from "@/components/special-batch/SpecialBatchDetailClient";

export const dynamic = "force-dynamic";

interface SpecialBatchDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SpecialBatchDetailPage({
  params,
}: SpecialBatchDetailPageProps) {
  const { id } = await params;
  const batchId = parseInt(id, 10);

  if (isNaN(batchId)) {
    notFound();
  }

  const res = await getSpecialBatchDetailsAction(batchId);
  if (!res.success || !res.data) {
    notFound();
  }

  const { batch, program, kpis, students, exams, compilations, isAdmin } =
    res.data;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <SpecialBatchDetailClient
        batch={batch}
        program={program}
        kpis={kpis}
        students={students}
        exams={exams}
        compilations={compilations}
        isAdmin={isAdmin}
      />
    </div>
  );
}
