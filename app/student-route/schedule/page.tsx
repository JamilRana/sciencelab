import { Metadata } from "next";
import { getCurrentSession } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { getStudentScheduleAction } from "@/app/actions/routine";
import { StudentScheduleClient } from "@/components/routine/StudentScheduleClient";

export const metadata: Metadata = {
  title: "My Class Schedule | Student Portal | ScienceLab",
  description: "View daily academic routine, rescheduled classes, and room allocations",
};

export const dynamic = "force-dynamic";

export default async function StudentSchedulePage() {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!["STUDENT", "ADMIN", "STAFF"].includes(session.user.role)) {
    redirect("/login");
  }

  const scheduleRes = await getStudentScheduleAction("week");

  return (
    <div className="py-6 px-4 md:px-6">
      <StudentScheduleClient
        initialData={
          scheduleRes.data || {
            student: null,
            batch: null,
            range: "week",
            dates: [],
            sessions: [],
          }
        }
      />
    </div>
  );
}
