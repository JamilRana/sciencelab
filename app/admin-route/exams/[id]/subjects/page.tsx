import { prisma } from "@/lib/prisma";
import { SubjectList } from "@/components/SubjectList";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { ChevronLeft, Printer } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ExamSubjectsPage({ params }: PageProps) {
  const { id } = await params;
  const examId = parseInt(id, 10);
  
  if (isNaN(examId)) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-zinc-200 max-w-lg mx-auto my-12">
        <h1 className="text-xl font-bold text-zinc-900">Invalid Exam ID</h1>
        <p className="text-xs text-zinc-500 mt-1">Please select a valid exam schedule.</p>
        <Link href="/admin-route/exams" className="inline-block mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-800">
          ← Back to Exams
        </Link>
      </div>
    );
  }

  // Get current user session
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id ? Number(session.user.id) : undefined;
  const currentUserRole = session?.user?.role;

  const [exam, subjects, teachers] = await Promise.all([
    prisma.exam.findUnique({ where: { id: examId } }),
    prisma.examSubject.findMany({
      where: { examId },
      include: { teacher: true },
      orderBy: { examDate: "asc" },
    }),
    prisma.teacher.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!exam) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-zinc-200 max-w-lg mx-auto my-12">
        <h1 className="text-xl font-bold text-zinc-900">Exam not found</h1>
        <p className="text-xs text-zinc-500 mt-1">The requested assessment schedule does not exist.</p>
        <Link href="/admin-route/exams" className="inline-block mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-800">
          ← Back to Exams
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto py-8 px-4">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link 
              href="/admin-route/exams" 
              className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Back to Exams</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {exam.type} - {exam.month} - Class {exam.class}
          </h1>
          <p className="text-gray-500 mt-1">Manage subjects and schedule for this exam.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Link
            href={`/admin-route/exams/${examId}/print`}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg transition-colors"
          >
            <Printer className="h-4 w-4" />
            Print Schedule
          </Link>
        </div>
      </div>

      <SubjectList 
        initialSubjects={subjects} 
        teachers={teachers} 
        examId={examId}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
      />
    </div>
  );
}
