import { prisma } from "@/lib/prisma";
import {
  toDhakaDbDate,
  toDhakaDateString,
  getDhakaParts,
  getDhakaMonthShort,
} from "@/lib/dhaka-time";
import { Prisma } from "@prisma/client";

export interface SessionActor {
  id: string | number;
  username: string;
  name?: string;
  role: string;
}

export interface AffectedStudent {
  id: number;
  name: string;
  userId: number | null;
  mobile: string;
}

export interface CreateSessionInput {
  kind?: "CLASS" | "EXAM_DUTY" | "EXTRA";
  batchId?: number | null;
  programId?: number | null;
  subjectName?: string;
  programSubjectId?: number | null;
  lectureLabel?: string | null;
  teacherId: number;
  date: string | Date; // "YYYY-MM-DD" or Date
  startTime: string; // "HH:mm"
  endTime?: string | null;
  room?: string | null;
  examId?: number | null;
  specialExamId?: number | null;
  payAmount?: number | null;
  routineSlotId?: number | null;
}

export interface UpdateSessionInput {
  kind?: "CLASS" | "EXAM_DUTY" | "EXTRA";
  batchId?: number | null;
  programId?: number | null;
  subjectName?: string;
  programSubjectId?: number | null;
  lectureLabel?: string | null;
  teacherId?: number;
  date?: string | Date;
  startTime?: string;
  endTime?: string | null;
  room?: string | null;
  examId?: number | null;
  specialExamId?: number | null;
  payAmount?: number | null;
}

export interface ConflictWarning {
  type: "TEACHER_OVERLAP" | "BATCH_OVERLAP" | "ROOM_OVERLAP" | "EXAM_COLLISION";
  message: string;
  conflictingSessionId?: number;
}

export interface ConflictCheckParams {
  teacherId: number;
  batchId?: number | null;
  room?: string | null;
  date: string | Date;
  startTime: string; // "HH:mm"
  endTime?: string | null; // "HH:mm"
  excludeSessionId?: number;
}

/**
 * Converts "HH:mm" string to minutes since midnight for comparison.
 */
function timeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(":")) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Checks if two time windows [s1, e1] and [s2, e2] overlap.
 * If endTime is omitted, assumes a 60-minute duration.
 */
function timesOverlap(
  start1: string,
  end1: string | null | undefined,
  start2: string,
  end2: string | null | undefined
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = end1 ? timeToMinutes(end1) : s1 + 60;
  const s2 = timeToMinutes(start2);
  const e2 = end2 ? timeToMinutes(end2) : s2 + 60;

  return s1 < e2 && s2 < e1;
}

/**
 * Detects scheduling conflicts (teacher, batch, room overlap).
 * Returns warnings rather than throwing errors so Admin can override if necessary.
 */
