/**
 * Day-Close, Duty Pay & Automatic Class Logging Core Engine
 *
 * Implements Phase 6 of the Class Routine System:
 * - Automatically rolls uncounted past SCHEDULED sessions into TeacherClassLog.
 * - Auto-key grouping: teacherId:date:programId-or-0.
 * - Idempotent: safe to run multiple times without duplicate counting.
 * - Catch-up: processes all past uncounted sessions, not just yesterday's.
 * - Exam invigilation duty pay: duties with set payAmount add to dutyAmount;
 *   duties without amounts are held back in a "Needs Amount" list until configured.
 * - Full audit trails via SessionChangeLog and JobRun.
 * - Adjustment workflows: mark not held, move credit between faculty, edit row counts.
 */

import { prisma } from "@/lib/prisma";
import {
  todayDhaka,
  addDaysDhaka,
  toDhakaDbDate,
  toDhakaDateString,
  getDhakaMonthAbbr,
  formatDhakaDate,
  formatTime12h,
} from "@/lib/dhaka-time";
import { isTeacherMonthLocked, SessionActor } from "@/lib/sessions";

const TX_OPTIONS = { timeout: 15000, maxWait: 10000 };

export interface DayCloseResult {
  success: boolean;
  cutoffDate: string;
  totalCountedSessions: number;
  teacherDaysProcessed: number;
  totalDutiesCounted: number;
  needsAmountCount: number;
  needsAmountSessions: any[];
  jobRunId?: number;
  error?: string;
}

/**
 * Runs the Day-Close engine.
 *
 * Processes all uncounted SCHEDULED sessions with date <= cutoffDate.
 * By default, cutoffDate is yesterday (dated before today in Dhaka).
 * If forceDate is provided (e.g. staff clicks "Close day now" for today),
 * cutoffDate is set to that date.
 */
