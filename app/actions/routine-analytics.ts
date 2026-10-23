"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import { toDhakaDbDate, fromDhakaDbDate, getDhakaMonthRange } from "@/lib/dhaka-time";

export interface RoutineAnalyticsFilters {
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  teacherId?: number;
  batchId?: number;
  programId?: number;
}

export interface RoutineAnalyticsSummary {
  totalSessions: number;
  conductedClasses: number;
  examDutiesCount: number;
  examDutiesPay: number;
  cancelledCount: number;
  rescheduledCount: number;
  cancellationRate: number;
}

export interface TeacherBatchRoutineStat {
  teacherId: number;
  teacherName: string;
  batchId: number | null;
  batchName: string;
  programId: number | null;
  programName: string;
  conductedCount: number;
  scheduledCount: number;
  cancelledCount: number;
  rescheduledCount: number;
  totalCount: number;
  subjects: string[];
}

export interface TeacherDutyStat {
  teacherId: number;
  teacherName: string;
  totalDuties: number;
  conductedDuties: number;
  totalPay: number;
  pendingAmountCount: number;
  duties: Array<{
    id: number;
    date: string;
    startTime: string;
    examTitle: string;
    payAmount: number | null;
    status: string;
  }>;
}

export interface CancellationReasonStat {
  reason: string;
  count: number;
  percentage: number;
}

export interface CancelledSessionDetail {
  id: number;
  date: string;
  startTime: string;
  teacherName: string;
  batchName: string;
  subjectName: string;
  kind: string;
  status: string;
  reason: string;
}

export interface RoutineAnalyticsData {
  filters: {
    startDate: string;
    endDate: string;
    teacherId?: number;
    batchId?: number;
    programId?: number;
  };
  summary: RoutineAnalyticsSummary;
  teacherBatchMatrix: TeacherBatchRoutineStat[];
  teacherDuties: TeacherDutyStat[];
  cancellationAnalysis: {
    byReason: CancellationReasonStat[];
    cancelledSessions: CancelledSessionDetail[];
  };
  metadata: {
    teachers: Array<{ id: number; name: string }>;
    batches: Array<{ id: number; name: string }>;
    programs: Array<{ id: number; name: string }>;
  };
}

/**
 * Returns routine analytics and breakdown reports for a given date range.
 * Requires ADMIN or STAFF role.
 */
