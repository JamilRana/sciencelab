"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import {
  createSession,
  updateSession,
  reassignSession,
  rescheduleSession,
  cancelSession,
  setDutyAmount,
  getSessionHistory,
  isTeacherMonthLocked,
  detectSessionConflicts,
  CreateSessionInput,
  UpdateSessionInput,
  ConflictCheckParams,
  SessionActor,
} from "@/lib/sessions";
import {
  toDhakaDbDate,
  toDhakaDateString,
  todayDhaka,
  tomorrowDhaka,
  addDaysDhaka,
  getDhakaDayOfWeek,
  getDhakaWeekDates,
  formatDhakaDate,
  formatTime12h,
} from "@/lib/dhaka-time";
import { getMergedSubjectList } from "@/lib/subjects";
import { notifySessionChange } from "@/lib/notifications";
import {
  runDayCloseJob,
  getNeedsAmountDuties,
  markSessionNotHeld,
  adjustCountedSessionTeacher,
} from "@/lib/day-close";

/**
 * Fetches all class sessions for a specific calendar date (Dhaka time).
 */
export async function getSessionsForDateAction(dateStr: string) {
  await requireRole(["ADMIN", "STAFF", "TEACHER"]);
  const dbDate = toDhakaDbDate(dateStr);

  try {
    const sessions = await prisma.classSession.findMany({
      where: { date: dbDate },
      include: {
        teacher: { select: { id: true, name: true, mobile: true, email: true, perClass: true } },
        batch: { select: { id: true, name: true, code: true, classId: true } },
        program: { select: { id: true, name: true, code: true } },
        programSubject: { select: { id: true, name: true, code: true } },
        exam: { select: { id: true, class: true, type: true, month: true } },
        specialExam: { select: { id: true, title: true, kind: true } },
        changeLogs: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: [{ startTime: "asc" }, { id: "asc" }],
    });

    return { success: true, data: sessions };
  } catch (error: any) {
    console.error("Failed to fetch sessions for date:", error);
    return { success: false, error: error.message || "Failed to load class sessions" };
  }
}

/**
 * Loads metadata required by Day Planner forms (teachers, batches, programs, exams).
 */
export async function getPlannerMetadataAction() {
  await requireRole(["ADMIN", "STAFF"]);
  try {
    const [teachers, batches, programs, exams, specialExams, progSubjects, examSubjects] = await Promise.all([
      prisma.teacher.findMany({
        select: { id: true, name: true, mobile: true, perClass: true },
        orderBy: { name: "asc" },
      }),
      prisma.batch.findMany({
        select: { id: true, name: true, code: true, classId: true, programId: true },
        orderBy: [{ classId: "asc" }, { name: "asc" }],
      }),
      prisma.program.findMany({
        where: { active: true },
        select: {
          id: true,
          name: true,
          code: true,
          subjects: { select: { id: true, name: true, code: true } },
        },
        orderBy: { year: "desc" },
      }),
      prisma.exam.findMany({
        select: { id: true, class: true, type: true, month: true },
        orderBy: { id: "desc" },
        take: 15,
      }),
      prisma.specialExam.findMany({
        where: { status: { in: ["SCHEDULED", "ONGOING"] } },
        select: { id: true, title: true, kind: true, batchId: true, programId: true },
        orderBy: { id: "desc" },
        take: 20,
      }),
      prisma.programSubject.findMany({
        select: { name: true },
        distinct: ["name"],
      }),
      prisma.examSubject.findMany({
        select: { subject: true },
        distinct: ["subject"],
      }),
    ]);

    const dynamicSubjects = [
      ...progSubjects.map((p) => p.name),
      ...examSubjects.map((e) => e.subject),
    ];
    const subjects = getMergedSubjectList(dynamicSubjects);

    return {
      success: true,
      data: { teachers, batches, programs, exams, specialExams, subjects },
    };
  } catch (error: any) {
    console.error("Failed to load planner metadata:", error);
    return { success: false, error: "Failed to load form options" };
  }
}

/**
 * Checks for schedule conflicts in real-time before saving.
 */
export async function checkSessionConflictsAction(params: ConflictCheckParams) {
  await requireRole(["ADMIN", "STAFF"]);
  try {
    const result = await detectSessionConflicts(params);
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to check conflicts" };
  }
}

/**
 * Creates a new class session or exam duty.
 */
export async function createSessionAction(input: CreateSessionInput) {
  const user = await requireRole(["ADMIN", "STAFF"]);
  const actor: SessionActor = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  };

  try {
    const result = await createSession(input, actor);

    // Trigger immediate notifications if required (today or post-digest tomorrow)
    try {
      await notifySessionChange({
        action: "CREATE",
        session: result.session,
        affectedStudents: result.affectedStudents,
      });
    } catch (notifErr) {
      console.error("[createSessionAction] Notification error:", notifErr);
    }

    revalidatePath("/admin-route/routine");
    revalidatePath("/admin-route/dashboard");
    return { success: true, data: result.session };
  } catch (error: any) {
    console.error("Create session error:", error);
    return { success: false, error: error.message || "Failed to create session" };
  }
}

