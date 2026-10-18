import { getSpecialProgramsAction, getSpecialCourseFeesAction } from "@/app/actions/course-fees";
import { getSpecialExamsAction } from "@/app/actions/special-exams";
import { getCompiledMarksheetsAction } from "@/app/actions/compiled-marksheets";
import { SpecialBatchHub } from "@/components/special-batch/SpecialBatchHub";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SpecialBatchPage() {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role;
  const isAdmin = userRole === "ADMIN";

  const [programsRes, examsRes, feesRes, compilationsRes] = await Promise.all([
    getSpecialProgramsAction(),
    getSpecialExamsAction(),
    isAdmin ? getSpecialCourseFeesAction() : Promise.resolve({ success: true, data: [] }),
    getCompiledMarksheetsAction(),
  ]);

  const programs = programsRes.success && programsRes.data ? programsRes.data : [];
  const specialExams = examsRes.success && examsRes.data ? examsRes.data : [];
  const courseFees = feesRes.success && feesRes.data ? feesRes.data : [];
  const compiledMarksheets = compilationsRes.success && compilationsRes.data ? compilationsRes.data : [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <SpecialBatchHub
        userRole={userRole}
        programs={programs}
        specialExams={specialExams}
        courseFees={courseFees}
        compiledMarksheets={compiledMarksheets}
      />
    </div>
  );
}