export async function detectSessionConflicts(
  params: ConflictCheckParams
): Promise<{ hasConflicts: boolean; warnings: ConflictWarning[] }> {
  const dbDate = typeof params.date === "string" ? toDhakaDbDate(params.date) : params.date;
  const warnings: ConflictWarning[] = [];

  // Query all active sessions on that date (excluding cancelled/rescheduled)
  const existingSessions = await prisma.classSession.findMany({
    where: {
      date: dbDate,
      status: { in: ["SCHEDULED", "CONDUCTED"] },
      ...(params.excludeSessionId ? { id: { not: params.excludeSessionId } } : {}),
    },
    include: {
      teacher: { select: { id: true, name: true } },
      batch: { select: { id: true, name: true } },
    },
  });

  for (const s of existingSessions) {
    const isOverlapping = timesOverlap(
      params.startTime,
      params.endTime,
      s.startTime,
      s.endTime
    );

    if (isOverlapping) {
      // 1. Same teacher conflict
      if (s.teacherId === params.teacherId) {
        warnings.push({
          type: "TEACHER_OVERLAP",
          message: `Teacher ${s.teacher?.name || params.teacherId} is already scheduled for ${s.subjectName || s.kind} (${s.startTime}${s.endTime ? "-" + s.endTime : ""}) at that time.`,
          conflictingSessionId: s.id,
        });
      }

      // 2. Same batch conflict
      if (params.batchId && s.batchId === params.batchId) {
        warnings.push({
          type: "BATCH_OVERLAP",
          message: `Batch ${s.batch?.name || params.batchId} already has a session (${s.subjectName || s.kind} at ${s.startTime}${s.endTime ? "-" + s.endTime : ""}) at that time.`,
          conflictingSessionId: s.id,
        });
      }

      // 3. Same room conflict
      if (
        params.room &&
        s.room &&
        params.room.trim().toLowerCase() === s.room.trim().toLowerCase()
      ) {
        warnings.push({
          type: "ROOM_OVERLAP",
          message: `Room "${params.room}" is already occupied by ${s.batch?.name || "another session"} at that time.`,
          conflictingSessionId: s.id,
        });
      }
    }
  }

  // 4. Check for exams scheduled for this batch on this date
  if (params.batchId) {
    const specialExams = await prisma.specialExam.findMany({
      where: {
        batchId: params.batchId,
        examDate: dbDate,
        status: { in: ["SCHEDULED", "ONGOING"] },
      },
      select: { id: true, title: true },
    });

    for (const se of specialExams) {
      warnings.push({
        type: "EXAM_COLLISION",
        message: `Batch has a Special Exam scheduled on this date: "${se.title}".`,
      });
    }
  }

  return {
    hasConflicts: warnings.length > 0,
    warnings,
  };
}

/**
 * Checks whether a teacher's payment for the month of the given date has already been processed.
 * When locked, only Admin can edit/reschedule/cancel/reassign sessions for that teacher.
 */
export async function isTeacherMonthLocked(
  teacherId: number,
  date: string | Date
): Promise<{ isLocked: boolean; month: string; payment?: any }> {
  const monthName = getDhakaMonthShort(date);
  const parts = getDhakaParts(
    typeof date === "string" ? new Date(date.includes("T") ? date : date + "T00:00:00Z") : date
  );

  const payments = await prisma.teacherPayment.findMany({
    where: {
      teacherId,
      month: monthName,
    },
    orderBy: { date: "desc" },
  });

  const matchingPayment =
    payments.find((p) => {
      if (!p.date) return true;
      const pParts = getDhakaParts(p.date);
      return pParts.year === parts.year;
    }) || payments[0];

  return {
    isLocked: !!matchingPayment,
    month: monthName,
    payment: matchingPayment,
  };
}

/**
 * Fetches active students enrolled in a batch to notify them of schedule changes.
 */
async function getBatchActiveStudents(
  tx: Prisma.TransactionClient,
  batchId: number | null | undefined
): Promise<AffectedStudent[]> {
  if (!batchId) return [];
  return await tx.student.findMany({
    where: { batchId, active: true },
    select: { id: true, name: true, userId: true, mobile: true },
  });
}

const TX_OPTIONS = { timeout: 15000, maxWait: 10000 };

/**
 * Creates a new class session with audit log.
 */
export async function createSession(
  input: CreateSessionInput,
  actor: SessionActor
) {
  const dbDate = typeof input.date === "string" ? toDhakaDbDate(input.date) : input.date;
  const userIdNum = typeof actor.id === "string" ? parseInt(actor.id, 10) : actor.id;

  return await prisma.$transaction(async (tx) => {
    const session = await tx.classSession.create({
      data: {
        kind: input.kind || "CLASS",
        batchId: input.batchId || null,
        programId: input.programId || null,
        subjectName: input.subjectName || "",
        programSubjectId: input.programSubjectId || null,
        lectureLabel: input.lectureLabel || null,
        teacherId: input.teacherId,
        date: dbDate,
        startTime: input.startTime,
        endTime: input.endTime || null,
        room: input.room || null,
        examId: input.examId || null,
        specialExamId: input.specialExamId || null,
        status: "SCHEDULED",
        payAmount: input.payAmount || null,
        routineSlotId: input.routineSlotId || null,
        createdById: isNaN(userIdNum) ? null : userIdNum,
        updatedById: isNaN(userIdNum) ? null : userIdNum,
      },
      include: {
        teacher: { select: { id: true, name: true, mobile: true, email: true } },
        batch: { select: { id: true, name: true, code: true, classId: true } },
      },
    });

    // Write audit log
    await tx.sessionChangeLog.create({
      data: {
        sessionId: session.id,
        action: "CREATE",
        after: session as any,
        byUserId: isNaN(userIdNum) ? null : userIdNum,
        byUsername: actor.username || "system",
      },
    });

    const affectedStudents = await getBatchActiveStudents(tx, session.batchId);

    return {
      session,
      affectedTeacherId: session.teacherId,
      affectedTeacherIds: [session.teacherId],
      affectedBatchId: session.batchId,
      affectedStudents,
    };
  }, TX_OPTIONS);
}

