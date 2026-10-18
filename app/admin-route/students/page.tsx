import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { StudentList } from "@/components/StudentList";
import { getStudentsAction, getSchoolsAction, getBatchesAction } from "@/app/actions/data";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { Printer } from "lucide-react";

export default async function StudentsPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || "STAFF";

  const [students, schools, batches] = await Promise.all([
    getStudentsAction(),
    getSchoolsAction(),
    getBatchesAction(),
  ]);

  return (
    <div>
      <PageHeader
        title="Student Directory"
        description="Manage enrollments, academic records, and batch assignments."
      >
        <Link
          href="/admin-route/students/print"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors shadow-xs"
        >
          <Printer className="h-3.5 w-3.5 text-zinc-500" />
          <span>Print Roster</span>
        </Link>
      </PageHeader>

      <StudentList
        initialStudents={students}
        schools={schools}
        batches={batches}
        role={role}
      />
    </div>
  );
}