/**
 * Updates an existing class session.
 */
export async function updateSessionAction(
  id: number,
  input: UpdateSessionInput,
  reason?: string
) {
  const user = await requireRole(["ADMIN", "STAFF"]);
  const actor: SessionActor = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  };

  try {
    const result = await updateSession(id, input, actor, reason);

    try {
      await notifySessionChange({
        action: "UPDATE",
        session: result.session,
        previousTeacherId: result.previousTeacherId,
        reason,
        affectedStudents: result.affectedStudents,
      });
    } catch (notifErr) {
      console.error("[updateSessionAction] Notification error:", notifErr);
    }

    revalidatePath("/admin-route/routine");
    revalidatePath("/admin-route/dashboard");
    return { success: true, data: result.session };
  } catch (error: any) {
    console.error("Update session error:", error);
    return { success: false, error: error.message || "Failed to update session" };
  }
}

/**
 * Deletes an unconducted session.
 */
export async function deleteSessionAction(id: number) {
  const user = await requireRole(["ADMIN", "STAFF"]);

  try {
    const existing = await prisma.classSession.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Session not found" };
    }

    if (existing.status === "CONDUCTED") {
      return {
        success: false,
        error: "Cannot delete a conducted class session. Please adjust or cancel it instead.",
      };
    }

    // Delete session (cascade deletes sessionChangeLog)
    await prisma.classSession.delete({ where: { id } });
    revalidatePath("/admin-route/routine");
    revalidatePath("/admin-route/routine/tomorrow");
    revalidatePath("/admin-route/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Delete session error:", error);
    return { success: false, error: error.message || "Failed to delete session" };
  }
}

/**
 * Reassigns a session to another teacher with audit log and month-lock enforcement.
 * Returns affected teachers and batch students for notification dispatch.
 */
export async function reassignSessionAction(
  id: number,
  newTeacherId: number,
  reason: string
) {
  const user = await requireRole(["ADMIN", "STAFF"]);
  const actor: SessionActor = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  };

  try {
    if (!reason || reason.trim() === "") {
      return { success: false, error: "A reason is required to reassign a class session." };
    }

    const result = await reassignSession(id, newTeacherId, actor, reason.trim());

    try {
      await notifySessionChange({
        action: "REASSIGN",
        session: result.session,
        previousTeacherId: result.oldTeacherId,
        newTeacherId: result.newTeacherId,
        reason: reason.trim(),
        affectedStudents: result.affectedStudents,
      });
    } catch (notifErr) {
      console.error("[reassignSessionAction] Notification error:", notifErr);
    }

    revalidatePath("/admin-route/routine");
    revalidatePath("/admin-route/routine/tomorrow");
    revalidatePath("/admin-route/dashboard");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Reassign session error:", error);
    return { success: false, error: error.message || "Failed to reassign session" };
  }
}

/**
 * Reschedules a session: marks original as RESCHEDULED, creates a new linked SCHEDULED session.
 * Enforces month-lock and returns affected teachers & batch students.
 */
export async function rescheduleSessionAction(
  id: number,
  rescheduleData: {
    newDate: string;
    newStartTime: string;
    newEndTime?: string | null;
    room?: string | null;
  },
  reason: string
) {
  const user = await requireRole(["ADMIN", "STAFF"]);
  const actor: SessionActor = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  };

  try {
    if (!reason || reason.trim() === "") {
      return { success: false, error: "A reason is required to reschedule a class session." };
    }

    const result = await rescheduleSession(id, rescheduleData, actor, reason.trim());

    try {
      await notifySessionChange({
        action: "RESCHEDULE",
        session: result.newSession,
        originalSession: result.originalSession,
        reason: reason.trim(),
        affectedStudents: result.affectedStudents,
      });
    } catch (notifErr) {
      console.error("[rescheduleSessionAction] Notification error:", notifErr);
    }

    revalidatePath("/admin-route/routine");
    revalidatePath("/admin-route/routine/tomorrow");
    revalidatePath("/admin-route/dashboard");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Reschedule session error:", error);
    return { success: false, error: error.message || "Failed to reschedule session" };
  }
}

