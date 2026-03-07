import { prisma } from "@/lib/prisma";
import { PrintExamSchedule } from "@/components/PrintExamSchedule";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function PrintExamPage({ params }: { params: { id: string } }) {
  const examId = parseInt(params.id);

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
      <div className="p-8">
        <h1 className="text-2xl font-bold">Exam not found</h1>
        <Link href="/admin-route/exams" className="text-blue-600 hover:underline">
          Back to Exams
        </Link>
      </div>
    );
  }

  return <PrintExamSchedule exam={exam as any} />;
}
