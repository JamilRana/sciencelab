import { prisma } from "@/lib/prisma";
import { PrintExamSchedule } from "@/components/PrintExamSchedule";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PrintExamPage({ params }: PageProps) {
  const resolvedParams = await params;
  const examId = parseInt(resolvedParams.id, 10);

  if (isNaN(examId)) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-zinc-200 max-w-lg mx-auto my-12">
        <h1 className="text-xl font-bold text-zinc-900">Invalid Exam ID</h1>
        <p className="text-xs text-zinc-500 mt-1">Please select a valid exam schedule.</p>
        <Link
          href="/admin-route/exams"
          className="inline-block mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
        >
          ← Back to Exams
        </Link>
      </div>
    );
  }

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      subjects: {
        include: { teacher: true },
        orderBy: { examDate: "asc" },
      },
    },
  });

  if (!exam) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-zinc-200 max-w-lg mx-auto my-12">
        <h1 className="text-xl font-bold text-zinc-900">Exam not found</h1>
        <p className="text-xs text-zinc-500 mt-1">The requested assessment schedule does not exist.</p>
        <Link
          href="/admin-route/exams"
          className="inline-block mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
        >
          ← Back to Exams
        </Link>
      </div>
    );
  }

  return <PrintExamSchedule exam={exam as any} />;
}
