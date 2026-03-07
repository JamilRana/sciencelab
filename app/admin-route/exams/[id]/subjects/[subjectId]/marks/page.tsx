import { prisma } from "@/lib/prisma";
import { MarksEntryForm } from "@/components/forms/MarksEntryForm";
import { getStudentsByBatchAction } from "@/app/actions/marks";
import Link from "next/link";
import { ChevronLeft, FileText, User, Calendar } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string; subjectId: string }>;
}

export default async function SubjectMarksPage({ params }: PageProps) {
  const { id: examId, subjectId } = await params;
  const examIdNum = parseInt(examId);
  const subjectIdNum = parseInt(subjectId);

  // Fetch exam subject with exam details
  const subject = await prisma.examSubject.findUnique({
    where: { id: subjectIdNum },
    include: {
      exam: true,
      teacher: { select: { id: true, name: true } },
      marks: {
        include: {
          student: { select: { id: true, name: true, roll: true, batch: { select: { id: true, code: true } } } },
        },
      },
    },
  });

  if (!subject) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Subject not found</h1>
          <Link href="/admin-route/exams" className="text-blue-600 hover:underline mt-2 inline-block">
            Back to Exams
          </Link>
        </div>
      </div>
    );
  }

  // Get unique batch IDs from students who have marks for this subject
  const batchIds = [...new Set(subject.marks.map(m => m.student.batch?.id).filter(Boolean) as number[])];
  
  // If no marks yet, get batch from exam
  let batches;
  if (batchIds.length > 0) {
    batches = await prisma.batch.findMany({
      where: { id: { in: batchIds } },
      select: { id: true, name: true, code: true },
      orderBy: { code: "asc" },
    });
  } else {
    // Default to first batch for this class
    batches = await prisma.batch.findMany({
      where: { classId: subject.exam.class },
      select: { id: true, name: true, code: true },
      orderBy: { code: "asc" },
      take: 1,
    });
  }

  const defaultBatchId = batches[0]?.id;
  
  // Fetch students for the selected batch
  let students: any[] = [];
  if (defaultBatchId) {
    const studentsResult = await getStudentsByBatchAction(defaultBatchId);
    students = studentsResult.success ? (studentsResult as any).students : [];
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Link 
            href={`/admin-route/exams/${examId}/subjects`}
            className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Back to Subjects</span>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                {subject.subject}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  <span>{subject.exam.type} - {subject.exam.month}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  <span>{subject.teacher?.name || "No teacher assigned"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(subject.examDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-blue-600">{subject.totalMark}</div>
              <div className="text-xs text-gray-400 font-bold uppercase">Max Marks</div>
            </div>
          </div>
        </div>
      </div>

      {/* Marks Entry Form */}
      {students.length > 0 ? (
        <MarksEntryForm
          subject={subject}
          students={students}
          batchId={defaultBatchId!}
        />
      ) : (
        <div className="bg-white rounded-xl shadow border p-12 text-center text-gray-500">
          <p className="text-lg font-medium">No students found for this batch</p>
          <p className="text-sm mt-2">Please ensure students are enrolled in the batch.</p>
        </div>
      )}
    </div>
  );
}