/**
 * Updates a class session with audit log and month-lock check.
 */
export async function updateSession(
  id: number,
  input: UpdateSessionInput,
  actor: SessionActor,
  reason?: string
) {
  const userIdNum = typeof actor.id === "string" ? parseInt(actor.id, 10) : actor.id;

  return await prisma.$transaction(async (tx) => {
    const before = await tx.classSession.findUnique({
      where: { id },
      include: {
        teacher: { select: { id: true, name: true } },
        batch: { select: { id: true, name: true } },
      },
    });

    if (!before) {
      throw new Error(`Class session #${id} not found.`);
    }

    // Month-lock enforcement: Staff cannot modify sessions for a locked teacher-month
    if (actor.role !== "ADMIN") {
      const lock = await isTeacherMonthLocked(before.teacherId, before.date);
      if (lock.isLocked) {
        throw new Error(
          `Teacher ${before.teacher?.name}'s payment for ${lock.month} has already been processed. Only an Admin can modify this session.`
        );
      }
    }

    const updateData: Prisma.ClassSessionUpdateInput = {
      updatedById: isNaN(userIdNum) ? null : userIdNum,
      ...(reason ? { changeReason: reason } : {}),
    };

    if (input.kind !== undefined) updateData.kind = input.kind;
    if (input.batchId !== undefined) {
      updateData.batch = input.batchId ? { connect: { id: input.batchId } } : { disconnect: true };
    }
    if (input.programId !== undefined) {
      updateData.program = input.programId ? { connect: { id: input.programId } } : { disconnect: true };
    }
    if (input.subjectName !== undefined) updateData.subjectName = input.subjectName;
    if (input.programSubjectId !== undefined) {
      updateData.programSubject = input.programSubjectId
        ? { connect: { id: input.programSubjectId } }
        : { disconnect: true };
    }
    if (input.lectureLabel !== undefined) updateData.lectureLabel = input.lectureLabel;
    if (input.teacherId !== undefined) updateData.teacher = { connect: { id: input.teacherId } };
    if (input.date !== undefined) {
      updateData.date = typeof input.date === "string" ? toDhakaDbDate(input.date) : input.date;
    }
    if (input.startTime !== undefined) updateData.startTime = input.startTime;
    if (input.endTime !== undefined) updateData.endTime = input.endTime;
    if (input.room !== undefined) updateData.room = input.room;
    if (input.payAmount !== undefined) updateData.payAmount = input.payAmount;

    const session = await tx.classSession.update({
      where: { id },
      data: updateData,
      include: {
        teacher: { select: { id: true, name: true, mobile: true, email: true } },
        batch: { select: { id: true, name: true, code: true, classId: true } },
      },
    });

    // Write audit log
    await tx.sessionChangeLog.create({
      data: {
        sessionId: session.id,
        action: "UPDATE",
        before: before as any,
        after: session as any,
        reason: reason || null,
        byUserId: isNaN(userIdNum) ? null : userIdNum,
        byUsername: actor.username || "system",
      },
    });

    const affectedTeacherIds = Array.from(
      new Set([before.teacherId, session.teacherId])
    );
    const affectedStudents = await getBatchActiveStudents(
      tx,
      session.batchId || before.batchId
    );

    return {
      session,
      previousTeacherId: before.teacherId,
      currentTeacherId: session.teacherId,
      affectedTeacherIds,
      batchId: session.batchId,
      affectedBatchId: session.batchId,
      affectedStudents,
    };
  }, TX_OPTIONS);
}