/**
 * Cancels a session with audit log and reason tracking.
 * Cancelled sessions are never counted in teacher logs.
 */
export async function cancelSessionAction(id: number, reason: string) {
  const user = await requireRole(["ADMIN", "STAFF"]);
  const actor: SessionActor = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  };

  try {
    if (!reason || reason.trim() === "") {
      return { success: false, error: "A reason is required to cancel a class session." };
    }

    const result = await cancelSession(id, actor, reason.trim());

    try {
      await notifySessionChange({
        action: "CANCEL",
        session: result.session,
        reason: reason.trim(),
        affectedStudents: result.affectedStudents,
      });
    } catch (notifErr) {
      console.error("[cancelSessionAction] Notification error:", notifErr);
    }

    revalidatePath("/admin-route/routine");
    revalidatePath("/admin-route/routine/tomorrow");
    revalidatePath("/admin-route/dashboard");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Cancel session error:", error);
    return { success: false, error: error.message || "Failed to cancel session" };
  }
}

/**
 * Sets or adjusts the pay amount for an EXAM_DUTY session.
 */
export async function setDutyAmountAction(
  id: number,
  payAmount: number,
  reason?: string
) {
  const user = await requireRole(["ADMIN", "STAFF"]);
  const actor: SessionActor = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  };

  try {
    if (isNaN(payAmount) || payAmount < 0) {
      return { success: false, error: "Please enter a valid pay amount." };
    }

    const result = await setDutyAmount(id, payAmount, actor, reason);
    revalidatePath("/admin-route/routine");
    revalidatePath("/admin-route/routine/tomorrow");
    revalidatePath("/admin-route/dashboard");
    return { success: true, data: result.session };
  } catch (error: any) {
    console.error("Set duty amount error:", error);
    return { success: false, error: error.message || "Failed to set duty amount" };
  }
}

/**
 * Fetches the complete change history and reschedule lineage for a session.
 */
export async function getSessionHistoryAction(sessionId: number) {
  await requireRole(["ADMIN", "STAFF", "TEACHER"]);
  try {
    const data = await getSessionHistory(sessionId);
    return { success: true, data };
  } catch (error: any) {
    console.error("Get session history error:", error);
    return { success: false, error: error.message || "Failed to load session history" };
  }
}

/**
 * Checks whether a teacher's month is locked by payment.
 */
export async function checkTeacherMonthLockAction(teacherId: number, dateStr: string) {
  await requireRole(["ADMIN", "STAFF"]);
  try {
    const lockInfo = await isTeacherMonthLocked(teacherId, dateStr);
    return { success: true, data: lockInfo };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Triggers Day-Close calculation for today or past uncounted dates.
 */
export async function closeDayNowAction(targetDate?: string) {
  const user = await requireRole(["ADMIN", "STAFF"]);
  const actor: SessionActor = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  };

  try {
    const result = await runDayCloseJob({
      forceDate: targetDate || todayDhaka(),
      actor,
    });

    try {
      revalidatePath("/admin-route/class-log");
      revalidatePath("/admin-route/routine");
      revalidatePath("/admin-route/routine/tomorrow");
      revalidatePath("/admin-route/dashboard");
      revalidatePath("/teacher-route/class-log");
    } catch {}

    return { success: result.success, data: result };
  } catch (error: any) {
    console.error("Close day error:", error);
    return { success: false, error: error.message || "Failed to execute day close" };
  }
}

/**
 * Returns all EXAM_DUTY sessions that need a pay amount before counting.
 */
export async function getNeedsAmountDutiesAction() {
  await requireRole(["ADMIN", "STAFF"]);
  try {
    const data = await getNeedsAmountDuties();
    return { success: true, data };
  } catch (error: any) {
    console.error("Get needs amount duties error:", error);
    return { success: false, error: error.message || "Failed to fetch exam duties", data: [] };
  }
}

/**
 * Marks a session as not held (reverses the count from teacher's class log).
 */
export async function markSessionNotHeldAction(sessionId: number, reason: string) {
  const user = await requireRole(["ADMIN", "STAFF"]);
  const actor: SessionActor = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  };

  try {
    if (!reason || reason.trim() === "") {
      return { success: false, error: "A reason is required to mark a session as not held." };
    }

    const result = await markSessionNotHeld(sessionId, actor, reason.trim());

    try {
      revalidatePath("/admin-route/class-log");
      revalidatePath("/admin-route/routine");
      revalidatePath("/admin-route/routine/tomorrow");
      revalidatePath("/teacher-route/class-log");
    } catch {}

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Mark not held error:", error);
    return { success: false, error: error.message || "Failed to mark session not held" };
  }
}

