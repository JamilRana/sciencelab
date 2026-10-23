import { Metadata } from "next";
import { getCurrentSession } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPrintableRoutineAction } from "@/app/actions/routine";
import { todayDhaka } from "@/lib/dhaka-time";
import { PrintRoutineClient } from "@/components/routine/PrintRoutineClient";

export const metadata: Metadata = {
  title: "Print Class Routine (A4) | ScienceLab",
  description: "Official printable daily routine and weekly batch timetable",
};

export const dynamic = "force-dynamic";

interface PrintPageProps {
  searchParams?: Promise<{ mode?: string; date?: string; batchId?: string }> | { mode?: string; date?: string; batchId?: string };
}

export default async function PrintRoutinePage({ searchParams }: PrintPageProps) {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!["ADMIN", "STAFF", "TEACHER"].includes(session.user.role)) {
    redirect("/admin-route/dashboard");
  }

  const resolvedParams = await searchParams;
  const mode = (resolvedParams?.mode as "day" | "batch_week") || "day";
  const targetDate = resolvedParams?.date || todayDhaka();
  const targetBatchId = resolvedParams?.batchId ? parseInt(resolvedParams.batchId, 10) : undefined;

  const [printDataRes, batches] = await Promise.all([
    getPrintableRoutineAction({
      view: mode,
      date: targetDate,
      batchId: targetBatchId,
    }),
    prisma.batch.findMany({
      select: { id: true, name: true, code: true, classId: true },
      orderBy: [{ classId: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <PrintRoutineClient
      initialMode={mode}
      initialDate={targetDate}
      initialBatchId={targetBatchId || batches[0]?.id}
      batches={batches}
      dailyData={mode === "day" ? (printDataRes.data as any) : undefined}
      weeklyData={mode === "batch_week" ? (printDataRes.data as any) : undefined}
    />
  );
}