/**
 * Reassigns a session to another teacher.
 * Logs "REASSIGN". Returns old and new teacher IDs and affected students so notification service can alert both.
 * Enforces month-lock: Staff cannot reassign if either teacher's month is locked.
 */
export async function reassignSession(
  id: number,
  newTeacherId: number,
  actor: SessionActor,
  reason?: string
) {
  const userIdNum = typeof actor.id === "string" ? parseInt(actor.id, 10) : actor.id;

  return await prisma.$transaction(async (tx) => {
    const before = await tx.classSession.findUnique({
      where: { id },
      include: {
        teacher: { select: { id: true, name: true } },
        batch: { select: { id: true, name: true } },
      },
    });

    if (!before) {
      throw new Error(`Class session #${id} not found.`);
    }

    // Month-lock enforcement
    if (actor.role !== "ADMIN") {
      const oldLock = await isTeacherMonthLocked(before.teacherId, before.date);
      if (oldLock.isLocked) {
        throw new Error(
          `Teacher ${before.teacher?.name}'s payment for ${oldLock.month} has already been processed. Only an Admin can reassign this session.`
        );
      }

      const newTeacher = await tx.teacher.findUnique({ where: { id: newTeacherId } });
      const newLock = await isTeacherMonthLocked(newTeacherId, before.date);
      if (newLock.isLocked) {
        throw new Error(
          `Teacher ${newTeacher?.name || newTeacherId}'s payment for ${newLock.month} has already been processed. Only an Admin can reassign to this teacher.`
        );
      }
    }

    const session = await tx.classSession.update({
      where: { id },
      data: {
        teacher: { connect: { id: newTeacherId } },
        updatedById: isNaN(userIdNum) ? null : userIdNum,
        changeReason: reason || `Reassigned from ${before.teacher?.name} (ID: ${before.teacherId})`,
      },
      include: {
        teacher: { select: { id: true, name: true, mobile: true, email: true } },
        batch: { select: { id: true, name: true, code: true, classId: true } },
      },
    });

    await tx.sessionChangeLog.create({
      data: {
        sessionId: session.id,
        action: "REASSIGN",
        before: before as any,
        after: session as any,
        reason: reason || null,
        byUserId: isNaN(userIdNum) ? null : userIdNum,
        byUsername: actor.username || "system",
      },
    });

    const affectedStudents = await getBatchActiveStudents(tx, session.batchId);

    return {
      session,
      oldTeacherId: before.teacherId,
      newTeacherId: session.teacherId,
      affectedTeacherIds: [before.teacherId, session.teacherId],
      batchId: session.batchId,
      affectedBatchId: session.batchId,
      affectedStudents,
    };
  }, TX_OPTIONS);
}

/**
 * Reschedules a session:
 * 1. Enforces month lock: Staff cannot reschedule if original teacher month is locked.
 * 2. Marks original session as RESCHEDULED (never counted in day-close, preserved for audit).
 * 3. Creates a new session with status SCHEDULED pointing to originalSessionId.
 * 4. Returns affected teachers and students for notification dispatch.
 */