export async function runDayCloseJob(options?: {
  cutoffDate?: string;
  forceDate?: string;
  actor?: SessionActor;
}): Promise<DayCloseResult> {
  const today = todayDhaka();
  const effectiveCutoff = options?.forceDate || options?.cutoffDate || addDaysDhaka(today, -1);
  const cutoffDbDate = toDhakaDbDate(effectiveCutoff);

  const actorIdNum = options?.actor?.id
    ? typeof options.actor.id === "string"
      ? parseInt(options.actor.id, 10)
      : options.actor.id
    : null;
  const actorUsername = options?.actor?.username || "system-cron";

  // Create JobRun record
  const jobRun = await prisma.jobRun.create({
    data: {
      job: "DAY_CLOSE",
      forDate: effectiveCutoff,
      status: "RUNNING",
      startedAt: new Date(),
    },
  });

  try {
    // 1. Query all uncounted, uncancelled, unrescheduled sessions up to cutoffDate
    const sessions = await prisma.classSession.findMany({
      where: {
        date: { lte: cutoffDbDate },
        status: "SCHEDULED",
        countedLogId: null,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            perClass: true,
            rates: {
              select: {
                programId: true,
                lectureRate: true,
              },
            },
          },
        },
        batch: { select: { id: true, name: true, code: true, programId: true } },
        specialExam: { select: { id: true, title: true } },
        exam: { select: { id: true, type: true } },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    // 2. Separate into countable sessions and duties needing pay amount
    const countableSessions: typeof sessions = [];
    const needsAmountSessions: any[] = [];

    for (const s of sessions) {
      if (s.kind === "EXAM_DUTY") {
        if (s.payAmount === null || s.payAmount === undefined || isNaN(s.payAmount)) {
          // Rule 3: Duty with no amount is NOT counted as zero.
          // It stays uncounted and appears in "needs amount" list until set.
          needsAmountSessions.push({
            id: s.id,
            teacherId: s.teacherId,
            teacherName: s.teacher?.name,
            date: toDhakaDateString(s.date),
            startTime: s.startTime,
            examTitle: s.specialExam?.title || s.exam?.type || "Exam Duty",
            room: s.room,
          });
          continue;
        }
      }
      countableSessions.push(s);
    }

    // 3. Group countable sessions by autoKey: teacherId:date:programId-or-0
    const groupMap = new Map<
      string,
      {
        teacherId: number;
        teacher: any;
        dateString: string;
        programId: number | null;
        sessions: typeof sessions;
      }
    >();

    for (const s of countableSessions) {
      const dateString = toDhakaDateString(s.date);
      const programId = s.programId || s.batch?.programId || null;
      const autoKey = `${s.teacherId}:${dateString}:${programId || 0}`;

      if (!groupMap.has(autoKey)) {
        groupMap.set(autoKey, {
          teacherId: s.teacherId,
          teacher: s.teacher,
          dateString,
          programId,
          sessions: [],
        });
      }
      groupMap.get(autoKey)!.sessions.push(s);
    }

    let totalCountedSessions = 0;
    let totalDutiesCounted = 0;
    let teacherDaysProcessed = 0;

    // 4. Process each teacher-date-program group transactionally
    for (const [autoKey, group] of groupMap.entries()) {
      const { teacherId, teacher, dateString, programId, sessions: groupSessions } = group;

      // Determine rate: program lecture rate if exists, otherwise teacher.perClass
      let snapshotRate = teacher?.perClass || 0;
      if (programId && teacher?.rates) {
        const progRate = teacher.rates.find((r: any) => r.programId === programId);
        if (progRate && progRate.lectureRate > 0) {
          snapshotRate = progRate.lectureRate;
        }
      }

      const classSessions = groupSessions.filter((s) => s.kind !== "EXAM_DUTY");
      const dutySessions = groupSessions.filter((s) => s.kind === "EXAM_DUTY");

      const classCount = classSessions.length;
      const dutyTotal = dutySessions.reduce((sum, s) => sum + (s.payAmount || 0), 0);

      await prisma.$transaction(async (tx) => {
        // Find or create auto TeacherClassLog row by autoKey
        const log = await tx.teacherClassLog.upsert({
          where: { autoKey },
          update: {
            classes: { increment: classCount },
            dutyAmount: { increment: dutyTotal },
          },
          create: {
            teacherId,
            date: toDhakaDbDate(dateString),
            month: getDhakaMonthAbbr(dateString),
            source: "AUTO",
            classes: classCount,
            dutyAmount: dutyTotal,
            perClass: snapshotRate,
            notebook: 0,
            other: 0,
            paid: 0,
            programId,
            autoKey,
          },
        });

        // Mark all sessions in this group as CONDUCTED and link countedLogId
        for (const s of groupSessions) {
          await tx.classSession.update({
            where: { id: s.id },
            data: {
              status: "CONDUCTED",
              countedLogId: log.id,
              countedAt: new Date(),
            },
          });

          await tx.sessionChangeLog.create({
            data: {
              sessionId: s.id,
              action: "COUNT",
              before: { status: "SCHEDULED", countedLogId: null } as any,
              after: { status: "CONDUCTED", countedLogId: log.id } as any,
              reason: `Counted in day-close (log #${log.id}, autoKey: ${autoKey})`,
              byUserId: actorIdNum,
              byUsername: actorUsername,
            },
          });
        }
      }, TX_OPTIONS);

      totalCountedSessions += groupSessions.length;
      totalDutiesCounted += dutySessions.length;
      teacherDaysProcessed++;
    }

    const summary = {
      cutoffDate: effectiveCutoff,
      totalCountedSessions,
      totalDutiesCounted,
      teacherDaysProcessed,
      needsAmountCount: needsAmountSessions.length,
    };

    await prisma.jobRun.update({
      where: { id: jobRun.id },
      data: {
        status: "SUCCESS",
        finishedAt: new Date(),
        summary,
      },
    });

    return {
      success: true,
      cutoffDate: effectiveCutoff,
      totalCountedSessions,
      teacherDaysProcessed,
      totalDutiesCounted,
      needsAmountCount: needsAmountSessions.length,
      needsAmountSessions,
      jobRunId: jobRun.id,
    };
  } catch (err: any) {
    console.error("[runDayCloseJob] Error executing day-close:", err);
    await prisma.jobRun.update({
      where: { id: jobRun.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        error: err.message,
      },
    });

    return {
      success: false,
      cutoffDate: effectiveCutoff,
      totalCountedSessions: 0,
      teacherDaysProcessed: 0,
      totalDutiesCounted: 0,
      needsAmountCount: 0,
      needsAmountSessions: [],
      jobRunId: jobRun.id,
      error: err.message,
    };
  }
}

/**
 * Returns all EXAM_DUTY sessions dated up to today that need a pay amount.
 */
export async function getNeedsAmountDuties() {
  const sessions = await prisma.classSession.findMany({
    where: {
      kind: "EXAM_DUTY",
      payAmount: null,
      status: { notIn: ["CANCELLED", "RESCHEDULED"] },
    },
    include: {
      teacher: { select: { id: true, name: true, mobile: true } },
      specialExam: { select: { id: true, title: true } },
      exam: { select: { id: true, type: true } },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return sessions.map((s) => ({
    id: s.id,
    teacherId: s.teacherId,
    teacherName: s.teacher?.name || `Teacher #${s.teacherId}`,
    teacherMobile: s.teacher?.mobile || "",
    date: toDhakaDateString(s.date),
    formattedDate: formatDhakaDate(toDhakaDateString(s.date), "short"),
    startTime: formatTime12h(s.startTime),
    examTitle: s.specialExam?.title || s.exam?.type || "Invigilation Duty",
    room: s.room || "—",
    status: s.status,
  }));
}

/**
 * Adjustment 1: Mark a session as "not held".
 * Reverses the count from the teacher's class log and cancels the session.
 * Enforces month lock: Staff is blocked if teacher-month is locked.
 */
export async function markSessionNotHeld(
  sessionId: number,
  actor: SessionActor,
  reason: string
) {
  const actorIdNum = typeof actor.id === "string" ? parseInt(actor.id, 10) : actor.id;

  return await prisma.$transaction(async (tx) => {
    const session = await tx.classSession.findUnique({
      where: { id: sessionId },
      include: {
        teacher: { select: { id: true, name: true } },
      },
    });

    if (!session) {
      throw new Error(`Class session #${sessionId} not found`);
    }

    // Month-lock check
    if (actor.role !== "ADMIN") {
      const lock = await isTeacherMonthLocked(session.teacherId, session.date);
      if (lock.isLocked) {
        throw new Error(
          `Teacher ${session.teacher?.name}'s payment for ${lock.month} has already been processed. Only an Admin can mark past sessions not held.`
        );
      }
    }

    // If session was already counted in a class log, reverse the count
    if (session.countedLogId) {
      const log = await tx.teacherClassLog.findUnique({
        where: { id: session.countedLogId },
      });

      if (log) {
        if (session.kind === "EXAM_DUTY") {
          const dutySub = session.payAmount || 0;
          await tx.teacherClassLog.update({
            where: { id: log.id },
            data: {
              dutyAmount: Math.max(0, log.dutyAmount - dutySub),
            },
          });
        } else {
          await tx.teacherClassLog.update({
            where: { id: log.id },
            data: {
              classes: Math.max(0, log.classes - 1),
            },
          });
        }
      }
    }

    // Update session status to CANCELLED
    const updatedSession = await tx.classSession.update({
      where: { id: sessionId },
      data: {
        status: "CANCELLED",
        changeReason: `Marked not held: ${reason}`,
        updatedById: isNaN(actorIdNum) ? null : actorIdNum,
      },
    });

    // Write audit record
    await tx.sessionChangeLog.create({
      data: {
        sessionId,
        action: "ADJUST",
        before: session as any,
        after: updatedSession as any,
        reason: `Marked not held: ${reason} (Reversed log #${session.countedLogId || "none"})`,
        byUserId: isNaN(actorIdNum) ? null : actorIdNum,
        byUsername: actor.username || "system",
      },
    });

    return updatedSession;
  }, TX_OPTIONS);
}

/**
 * Adjustment 2: Change a session's teacher after counting.
 * Moves the credit from the old teacher to the new teacher.
 * Enforces month lock on both old and new teachers.
 */
export async function adjustCountedSessionTeacher(
  sessionId: number,
  newTeacherId: number,
  actor: SessionActor,
  reason: string
) {
  const actorIdNum = typeof actor.id === "string" ? parseInt(actor.id, 10) : actor.id;

  return await prisma.$transaction(async (tx) => {
    const session = await tx.classSession.findUnique({
      where: { id: sessionId },
      include: {
        teacher: { select: { id: true, name: true } },
        batch: { select: { id: true, name: true, programId: true } },
      },
    });

    if (!session) {
      throw new Error(`Class session #${sessionId} not found`);
    }

    const oldTeacherId = session.teacherId;
    if (oldTeacherId === newTeacherId) {
      throw new Error("New teacher is the same as current teacher");
    }

    // Month-lock check on old teacher
    if (actor.role !== "ADMIN") {
      const oldLock = await isTeacherMonthLocked(oldTeacherId, session.date);
      if (oldLock.isLocked) {
        throw new Error(
          `Teacher ${session.teacher?.name}'s payment for ${oldLock.month} is locked. Only an Admin can reassign credit.`
        );
      }

      const newTeacher = await tx.teacher.findUnique({ where: { id: newTeacherId } });
      const newLock = await isTeacherMonthLocked(newTeacherId, session.date);
      if (newLock.isLocked) {
        throw new Error(
          `Teacher ${newTeacher?.name}'s payment for ${newLock.month} is locked. Only an Admin can reassign credit.`
        );
      }
    }

    // 1. Reversal from old teacher's log (if counted)
    if (session.countedLogId) {
      const oldLog = await tx.teacherClassLog.findUnique({
        where: { id: session.countedLogId },
      });
      if (oldLog) {
        if (session.kind === "EXAM_DUTY") {
          await tx.teacherClassLog.update({
            where: { id: oldLog.id },
            data: { dutyAmount: Math.max(0, oldLog.dutyAmount - (session.payAmount || 0)) },
          });
        } else {
          await tx.teacherClassLog.update({
            where: { id: oldLog.id },
            data: { classes: Math.max(0, oldLog.classes - 1) },
          });
        }
      }
    }

    // 2. Add credit to new teacher's log
    const dateString = toDhakaDateString(session.date);
    const programId = session.programId || session.batch?.programId || null;
    const newAutoKey = `${newTeacherId}:${dateString}:${programId || 0}`;

    const newTeacher = await tx.teacher.findUnique({
      where: { id: newTeacherId },
      include: { rates: true },
    });

    let snapshotRate = newTeacher?.perClass || 0;
    if (programId && newTeacher?.rates) {
      const progRate = newTeacher.rates.find((r) => r.programId === programId);
      if (progRate && progRate.lectureRate > 0) {
        snapshotRate = progRate.lectureRate;
      }
    }

    const isDuty = session.kind === "EXAM_DUTY";
    const classCount = isDuty ? 0 : 1;
    const dutyTotal = isDuty ? session.payAmount || 0 : 0;

    const newLog = await tx.teacherClassLog.upsert({
      where: { autoKey: newAutoKey },
      update: {
        classes: { increment: classCount },
        dutyAmount: { increment: dutyTotal },
      },
      create: {
        teacherId: newTeacherId,
        date: toDhakaDbDate(dateString),
        month: getDhakaMonthAbbr(dateString),
        source: "AUTO",
        classes: classCount,
        dutyAmount: dutyTotal,
        perClass: snapshotRate,
        notebook: 0,
        other: 0,
        paid: 0,
        programId,
        autoKey: newAutoKey,
      },
    });

    // 3. Update session
    const updatedSession = await tx.classSession.update({
      where: { id: sessionId },
      data: {
        teacherId: newTeacherId,
        countedLogId: newLog.id,
        changeReason: `Credit adjusted to ${newTeacher?.name}: ${reason}`,
        updatedById: isNaN(actorIdNum) ? null : actorIdNum,
      },
    });

    // 4. Log change
    await tx.sessionChangeLog.create({
      data: {
        sessionId,
        action: "ADJUST",
        before: session as any,
        after: updatedSession as any,
        reason: `Credit moved from teacher #${oldTeacherId} to #${newTeacherId}: ${reason}`,
        byUserId: isNaN(actorIdNum) ? null : actorIdNum,
        byUsername: actor.username || "system",
      },
    });

    return updatedSession;
  }, TX_OPTIONS);
}

/**
 * Adjustment 3: Modify row counts directly on a TeacherClassLog with audit and month-lock check.
 */
export async function adjustClassLogRow(
  logId: number,
  data: {
    classes?: number;
    notebook?: number;
    other?: number;
    dutyAmount?: number;
    perClass?: number;
    paid?: number;
  },
  actor: SessionActor,
  reason: string
) {
  const actorIdNum = typeof actor.id === "string" ? parseInt(actor.id, 10) : actor.id;

  return await prisma.$transaction(async (tx) => {
    const before = await tx.teacherClassLog.findUnique({
      where: { id: logId },
      include: { teacher: { select: { id: true, name: true } } },
    });

    if (!before) {
      throw new Error(`TeacherClassLog #${logId} not found`);
    }

    // Month-lock check
    if (actor.role !== "ADMIN") {
      const lock = await isTeacherMonthLocked(before.teacherId, before.date);
      if (lock.isLocked) {
        throw new Error(
          `Teacher ${before.teacher?.name}'s payment for ${lock.month} has already been processed. Only an Admin can edit this class log.`
        );
      }
    }

    const updated = await tx.teacherClassLog.update({
      where: { id: logId },
      data: {
        classes: data.classes !== undefined ? data.classes : before.classes,
        notebook: data.notebook !== undefined ? data.notebook : before.notebook,
        other: data.other !== undefined ? data.other : before.other,
        dutyAmount: data.dutyAmount !== undefined ? data.dutyAmount : before.dutyAmount,
        perClass: data.perClass !== undefined ? data.perClass : before.perClass,
        paid: data.paid !== undefined ? data.paid : before.paid,
      },
    });

    return updated;
  }, TX_OPTIONS);
}
