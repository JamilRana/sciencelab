import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { StudentList } from "@/components/StudentList";
import { getStudentsAction, getSchoolsAction, getBatchesAction } from "@/app/actions/data";

export default async function StudentsPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || "STAFF";

  const [students, schools, batches] = await Promise.all([
    getStudentsAction(),
    getSchoolsAction(),
    getBatchesAction(),
  ]);

  return (
    <div className="py-6 px-4 md:px-6">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Student Directory</h1>
        <p className="text-gray-500 mt-1">Manage enrollments, profiles, and academic records.</p>
      </div>

      <StudentList 
        initialStudents={students} 
        schools={schools} 
        batches={batches}
        role={role}
      />
    </div>
  );
}