/**
 * Moves credit of a counted session to a different teacher.
 */
export async function adjustCountedSessionTeacherAction(
  sessionId: number,
  newTeacherId: number,
  reason: string
) {
  const user = await requireRole(["ADMIN", "STAFF"]);
  const actor: SessionActor = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  };

  try {
    if (!reason || reason.trim() === "") {
      return { success: false, error: "A reason is required to adjust session teacher." };
    }

    const result = await adjustCountedSessionTeacher(sessionId, newTeacherId, actor, reason.trim());

    try {
      revalidatePath("/admin-route/class-log");
      revalidatePath("/admin-route/routine");
      revalidatePath("/admin-route/routine/tomorrow");
      revalidatePath("/teacher-route/class-log");
    } catch {}

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Adjust teacher error:", error);
    return { success: false, error: error.message || "Failed to adjust session teacher" };
  }
}

/**
 * Fetches tomorrow's sessions specifically for the Tomorrow Board.
 */
export async function getTomorrowSessionsAction() {
  await requireRole(["ADMIN", "STAFF", "TEACHER"]);
  const tomorrowStr = tomorrowDhaka();
  return await getSessionsForDateAction(tomorrowStr);
}

/**
 * Copy tools: Copies sessions from a source date (e.g. yesterday, same day last week) to target date.
 * Skips duplicate sessions if already present on target date.
 */
export async function copySessionsAction(params: {
  sourceDate: string;
  targetDate: string;
  sessionIds?: number[];
}) {
  const user = await requireRole(["ADMIN", "STAFF"]);
  const actor: SessionActor = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  };

  const sourceDbDate = toDhakaDbDate(params.sourceDate);
  const targetDbDate = toDhakaDbDate(params.targetDate);

  try {
    const sourceSessions = await prisma.classSession.findMany({
      where: {
        date: sourceDbDate,
        status: { in: ["SCHEDULED", "CONDUCTED"] },
        ...(params.sessionIds && params.sessionIds.length > 0
          ? { id: { in: params.sessionIds } }
          : {}),
      },
    });

    if (sourceSessions.length === 0) {
      return { success: false, error: `No active sessions found on ${params.sourceDate} to copy.` };
    }

    // Query existing target sessions to avoid duplicates
    const targetExisting = await prisma.classSession.findMany({
      where: {
        date: targetDbDate,
        status: { in: ["SCHEDULED", "CONDUCTED"] },
      },
    });

    let createdCount = 0;
    let skippedCount = 0;

    for (const s of sourceSessions) {
      // Check if duplicate already exists on target date (same teacher & start time or same batch & start time)
      const isDuplicate = targetExisting.some(
        (t) =>
          (t.teacherId === s.teacherId && t.startTime === s.startTime) ||
          (t.batchId && s.batchId && t.batchId === s.batchId && t.startTime === s.startTime)
      );

      if (isDuplicate) {
        skippedCount++;
        continue;
      }

      await createSession(
        {
          kind: s.kind as any,
          batchId: s.batchId,
          programId: s.programId,
          subjectName: s.subjectName,
          programSubjectId: s.programSubjectId,
          lectureLabel: s.lectureLabel,
          teacherId: s.teacherId,
          date: targetDbDate,
          startTime: s.startTime,
          endTime: s.endTime,
          room: s.room,
          examId: s.examId,
          specialExamId: s.specialExamId,
          payAmount: s.payAmount,
        },
        actor
      );
      createdCount++;
    }

    revalidatePath("/admin-route/routine");
    revalidatePath("/admin-route/dashboard");
    return {
      success: true,
      data: { createdCount, skippedCount, total: sourceSessions.length },
    };
  } catch (error: any) {
    console.error("Copy sessions error:", error);
    return { success: false, error: error.message || "Failed to copy sessions" };
  }
}

/**
 * Fetches all recurring weekly RoutineSlots.
 */
export async function getRoutineSlotsAction(batchId?: number) {
  await requireRole(["ADMIN", "STAFF"]);
  try {
    const slots = await prisma.routineSlot.findMany({
      where: {
        ...(batchId ? { batchId } : {}),
      },
      include: {
        batch: { select: { id: true, name: true, code: true, classId: true } },
        teacher: { select: { id: true, name: true, mobile: true } },
        programSubject: { select: { id: true, name: true } },
      },
      orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
    });

    return { success: true, data: slots };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to load routine templates" };
  }
}

/**
 * Creates a recurring weekly RoutineSlot template.
 */
