import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getTeachersAction } from "@/app/actions/data";
import { TeacherList } from "@/components/TeacherList";

export default async function TeachersPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || "STAFF";

  const teachers = await getTeachersAction();

  return (
    <div className="py-6 px-4 md:px-6">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Teacher Registry</h1>
        <p className="text-gray-500 mt-1">Manage instructor profiles, contact details, and payment terms.</p>
      </div>

      <TeacherList initialTeachers={teachers} role={role} />
    </div>
  );
}