export async function rescheduleSession(
  id: number,
  rescheduleData: {
    newDate: string | Date;
    newStartTime: string;
    newEndTime?: string | null;
    room?: string | null;
  },
  actor: SessionActor,
  reason: string
) {
  const userIdNum = typeof actor.id === "string" ? parseInt(actor.id, 10) : actor.id;
  const newDbDate =
    typeof rescheduleData.newDate === "string"
      ? toDhakaDbDate(rescheduleData.newDate)
      : rescheduleData.newDate;

  return await prisma.$transaction(async (tx) => {
    const original = await tx.classSession.findUnique({
      where: { id },
      include: {
        teacher: { select: { id: true, name: true } },
        batch: { select: { id: true, name: true } },
      },
    });

    if (!original) {
      throw new Error(`Class session #${id} not found.`);
    }

    // Month-lock check on original date
    if (actor.role !== "ADMIN") {
      const lock = await isTeacherMonthLocked(original.teacherId, original.date);
      if (lock.isLocked) {
        throw new Error(
          `Teacher ${original.teacher?.name}'s payment for ${lock.month} has already been processed. Only an Admin can reschedule this session.`
        );
      }
    }

    // Mark original as RESCHEDULED
    const updatedOriginal = await tx.classSession.update({
      where: { id },
      data: {
        status: "RESCHEDULED",
        changeReason: reason,
        updatedById: isNaN(userIdNum) ? null : userIdNum,
      },
    });

    // Create new SCHEDULED session linked via originalSessionId
    const newSession = await tx.classSession.create({
      data: {
        kind: original.kind,
        batchId: original.batchId,
        programId: original.programId,
        subjectName: original.subjectName,
        programSubjectId: original.programSubjectId,
        lectureLabel: original.lectureLabel,
        teacherId: original.teacherId,
        date: newDbDate,
        startTime: rescheduleData.newStartTime,
        endTime: rescheduleData.newEndTime ?? original.endTime,
        room: rescheduleData.room ?? original.room,
        examId: original.examId,
        specialExamId: original.specialExamId,
        payAmount: original.payAmount,
        routineSlotId: original.routineSlotId,
        originalSessionId: original.id,
        status: "SCHEDULED",
        changeReason: `Rescheduled from ${toDhakaDateString(original.date)} ${original.startTime}. Reason: ${reason}`,
        createdById: isNaN(userIdNum) ? null : userIdNum,
        updatedById: isNaN(userIdNum) ? null : userIdNum,
      },
      include: {
        teacher: { select: { id: true, name: true, mobile: true, email: true } },
        batch: { select: { id: true, name: true, code: true, classId: true } },
      },
    });

    // Write audit log on original
    await tx.sessionChangeLog.create({
      data: {
        sessionId: original.id,
        action: "RESCHEDULE",
        before: original as any,
        after: updatedOriginal as any,
        reason,
        byUserId: isNaN(userIdNum) ? null : userIdNum,
        byUsername: actor.username || "system",
      },
    });

    // Write audit log on new session
    await tx.sessionChangeLog.create({
      data: {
        sessionId: newSession.id,
        action: "CREATE",
        after: newSession as any,
        reason: `Created via reschedule of session #${original.id}`,
        byUserId: isNaN(userIdNum) ? null : userIdNum,
        byUsername: actor.username || "system",
      },
    });

    const affectedStudents = await getBatchActiveStudents(tx, newSession.batchId);

    return {
      originalSession: updatedOriginal,
      newSession,
      affectedTeacherId: newSession.teacherId,
      affectedTeacherIds: [newSession.teacherId],
      affectedBatchId: newSession.batchId,
      affectedStudents,
    };
  }, TX_OPTIONS);
}

/**
 * Cancels a session. Sets status to "CANCELLED" and stores reason.
 * Cancelled sessions are never counted in teacher class logs.
 * Enforces month lock: Staff cannot cancel if teacher's month is locked.
 */
export async function cancelSession(
  id: number,
  actor: SessionActor,
  reason: string
) {
  const userIdNum = typeof actor.id === "string" ? parseInt(actor.id, 10) : actor.id;

  return await prisma.$transaction(async (tx) => {
    const before = await tx.classSession.findUnique({
      where: { id },
      include: {
        teacher: { select: { id: true, name: true } },
        batch: { select: { id: true, name: true } },
      },
    });

    if (!before) {
      throw new Error(`Class session #${id} not found.`);
    }

    // Month-lock check
    if (actor.role !== "ADMIN") {
      const lock = await isTeacherMonthLocked(before.teacherId, before.date);
      if (lock.isLocked) {
        throw new Error(
          `Teacher ${before.teacher?.name}'s payment for ${lock.month} has already been processed. Only an Admin can cancel this session.`
        );
      }
    }

    const session = await tx.classSession.update({
      where: { id },
      data: {
        status: "CANCELLED",
        changeReason: reason,
        updatedById: isNaN(userIdNum) ? null : userIdNum,
      },
      include: {
        teacher: { select: { id: true, name: true, mobile: true, email: true } },
        batch: { select: { id: true, name: true, code: true, classId: true } },
      },
    });

    await tx.sessionChangeLog.create({
      data: {
        sessionId: session.id,
        action: "CANCEL",
        before: before as any,
        after: session as any,
        reason,
        byUserId: isNaN(userIdNum) ? null : userIdNum,
        byUsername: actor.username || "system",
      },
    });

    const affectedStudents = await getBatchActiveStudents(tx, session.batchId);

    return {
      session,
      affectedTeacherId: session.teacherId,
      affectedTeacherIds: [session.teacherId],
      affectedBatchId: session.batchId,
      affectedStudents,
    };
  }, TX_OPTIONS);
}

