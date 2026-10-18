import { notFound } from "next/navigation";
import { getSpecialExamDetailsAction } from "@/app/actions/special-exams";
import { PrintSignatureSheet } from "@/components/special-batch/PrintSignatureSheet";

export const dynamic = "force-dynamic";

export default async function SpecialExamSignatureSheetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ subjectId?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const examId = parseInt(resolvedParams.id);
  const subjectId = resolvedSearchParams.subjectId
    ? parseInt(resolvedSearchParams.subjectId)
    : undefined;

  if (isNaN(examId)) {
    notFound();
  }

  const result = await getSpecialExamDetailsAction(examId);

  if (!result.success || !result.data) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-zinc-200">
        <h3 className="text-base font-bold text-zinc-900">Exam Details Not Found</h3>
        <p className="text-xs text-zinc-500 mt-1">
          {result.error || "The requested special exam could not be loaded."}
        </p>
      </div>
    );
  }

  const exam = result.data;

  // Transform subjects
  const subjectsConfig = exam.subjects.map((s) => ({
    id: s.id,
    name: s.programSubject?.name || "General Subject",
    code: s.programSubject?.code || undefined,
    teacherName: s.teacher?.name,
    cqMax: s.cqMax,
    mcqMax: s.mcqMax,
    practicalMax: s.practicalMax,
    totalMax: s.totalMax,
  }));

  // Resolve students: batch-specific or program-wide
  const rawStudents = (exam.batch?.students && exam.batch.students.length > 0)
    ? exam.batch.students
    : ((exam as any).allStudents || []);

  const students = rawStudents.map((stu: any) => ({
    id: stu.id,
    name: stu.name,
    roll: stu.roll,
    gender: stu.gender,
    batchName: stu.batch?.name || exam.batch?.name || "",
    batchCode: stu.batch?.code || exam.batch?.code || 0,
    schoolName: stu.school?.name,
  }));

  return (
    <PrintSignatureSheet
      exam={{
        id: exam.id,
        title: exam.title,
        kind: exam.kind,
        examDate: exam.examDate,
        program: exam.program,
        batch: exam.batch as any,
      }}
      subjects={subjectsConfig}
      initialSubjectId={subjectId}
      students={students}
    />
  );
}
