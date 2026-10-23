import { Metadata } from "next";
import { getCurrentSession } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { getSessionsForDateAction, getPlannerMetadataAction } from "@/app/actions/routine";
import { tomorrowDhaka } from "@/lib/dhaka-time";
import { TomorrowBoardClient } from "@/components/routine/TomorrowBoardClient";

export const metadata: Metadata = {
  title: "Tomorrow Board | Class Routine | ScienceLab",
  description: "Next-day class scheduling, reassignments, reschedules, and duty tracking",
};

export const dynamic = "force-dynamic";

export default async function TomorrowRoutinePage() {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!["ADMIN", "STAFF"].includes(session.user.role)) {
    redirect("/admin-route/dashboard");
  }

  const tomorrowDate = tomorrowDhaka();

  const [sessionsRes, metadataRes] = await Promise.all([
    getSessionsForDateAction(tomorrowDate),
    getPlannerMetadataAction(),
  ]);

  return (
    <div className="py-6 px-4 md:px-6">
      <TomorrowBoardClient
        tomorrowDate={tomorrowDate}
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
