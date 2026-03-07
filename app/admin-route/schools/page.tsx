import { SchoolList } from "@/components/SchoolList";
import { getSchoolsAction } from "@/app/actions/data";

export default async function SchoolsPage() {
  const schools = await getSchoolsAction();

  return (
    <div className="py-6 px-4 md:px-6">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Schools</h1>
        <p className="text-gray-500 mt-1">Manage schools and institutions.</p>
      </div>

      <SchoolList initialSchools={schools} />
    </div>
  );
}
