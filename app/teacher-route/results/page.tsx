import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ExamList } from "@/components/ExamList";
import { getExamsAction } from "@/app/actions/data";
import { prisma } from "@/lib/prisma";

export default async function ExamsPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || "STAFF";
  const teacherId = session?.user?.teacherId;
  const studentId = session?.user?.studentId;

  const exams = await getExamsAction();

  let studentClass: string | undefined;
  if (role === "STUDENT" && studentId) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { class: true },
    });
    studentClass = student?.class;
  }

  return (
    <div className="py-6 px-4 md:px-6">
      <div className="mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Exam Schedule</h1>
          <p className="text-gray-500 mt-1">
            {role === "STUDENT" ? "View your exam results." : role === "TEACHER" ? "Manage exams and record marks." : "Plan assessments, manage subjects, and record results."}
          </p>
        </div>
      </div>

      <ExamList 
        initialExams={exams} 
        role={role} 
        teacherId={teacherId}
        studentClass={studentClass}
        studentId={studentId}
      />
    </div>
  );
}
