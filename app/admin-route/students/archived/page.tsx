import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getArchivedStudentsAction } from "@/app/actions/archiving";
import { getBatchesAction } from "@/app/actions/data";
import { ArchivedStudentsList } from "@/components/students/ArchivedStudentsList";

export const metadata = {
  title: "Archived Students Directory | Science Lab",
  description: "View, filter, print, and restore archived students and alumni records.",
};

export default async function ArchivedStudentsPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (!role || (role !== "ADMIN" && role !== "STAFF")) {
    redirect("/admin-route/dashboard");
  }

  const [archivedRes, batches] = await Promise.all([
    getArchivedStudentsAction(),
    getBatchesAction(),
  ]);

  const students = archivedRes.success && archivedRes.data ? archivedRes.data : [];

  return (
    <div className="py-6 px-4 md:px-6 max-w-7xl mx-auto">
      <ArchivedStudentsList initialStudents={students} batches={batches} />
    </div>
  );
}
