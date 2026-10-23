import { Metadata } from "next";
import { getCurrentSession } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTeacherAgendaAction } from "@/app/actions/routine";
import { TeacherAgendaClient } from "@/components/routine/TeacherAgendaClient";

export const metadata: Metadata = {
  title: "My Class Routine & Agenda | Faculty Portal | ScienceLab",
  description: "View assigned classes, exam duties, schedules, and batch routines",
};

export const dynamic = "force-dynamic";

export default async function TeacherRoutinePage() {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!["TEACHER", "ADMIN", "STAFF"].includes(session.user.role)) {
    redirect("/login");
  }

  const [agendaRes, batches] = await Promise.all([
    getTeacherAgendaAction("today"),
    prisma.batch.findMany({
      select: { id: true, name: true, code: true, classId: true },
      orderBy: [{ classId: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <div className="py-6 px-4 md:px-6">
      <TeacherAgendaClient
        initialData={
          agendaRes.data || {
            teacher: null,
            range: "today",
            dates: [],
            sessions: [],
          }
        }
        batches={batches}
      />
    </div>
  );
}
