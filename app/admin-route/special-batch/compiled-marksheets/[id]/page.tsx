import { getCompiledMarksheetDetailsAction } from "@/app/actions/compiled-marksheets";
import { CompiledMarksheetViewerClient } from "@/components/special-batch/CompiledMarksheetViewerClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface CompiledMarksheetPageProps {
  params: Promise<{ id: string }>;
}

export default async function CompiledMarksheetPage({ params }: CompiledMarksheetPageProps) {
  const { id } = await params;
  const marksheetId = parseInt(id, 10);

  if (isNaN(marksheetId)) {
    notFound();
  }

  const res = await getCompiledMarksheetDetailsAction(marksheetId);
  if (!res.success || !res.data) {
    notFound();
  }

  const { marksheet, processed } = res.data;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <CompiledMarksheetViewerClient marksheet={marksheet} processed={processed} />
    </div>
  );
}
