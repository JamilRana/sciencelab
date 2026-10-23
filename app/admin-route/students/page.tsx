import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { StudentList } from "@/components/StudentList";
import { getStudentsAction, getSchoolsAction, getBatchesAction } from "@/app/actions/data";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { Printer, Archive, Sparkles, GraduationCap } from "lucide-react";

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
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin-route/students/archived"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors shadow-2xs"
          >
            <Archive className="h-3.5 w-3.5 text-amber-600" />
            <span>Archived Students</span>
          </Link>
          <Link
            href="/admin-route/class-ten-lifecycle"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors shadow-2xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span>Class 10 & SSC</span>
          </Link>
          <Link
            href="/admin-route/promotion"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors shadow-2xs"
          >
            <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
            <span>Promotion</span>
          </Link>
          <Link
            href="/admin-route/students/print"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 text-zinc-500" />
            <span>Print Roster</span>
          </Link>
        </div>
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
