import { getBatchesAction, getSchoolsAction } from "@/app/actions/data";
import { BatchesAndSchoolsHub } from "@/components/batches/BatchesAndSchoolsHub";

export default async function SchoolsPage() {
  const [batches, schools] = await Promise.all([
    getBatchesAction(),
    getSchoolsAction(),
  ]);

  return (
    <div className="py-6 px-4 md:px-6 max-w-7xl mx-auto">
      <BatchesAndSchoolsHub
        initialBatches={batches}
        initialSchools={schools}
        defaultTab="schools"
      />
    </div>
  );
}