export async function createRoutineSlotAction(input: {
  batchId: number;
  subjectName: string;
  programSubjectId?: number | null;
  teacherId: number;
  weekday: number; // 0 = Sun, 1 = Mon ... 6 = Sat
  startTime: string;
  endTime?: string | null;
  room?: string | null;
  validFrom: string; // YYYY-MM-DD
  validTo?: string | null;
}) {
  await requireRole(["ADMIN", "STAFF"]);
  try {
    const slot = await prisma.routineSlot.create({
      data: {
        batchId: input.batchId,
        subjectName: input.subjectName,
        programSubjectId: input.programSubjectId || null,
        teacherId: input.teacherId,
        weekday: input.weekday,
        startTime: input.startTime,
        endTime: input.endTime || null,
        room: input.room || null,
        validFrom: toDhakaDbDate(input.validFrom),
        validTo: input.validTo ? toDhakaDbDate(input.validTo) : null,
        active: true,
      },
      include: {
        batch: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
      },
    });

    revalidatePath("/admin-route/routine");
    return { success: true, data: slot };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create routine slot" };
  }
}

/**
 * Updates a recurring weekly RoutineSlot template.
 */
export async function updateRoutineSlotAction(
  id: number,
  input: {
    subjectName?: string;
    teacherId?: number;
    weekday?: number;
    startTime?: string;
    endTime?: string | null;
    room?: string | null;
    active?: boolean;
    validTo?: string | null;
  }
) {
  await requireRole(["ADMIN", "STAFF"]);
  try {
    const slot = await prisma.routineSlot.update({
      where: { id },
      data: {
        ...(input.subjectName !== undefined ? { subjectName: input.subjectName } : {}),
        ...(input.teacherId !== undefined ? { teacherId: input.teacherId } : {}),
        ...(input.weekday !== undefined ? { weekday: input.weekday } : {}),
        ...(input.startTime !== undefined ? { startTime: input.startTime } : {}),
        ...(input.endTime !== undefined ? { endTime: input.endTime } : {}),
        ...(input.room !== undefined ? { room: input.room } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
        ...(input.validTo !== undefined
          ? { validTo: input.validTo ? toDhakaDbDate(input.validTo) : null }
          : {}),
      },
    });

    revalidatePath("/admin-route/routine");
    return { success: true, data: slot };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update routine slot" };
  }
}

/**
 * Deletes a recurring weekly RoutineSlot.
 */
export async function deleteRoutineSlotAction(id: number) {
  await requireRole(["ADMIN", "STAFF"]);
  try {
    await prisma.routineSlot.delete({ where: { id } });
    revalidatePath("/admin-route/routine");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete routine slot" };
  }
}

/**
 * Generates ClassSessions from weekly RoutineSlot templates for the next N days.
 *
 * IDEMPOTENT:
 * 1. Skips any slot date if a session generated from that slot already exists on that date.
 * 2. Skips dates where manual sessions exist for the same batch/time.
 * 3. Never overwrites or duplicates previously edited sessions.
 */
export async function generateSessionsFromSlotsAction(daysAhead: number = 14) {
  const user = await requireRole(["ADMIN", "STAFF"]);
  const actor: SessionActor = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  };

  try {
    const activeSlots = await prisma.routineSlot.findMany({
      where: { active: true },
    });

    if (activeSlots.length === 0) {
      return { success: false, error: "No active routine templates found to generate from." };
    }

    const startDateStr = todayDhaka();
    let generatedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < daysAhead; i++) {
      const dateStr = addDaysDhaka(startDateStr, i);
      const dbDate = toDhakaDbDate(dateStr);
      const weekday = getDhakaDayOfWeek(dateStr);

      // Find slots matching this weekday
      const slotsForDay = activeSlots.filter((slot) => {
        if (slot.weekday !== weekday) return false;
        const fromStr = toDhakaDateString(slot.validFrom);
        if (dateStr < fromStr) return false;
        if (slot.validTo) {
          const toStr = toDhakaDateString(slot.validTo);
          if (dateStr > toStr) return false;
        }
        return true;
      });

      for (const slot of slotsForDay) {
        // Check 1: Does a session generated from this exact slot already exist on this date?
        const existingSlotSession = await prisma.classSession.findFirst({
          where: {
            routineSlotId: slot.id,
            date: dbDate,
          },
        });

        if (existingSlotSession) {
          skippedCount++;
          continue;
        }

        // Check 2: Does an active session already exist for this batch at this exact time?
        const existingBatchSession = await prisma.classSession.findFirst({
          where: {
            batchId: slot.batchId,
            date: dbDate,
            startTime: slot.startTime,
            status: { in: ["SCHEDULED", "CONDUCTED"] },
          },
        });

        if (existingBatchSession) {
          skippedCount++;
          continue;
        }

        // Create new session generated from template
        await createSession(
          {
            kind: "CLASS",
            batchId: slot.batchId,
            subjectName: slot.subjectName,
            programSubjectId: slot.programSubjectId,
            teacherId: slot.teacherId,
            date: dbDate,
            startTime: slot.startTime,
            endTime: slot.endTime,
            room: slot.room,
            routineSlotId: slot.id,
          },
          actor
        );
        generatedCount++;
      }
    }

    revalidatePath("/admin-route/routine");
    revalidatePath("/admin-route/dashboard");
    return {
      success: true,
      data: { generatedCount, skippedCount, daysChecked: daysAhead },
    };
  } catch (error: any) {
    console.error("Generate sessions error:", error);
    return { success: false, error: error.message || "Failed to generate sessions" };
  }
}

