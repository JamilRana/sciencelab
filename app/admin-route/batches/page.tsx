import { getBatchesAction } from "@/app/actions/data";
import { BatchList } from "@/components/BatchList";

export default async function BatchesPage() {
  const batches = await getBatchesAction();

  return (
    <div className="max-w-[800px] mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Batch Management</h1>
        <p className="text-gray-500 mt-1">Define and organize classes and batches.</p>
      </div>

      <BatchList initialBatches={batches} />
    </div>
  );
}
