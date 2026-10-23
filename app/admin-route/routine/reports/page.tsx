import { Metadata } from "next";
import { getCurrentSession } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { getRoutineAnalyticsAction } from "@/app/actions/routine-analytics";
import { RoutineReportsClient } from "@/components/routine/RoutineReportsClient";

export const metadata: Metadata = {
  title: "Routine Analytics & Reports | ScienceLab",
  description: "Classes conducted per teacher, exam duty remunerations, and routine cancellation trends",
};

export const dynamic = "force-dynamic";

interface RoutineReportsPageProps {
  searchParams?: Promise<{
    startDate?: string;
    endDate?: string;
    teacherId?: string;
    batchId?: string;
  }> | {
    startDate?: string;
    endDate?: string;
    teacherId?: string;
    batchId?: string;
  };
}

export default async function RoutineReportsPage({ searchParams }: RoutineReportsPageProps) {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!["ADMIN", "STAFF"].includes(session.user.role)) {
    redirect("/admin-route/dashboard");
  }

  const resolvedParams = await searchParams;

  const res = await getRoutineAnalyticsAction({
    startDate: resolvedParams?.startDate,
    endDate: resolvedParams?.endDate,
    teacherId: resolvedParams?.teacherId ? parseInt(resolvedParams.teacherId, 10) : undefined,
    batchId: resolvedParams?.batchId ? parseInt(resolvedParams.batchId, 10) : undefined,
  });

  if (!res.success || !res.data) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-rose-600 font-medium">Failed to generate routine report</p>
        <p className="text-xs text-zinc-500 mt-1">{res.error || "Unknown error"}</p>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 md:px-6">
      <RoutineReportsClient initialData={res.data} />
    </div>
  );
}
