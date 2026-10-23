import { getSpecialExamDetailsAction } from "@/app/actions/special-exams";
import { SpecialMarksEntryClient } from "@/components/special-batch/SpecialMarksEntryClient";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface MarksPageProps {
  params: Promise<{ id: string }>;
}

export default async function TeacherSpecialExamMarksPage({ params }: MarksPageProps) {
  const session = await requireRole(["TEACHER", "ADMIN", "STAFF"]);
  const { id } = await params;
  const examId = parseInt(id, 10);

  if (isNaN(examId)) {
    notFound();
  }

  // Find teacherId if role is TEACHER
  let teacherId = session.teacherId;
  if (!teacherId && session.role === "TEACHER") {
    const teacher = await prisma.teacher.findFirst({
      where: {
        OR: [
          { userId: parseInt(session.id, 10) },
          { mobile: session.username },
        ],
      },
      select: { id: true },
    });
    teacherId = teacher?.id;
  }

  const res = await getSpecialExamDetailsAction(examId);
  if (!res.success || !res.data) {
    notFound();
  }

  const exam = res.data;

  // If teacher, filter subjects to only those assigned to this teacher
  if (session.role === "TEACHER") {
    const assignedSubjects = (exam.subjects || []).filter(
      (s: any) => s.teacherId === teacherId
    );

    if (assignedSubjects.length === 0) {
      return (
        <div className="max-w-4xl mx-auto py-12 px-4 text-center">
          <div className="bg-white rounded-2xl border border-rose-200 p-8 shadow-sm">
            <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
            <h1 className="text-xl font-bold text-gray-900">Access Restricted</h1>
            <p className="text-sm text-gray-500 mt-2">
              You are not assigned to any subjects in this special batch exam.
            </p>
            <Link
              href="/teacher-route/exams?tab=special"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to My Exams
            </Link>
          </div>
        </div>
      );
    }

    exam.subjects = assignedSubjects;
  }

  const students = (exam as any).allStudents || exam.batch?.students || [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <SpecialMarksEntryClient
        exam={exam}
        students={students}
        isTeacher={session.role === "TEACHER"}
        backUrl="/teacher-route/exams?tab=special"
      />
    </div>
  );
}