/**
 * Checks if tomorrow has any scheduled sessions (Dhaka time).
 * Used by the Dashboard Planning Banner.
 */
export async function getTomorrowPlanningStatusAction() {
  await requireRole(["ADMIN", "STAFF"]);
  const tomorrowStr = tomorrowDhaka();
  const dbDate = toDhakaDbDate(tomorrowStr);

  try {
    const sessionCount = await prisma.classSession.count({
      where: {
        date: dbDate,
        status: { in: ["SCHEDULED", "CONDUCTED"] },
      },
    });

    return {
      success: true,
      data: {
        tomorrowDate: tomorrowStr,
        sessionCount,
        needsPlanning: sessionCount === 0,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Helper to resolve the authenticated user's associated Teacher record.
 */
async function resolveTeacherFromSession(sessionUser: { id: string; role: string; username?: string }) {
  const userId = parseInt(sessionUser.id, 10);
  return await prisma.teacher.findFirst({
    where: {
      OR: [
        { userId: isNaN(userId) ? -1 : userId },
        ...(sessionUser.username ? [{ mobile: sessionUser.username }] : []),
      ],
    },
  });
}

/**
 * Helper to resolve the authenticated user's associated Student record.
 */
async function resolveStudentFromSession(sessionUser: { id: string; role: string; username?: string; studentId?: number }) {
  const userId = parseInt(sessionUser.id, 10);
  return await prisma.student.findFirst({
    where: {
      OR: [
        { id: sessionUser.studentId || -1 },
        { userId: isNaN(userId) ? -1 : userId },
        ...(sessionUser.username ? [{ mobile: sessionUser.username }] : []),
      ],
    },
    include: {
      batch: { select: { id: true, name: true, code: true, classId: true } },
    },
  });
}

/**
 * Phase 4 Task 1: Teacher Agenda Action
 * Returns the authenticated teacher's schedule for today, tomorrow, or this week.
 * Staff/Admin can pass teacherIdOverride to view any teacher's agenda.
 */
export async function getTeacherAgendaAction(
  range: "today" | "tomorrow" | "week" | "all" = "today",
  targetDate?: string,
  teacherIdOverride?: number
) {
  const user = await requireRole(["TEACHER", "ADMIN", "STAFF"]);
  let targetTeacherId: number;

  if (user.role === "TEACHER") {
    const teacher = await resolveTeacherFromSession(user);
    if (!teacher) {
      return { success: false, error: "Teacher profile not linked to this user account." };
    }
    targetTeacherId = teacher.id;
  } else {
    if (!teacherIdOverride) {
      const firstTeacher = await prisma.teacher.findFirst({ orderBy: { name: "asc" } });
      if (!firstTeacher) return { success: true, data: { teacher: null, range, dates: [], sessions: [] } };
      targetTeacherId = firstTeacher.id;
    } else {
      targetTeacherId = teacherIdOverride;
    }
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id: targetTeacherId },
    select: { id: true, name: true, mobile: true, perClass: true },
  });

  const baseDate = targetDate || todayDhaka();
  let datesToQuery: string[] = [];

  if (range === "today") {
    datesToQuery = [baseDate];
  } else if (range === "tomorrow") {
    datesToQuery = [addDaysDhaka(baseDate, 1)];
  } else if (range === "week") {
    datesToQuery = getDhakaWeekDates(baseDate).dates;
  } else {
    // "all": next 14 days
    datesToQuery = Array.from({ length: 14 }, (_, i) => addDaysDhaka(baseDate, i));
  }

  const dbDates = datesToQuery.map(toDhakaDbDate);

  try {
    const sessions = await prisma.classSession.findMany({
      where: {
        teacherId: targetTeacherId,
        date: { in: dbDates },
      },
      select: {
        id: true,
        kind: true,
        subjectName: true,
        lectureLabel: true,
        date: true,
        startTime: true,
        endTime: true,
        room: true,
        status: true,
        payAmount: true,
        changeReason: true,
        originalSessionId: true,
        batch: { select: { id: true, name: true, code: true, classId: true } },
        program: { select: { id: true, name: true, code: true } },
        specialExam: { select: { id: true, title: true, kind: true } },
        exam: { select: { id: true, class: true, type: true, month: true } },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    return {
      success: true,
      data: {
        teacher,
        range,
        dates: datesToQuery,
        sessions,
      },
    };
  } catch (error: any) {
    console.error("Get teacher agenda error:", error);
    return { success: false, error: error.message || "Failed to load agenda" };
  }
}

/**
 * Phase 4 Task 2: Teacher Batch View (Read-Only)
 * Allows teachers and staff to inspect the schedule for any batch.
 * ROLE-BASED DATA SHAPING:
 * Other teachers' names are shown, but their mobile numbers, emails, and pay amounts are strictly omitted.
 */
export async function getBatchRoutineAction(
  batchId: number,
  range: "today" | "tomorrow" | "week" | "all" = "week",
  targetDate?: string
) {
  await requireRole(["TEACHER", "ADMIN", "STAFF", "STUDENT"]);

  const baseDate = targetDate || todayDhaka();
  let datesToQuery: string[] = [];

  if (range === "today") {
    datesToQuery = [baseDate];
  } else if (range === "tomorrow") {
    datesToQuery = [addDaysDhaka(baseDate, 1)];
  } else if (range === "week") {
    datesToQuery = getDhakaWeekDates(baseDate).dates;
  } else {
    datesToQuery = Array.from({ length: 14 }, (_, i) => addDaysDhaka(baseDate, i));
  }

  const dbDates = datesToQuery.map(toDhakaDbDate);

  try {
    const [batch, sessions] = await Promise.all([
      prisma.batch.findUnique({
        where: { id: batchId },
        select: { id: true, name: true, code: true, classId: true },
      }),
      prisma.classSession.findMany({
        where: {
          batchId,
          date: { in: dbDates },
        },
        select: {
          id: true,
          kind: true,
          subjectName: true,
          lectureLabel: true,
          date: true,
          startTime: true,
          endTime: true,
          room: true,
          status: true,
          changeReason: true,
          originalSessionId: true,
          // DATA SHAPING: Only return teacher ID and Name. No phone, no email, no pay amount!
          teacher: { select: { id: true, name: true } },
          specialExam: { select: { id: true, title: true, kind: true } },
        },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      }),
    ]);

    return {
      success: true,
      data: {
        batch,
        dates: datesToQuery,
        sessions,
      },
    };
  } catch (error: any) {
    console.error("Get batch routine error:", error);
    return { success: false, error: error.message || "Failed to load batch routine" };
  }
}

/**
 * Phase 4 Task 3: Student Schedule Action
 * Returns the authenticated student's batch sessions for today, tomorrow, or this week.
 * ROLE-BASED DATA SHAPING:
 * - Only classes and extra classes for the student's batch are returned (no internal exam duties).
 * - Teacher contact info (mobile, email) and pay amounts are strictly omitted.
 * - Rescheduled classes include information about the successor session.
 */
export async function getStudentScheduleAction(
  range: "today" | "tomorrow" | "week" = "week",
  targetDate?: string
) {
  const user = await requireRole(["STUDENT", "ADMIN", "STAFF"]);
  let student: any;

  if (user.role === "STUDENT") {
    student = await resolveStudentFromSession(user);
    if (!student || !student.batchId) {
      return {
        success: true,
        data: {
          student: null,
          batch: null,
          range,
          dates: [],
          sessions: [],
          message: "You are not currently enrolled in an active batch.",
        },
      };
    }
  } else {
    // Testing / Admin preview mode: pick the first batch
    const firstBatch = await prisma.batch.findFirst();
    student = {
      name: "Demo Student",
      batchId: firstBatch?.id || 1,
      batch: firstBatch,
    };
  }

  const baseDate = targetDate || todayDhaka();
  let datesToQuery: string[] = [];

  if (range === "today") {
    datesToQuery = [baseDate];
  } else if (range === "tomorrow") {
    datesToQuery = [addDaysDhaka(baseDate, 1)];
  } else {
    datesToQuery = getDhakaWeekDates(baseDate).dates;
  }

  const dbDates = datesToQuery.map(toDhakaDbDate);

  try {
    const rawSessions = await prisma.classSession.findMany({
      where: {
        batchId: student.batchId,
        date: { in: dbDates },
        // Students see CLASS and EXTRA sessions. EXAM_DUTY is internal faculty invigilation.
        kind: { in: ["CLASS", "EXTRA"] },
      },
      select: {
        id: true,
        kind: true,
        subjectName: true,
        lectureLabel: true,
        date: true,
        startTime: true,
        endTime: true,
        room: true,
        status: true,
        changeReason: true,
        originalSessionId: true,
        // STRICT DATA SHAPING: Teacher name only. No mobile, email, pay amount.
        teacher: { select: { id: true, name: true } },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    // For rescheduled sessions, find the successor session so student sees the new time
    const rescheduledSessionIds = rawSessions
      .filter((s) => s.status === "RESCHEDULED")
      .map((s) => s.id);

    let successorMap = new Map<number, any>();
    if (rescheduledSessionIds.length > 0) {
      const successors = await prisma.classSession.findMany({
        where: { originalSessionId: { in: rescheduledSessionIds } },
        select: {
          id: true,
          date: true,
          startTime: true,
          endTime: true,
          room: true,
          status: true,
          originalSessionId: true,
        },
      });
      for (const succ of successors) {
        if (succ.originalSessionId) {
          successorMap.set(succ.originalSessionId, {
            id: succ.id,
            date: toDhakaDateString(succ.date),
            startTime: succ.startTime,
            endTime: succ.endTime,
            room: succ.room,
          });
        }
      }
    }

    const sessions = rawSessions.map((s) => ({
      ...s,
      dateString: toDhakaDateString(s.date),
      rescheduledTo: successorMap.get(s.id) || null,
    }));

    return {
      success: true,
      data: {
        student: { id: student.id, name: student.name },
        batch: student.batch,
        range,
        dates: datesToQuery,
        sessions,
      },
    };
  } catch (error: any) {
    console.error("Get student schedule error:", error);
    return { success: false, error: error.message || "Failed to load class schedule" };
  }
}

/**
 * Phase 4 Task 4: Printable Routine Action
 * Provides structured timetable data for A4 printing (Bangla-compatible, daily or weekly batch grid).
 */
export async function getPrintableRoutineAction(params: {
  batchId?: number;
  date?: string;
  view: "day" | "batch_week";
}) {
  await requireRole(["ADMIN", "STAFF", "TEACHER"]);

  try {
    if (params.view === "batch_week") {
      const batchId = params.batchId;
      if (!batchId) {
        return { success: false, error: "Please select a batch to print weekly routine." };
      }

      const [batch, slots, sessions] = await Promise.all([
        prisma.batch.findUnique({
          where: { id: batchId },
          include: { program: true },
        }),
        prisma.routineSlot.findMany({
          where: { batchId, active: true },
          include: {
            teacher: { select: { id: true, name: true } },
          },
          orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
        }),
        // Also fetch active sessions for the current week to show actual scheduled dates
        prisma.classSession.findMany({
          where: {
            batchId,
            date: { in: getDhakaWeekDates().dates.map(toDhakaDbDate) },
            status: { in: ["SCHEDULED", "CONDUCTED"] },
          },
          include: {
            teacher: { select: { id: true, name: true } },
          },
          orderBy: [{ date: "asc" }, { startTime: "asc" }],
        }),
      ]);

      return {
        success: true,
        data: {
          view: "batch_week",
          batch,
          slots,
          sessions,
          weekDates: getDhakaWeekDates(),
        },
      };
    } else {
      // Daily print view for all batches on a date
      const dateStr = params.date || todayDhaka();
      const dbDate = toDhakaDbDate(dateStr);

      const [batches, sessions] = await Promise.all([
        prisma.batch.findMany({
          orderBy: [{ classId: "asc" }, { name: "asc" }],
        }),
        prisma.classSession.findMany({
          where: {
            date: dbDate,
            status: { in: ["SCHEDULED", "CONDUCTED", "RESCHEDULED", "CANCELLED"] },
          },
          include: {
            batch: { select: { id: true, name: true, code: true, classId: true } },
            teacher: { select: { id: true, name: true } },
            specialExam: { select: { id: true, title: true, kind: true } },
          },
          orderBy: [{ startTime: "asc" }, { id: "asc" }],
        }),
      ]);

      return {
        success: true,
        data: {
          view: "day",
          dateStr,
          batches,
          sessions,
        },
      };
    }
  } catch (error: any) {
    console.error("Get printable routine error:", error);
    return { success: false, error: error.message || "Failed to load printable routine" };
  }
}