/**
 * Sets or adjusts payAmount for an EXAM_DUTY (or any duty) session with audit logging.
 */
export async function setDutyAmount(
  id: number,
  payAmount: number,
  actor: SessionActor,
  reason?: string
) {
  const userIdNum = typeof actor.id === "string" ? parseInt(actor.id, 10) : actor.id;

  return await prisma.$transaction(async (tx) => {
    const before = await tx.classSession.findUnique({
      where: { id },
      include: {
        teacher: { select: { id: true, name: true } },
        batch: { select: { id: true, name: true } },
      },
    });

    if (!before) {
      throw new Error(`Class session #${id} not found.`);
    }

    // Month-lock check
    if (actor.role !== "ADMIN") {
      const lock = await isTeacherMonthLocked(before.teacherId, before.date);
      if (lock.isLocked) {
        throw new Error(
          `Teacher ${before.teacher?.name}'s payment for ${lock.month} has already been processed. Only an Admin can set duty amounts.`
        );
      }
    }

    const session = await tx.classSession.update({
      where: { id },
      data: {
        payAmount,
        updatedById: isNaN(userIdNum) ? null : userIdNum,
        changeReason: reason || `Duty pay set to ৳${payAmount}`,
      },
      include: {
        teacher: { select: { id: true, name: true, mobile: true, email: true } },
        batch: { select: { id: true, name: true, code: true, classId: true } },
      },
    });

    await tx.sessionChangeLog.create({
      data: {
        sessionId: session.id,
        action: "ADJUST",
        before: before as any,
        after: session as any,
        reason: reason || `Duty pay set to ৳${payAmount}`,
        byUserId: isNaN(userIdNum) ? null : userIdNum,
        byUsername: actor.username || "system",
      },
    });

    return {
      session,
      affectedTeacherId: session.teacherId,
      affectedTeacherIds: [session.teacherId],
      affectedBatchId: session.batchId,
    };
  }, TX_OPTIONS);
}

/**
 * Retrieves the complete audit history and reschedule lineage of a session.
 */
export async function getSessionHistory(sessionId: number) {
  const session = await prisma.classSession.findUnique({
    where: { id: sessionId },
    include: {
      teacher: { select: { id: true, name: true, mobile: true, email: true } },
      batch: { select: { id: true, name: true, code: true, classId: true } },
      program: { select: { id: true, name: true, code: true } },
      programSubject: { select: { id: true, name: true, code: true } },
      exam: { select: { id: true, class: true, type: true, month: true } },
      specialExam: { select: { id: true, title: true, kind: true } },
      changeLogs: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!session) {
    throw new Error(`Class session #${sessionId} not found.`);
  }

  // Parent session if rescheduled
  let originalSession: any = null;
  if (session.originalSessionId) {
    originalSession = await prisma.classSession.findUnique({
      where: { id: session.originalSessionId },
      include: {
        teacher: { select: { id: true, name: true } },
        batch: { select: { id: true, name: true } },
        changeLogs: { orderBy: { createdAt: "asc" } },
      },
    });
  }

  // Successor session(s) if this session was rescheduled
  const rescheduledToSessions = await prisma.classSession.findMany({
    where: { originalSessionId: session.id },
    include: {
      teacher: { select: { id: true, name: true } },
      batch: { select: { id: true, name: true } },
      changeLogs: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    session,
    changeLogs: session.changeLogs,
    originalSession,
    rescheduledToSessions,
  };
}
