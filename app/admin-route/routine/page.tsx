import { Metadata } from "next";
import { getCurrentSession } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { getSessionsForDateAction, getPlannerMetadataAction } from "@/app/actions/routine";
import { todayDhaka } from "@/lib/dhaka-time";
import { DayPlannerClient } from "@/components/routine/DayPlannerClient";

export const metadata: Metadata = {
  title: "Class Routine & Day Planner | ScienceLab",
  description: "Schedule, coordinate, and review daily classes and exam duties",
};

export const dynamic = "force-dynamic";

interface RoutinePageProps {
  searchParams?: Promise<{ date?: string }> | { date?: string };
}

export default async function RoutinePage({ searchParams }: RoutinePageProps) {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!["ADMIN", "STAFF"].includes(session.user.role)) {
    redirect("/admin-route/dashboard");
  }

  const resolvedSearchParams = await searchParams;
  const targetDate = resolvedSearchParams?.date || todayDhaka();

  const [sessionsRes, metadataRes] = await Promise.all([
    getSessionsForDateAction(targetDate),
    getPlannerMetadataAction(),
  ]);

  return (
    <div className="py-6 px-4 md:px-6">
      <DayPlannerClient
        initialDate={targetDate}
        initialSessions={sessionsRes.data || []}
        metadata={
          metadataRes.data || {
            teachers: [],
            batches: [],
            programs: [],
            exams: [],
            specialExams: [],
          }
        }
      />
    </div>
  );
}
