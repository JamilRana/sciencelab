import { Metadata } from "next";
import { getCurrentSession } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getNotificationLogsAction, getJobRunsAction } from "@/app/actions/notifications";
import { NotificationLogClient } from "@/components/routine/NotificationLogClient";

export const metadata: Metadata = {
  title: "Notification Center & Logs | ScienceLab",
  description: "View and manage routine notification logs, delivery reports, and cron jobs",
};

export const dynamic = "force-dynamic";

export default async function NotificationLogPage() {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!["ADMIN", "STAFF"].includes(session.user.role)) {
    redirect("/admin-route/dashboard");
  }

  const [logsRes, jobsRes, teachers] = await Promise.all([
    getNotificationLogsAction({ take: 50 }),
    getJobRunsAction(25),
    prisma.teacher.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="py-6 px-4 md:px-6">
      <NotificationLogClient
        initialLogs={logsRes.data || []}
        initialTotal={logsRes.total || 0}
        initialJobRuns={jobsRes.data || []}
        teachers={teachers}
      />
    </div>
  );
}
