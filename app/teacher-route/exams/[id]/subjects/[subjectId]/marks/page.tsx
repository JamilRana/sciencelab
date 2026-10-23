import { prisma } from "@/lib/prisma";
import { MarksEntryForm } from "@/components/forms/MarksEntryForm";
import Link from "next/link";
import { ChevronLeft, FileText, User, Calendar, AlertTriangle } from "lucide-react";
import { requireRole } from "@/lib/auth-guard";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string; subjectId: string }>;
}

export default async function TeacherSubjectMarksPage({ params }: PageProps) {
  const session = await requireRole(["TEACHER", "ADMIN", "STAFF"]);
  const { id: examId, subjectId } = await params;
  const examIdNum = parseInt(examId, 10);
  const subjectIdNum = parseInt(subjectId, 10);

  if (isNaN(examIdNum) || isNaN(subjectIdNum)) {
    notFound();
  }

  // Find teacher if role is TEACHER
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

  // Fetch exam subject with exam details
  const subject = await prisma.examSubject.findUnique({
    where: { id: subjectIdNum },
    include: {
      exam: true,
      teacher: { select: { id: true, name: true } },
      marks: {
        where: {
          student: { active: true },
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              roll: true,
              batch: { select: { id: true, code: true } },
            },
          },
        },
      },
    },
  });

  if (!subject) {
    notFound();
  }

  // Check assignment if teacher
  if (session.role === "TEACHER" && subject.teacherId !== teacherId) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="bg-white rounded-2xl border border-rose-200 p-8 shadow-sm">
          <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-gray-900">Access Restricted</h1>
          <p className="text-sm text-gray-500 mt-2">
            You are not assigned to this subject. Teachers can only enter marks for their assigned subjects.
          </p>
          <Link
            href="/teacher-route/exams"
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition"
          >
            Back to My Exams
          </Link>
        </div>
      </div>
    );
  }

  // Fetch all students for this class (regular batches only)
  const allStudents = await prisma.student.findMany({
    where: { class: subject.exam.class, active: true, batch: { programId: null } },
    include: {
      batch: { select: { id: true, name: true, code: true } },
    },
    orderBy: [
      { batch: { code: "asc" } },
      { roll: "asc" },
    ],
  });

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Link
            href="/teacher-route/exams"
            className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Back to My Exams
          </span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                {subject.subject}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span>{subject.exam.type} ({subject.exam.month})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>Class {subject.exam.class}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>Max Marks: {subject.totalMark}</span>
                </div>
              </div>
            </div>

            <Link
              href={`/teacher-route/results/${examIdNum}`}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 rounded-xl text-xs font-semibold transition"
            >
              View Merit / Results
            </Link>
          </div>
        </div>
      </div>

      {/* Marks Entry Form */}
      <MarksEntryForm
        subject={subject}
        students={allStudents}
        batchId={allStudents[0]?.batch?.id || 0}
        isTeacher={session.role === "TEACHER"}
      />
    </div>
  );
}