export async function getRoutineAnalyticsAction(
  filters: RoutineAnalyticsFilters = {}
): Promise<{ success: boolean; data?: RoutineAnalyticsData; error?: string }> {
  await requireRole(["ADMIN", "STAFF"]);

  try {
    const defaultRange = getDhakaMonthRange();
    const startDateStr = filters.startDate || defaultRange.startDate;
    const endDateStr = filters.endDate || defaultRange.endDate;

    const startDbDate = toDhakaDbDate(startDateStr);
    const endDbDate = toDhakaDbDate(endDateStr);

    const whereClause: any = {
      date: {
        gte: startDbDate,
        lte: endDbDate,
      },
    };

    if (filters.teacherId) {
      whereClause.teacherId = filters.teacherId;
    }
    if (filters.batchId) {
      whereClause.batchId = filters.batchId;
    }
    if (filters.programId) {
      whereClause.programId = filters.programId;
    }

    const [sessions, teachers, batches, programs] = await Promise.all([
      prisma.classSession.findMany({
        where: whereClause,
        include: {
          teacher: { select: { id: true, name: true } },
          batch: { select: { id: true, name: true } },
          program: { select: { id: true, name: true } },
          exam: { select: { id: true, type: true, month: true, class: true } },
          specialExam: { select: { id: true, title: true } },
        },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      }),
      prisma.teacher.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.batch.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.program.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    // 1. Calculate Summary KPIs
    let totalSessions = sessions.length;
    let conductedClasses = 0;
    let examDutiesCount = 0;
    let examDutiesPay = 0;
    let cancelledCount = 0;
    let rescheduledCount = 0;

    for (const s of sessions) {
      if (s.status === "CANCELLED") {
        cancelledCount++;
      } else if (s.status === "RESCHEDULED") {
        rescheduledCount++;
      }

      if (s.kind === "EXAM_DUTY") {
        examDutiesCount++;
        if (s.payAmount != null && s.status !== "CANCELLED") {
          examDutiesPay += s.payAmount;
        }
      } else if (s.status === "CONDUCTED" || s.status === "SCHEDULED") {
        conductedClasses++;
      }
    }

    const cancellationRate = totalSessions > 0
      ? Math.round(((cancelledCount + rescheduledCount) / totalSessions) * 1000) / 10
      : 0;

    // 2. Teacher x Batch breakdown (for non-exam sessions)
    const tbMap = new Map<string, TeacherBatchRoutineStat>();

    for (const s of sessions) {
      if (s.kind === "EXAM_DUTY") continue;

      const key = `${s.teacherId}:${s.batchId || 0}`;
      let item = tbMap.get(key);

      if (!item) {
        item = {
          teacherId: s.teacherId,
          teacherName: s.teacher?.name || `Teacher #${s.teacherId}`,
          batchId: s.batchId,
          batchName: s.batch?.name || "No Batch",
          programId: s.programId,
          programName: s.program?.name || "-",
          conductedCount: 0,
          scheduledCount: 0,
          cancelledCount: 0,
          rescheduledCount: 0,
          totalCount: 0,
          subjects: [],
        };
        tbMap.set(key, item);
      }

      item.totalCount++;
      if (s.status === "CONDUCTED") item.conductedCount++;
      else if (s.status === "SCHEDULED") item.scheduledCount++;
      else if (s.status === "CANCELLED") item.cancelledCount++;
      else if (s.status === "RESCHEDULED") item.rescheduledCount++;

      if (s.subjectName && !item.subjects.includes(s.subjectName)) {
        item.subjects.push(s.subjectName);
      }
    }

    const teacherBatchMatrix = Array.from(tbMap.values()).sort((a, b) => {
      const nameCompare = a.teacherName.localeCompare(b.teacherName);
      if (nameCompare !== 0) return nameCompare;
      return a.batchName.localeCompare(b.batchName);
    });

    // 3. Duty totals breakdown
    const dutyMap = new Map<number, TeacherDutyStat>();

    for (const s of sessions) {
      if (s.kind !== "EXAM_DUTY") continue;

      let stat = dutyMap.get(s.teacherId);
      if (!stat) {
        stat = {
          teacherId: s.teacherId,
          teacherName: s.teacher?.name || `Teacher #${s.teacherId}`,
          totalDuties: 0,
          conductedDuties: 0,
          totalPay: 0,
          pendingAmountCount: 0,
          duties: [],
        };
        dutyMap.set(s.teacherId, stat);
      }

      stat.totalDuties++;
      if (s.status === "CONDUCTED" || s.status === "SCHEDULED") {
        stat.conductedDuties++;
      }

      if (s.payAmount != null) {
        if (s.status !== "CANCELLED") {
          stat.totalPay += s.payAmount;
        }
      } else {
        stat.pendingAmountCount++;
      }

      const examTitle = s.specialExam?.title || (s.exam ? `${s.exam.type} (${s.exam.month})` : "Exam Duty");

      stat.duties.push({
        id: s.id,
        date: fromDhakaDbDate(s.date),
        startTime: s.startTime,
        examTitle,
        payAmount: s.payAmount,
        status: s.status,
      });
    }

    const teacherDuties = Array.from(dutyMap.values()).sort((a, b) =>
      a.teacherName.localeCompare(b.teacherName)
    );

    // 4. Cancellation & Reschedule Analysis
    const reasonCounts = new Map<string, number>();
    const cancelledSessions: CancelledSessionDetail[] = [];

    for (const s of sessions) {
      if (s.status === "CANCELLED" || s.status === "RESCHEDULED") {
        const rawReason = s.changeReason?.trim() || "Unspecified / General";
        reasonCounts.set(rawReason, (reasonCounts.get(rawReason) || 0) + 1);

        cancelledSessions.push({
          id: s.id,
          date: fromDhakaDbDate(s.date),
          startTime: s.startTime,
          teacherName: s.teacher?.name || "-",
          batchName: s.batch?.name || "-",
          subjectName: s.subjectName || (s.kind === "EXAM_DUTY" ? "Exam Duty" : "-"),
          kind: s.kind,
          status: s.status,
          reason: rawReason,
        });
      }
    }

    const totalCancellations = cancelledCount + rescheduledCount;
    const byReason: CancellationReasonStat[] = Array.from(reasonCounts.entries())
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: totalCancellations > 0 ? Math.round((count / totalCancellations) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      success: true,
      data: {
        filters: {
          startDate: startDateStr,
          endDate: endDateStr,
          teacherId: filters.teacherId,
          batchId: filters.batchId,
          programId: filters.programId,
        },
        summary: {
          totalSessions,
          conductedClasses,
          examDutiesCount,
          examDutiesPay,
          cancelledCount,
          rescheduledCount,
          cancellationRate,
        },
        teacherBatchMatrix,
        teacherDuties,
        cancellationAnalysis: {
          byReason,
          cancelledSessions,
        },
        metadata: {
          teachers,
          batches,
          programs,
        },
      },
    };
  } catch (error: any) {
    console.error("[getRoutineAnalyticsAction] Error:", error);
    return {
      success: false,
      error: error.message || "Failed to generate routine analytics",
    };
  }
}
