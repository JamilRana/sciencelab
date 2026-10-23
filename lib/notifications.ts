/**
 * Notifications Service for ScienceLab Management System
 *
 * Implements Phase 5 of the Class Routine & Notifications System:
 * - Multi-channel delivery: IN_APP, EMAIL (nodemailer SMTP), and WHATSAPP_LINK (wa.me)
 * - 19:00 Daily Schedule Digest per teacher (idempotent with dedupeKey)
 * - Immediate change notices for same-day and post-digest edits
 * - In-app alerts for enrolled students on routine changes
 * - Planning reminder job for unassigned next-day routine
 * - Delivery logs (NotificationLog) and background job audit records (JobRun)
 */

import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import {
  todayDhaka,
  tomorrowDhaka,
  toDhakaDbDate,
  toDhakaDateString,
  formatDhakaDate,
  formatTime12h,
  isPast7PmDhaka,
} from "@/lib/dhaka-time";

export type NotificationChannel = "EMAIL" | "IN_APP" | "WHATSAPP_LINK";
export type NotificationKind =
  | "DAILY_DIGEST"
  | "ASSIGN"
  | "CHANGE"
  | "CANCEL"
  | "SCHEDULE_CHANGE"
  | "ANNOUNCEMENT"
  | "PLANNING_REMINDER";
export type DeliveryStatus = "PENDING" | "SENT" | "FAILED" | "SKIPPED";

export interface SendInAppPayload {
  userId: number;
  kind: NotificationKind;
  title: string;
  body: string;
  href?: string | null;
  sessionId?: number | null;
  dedupeKey?: string;
}

export interface SendEmailPayload {
  to: string;
  teacherId: number;
  kind: NotificationKind;
  subject: string;
  text: string;
  html?: string;
  forDate: string; // YYYY-MM-DD
  dedupeKey: string;
}

export { normalizeBdPhone, buildWhatsAppLink } from "@/lib/phone";

/**
 * Sends or updates an IN_APP notification.
 * Uses dedupeKey to collapse repeated edits to the same session/event.
 */
export async function sendInAppNotification(payload: SendInAppPayload) {
  try {
    if (payload.dedupeKey) {
      return await prisma.notification.upsert({
        where: { dedupeKey: payload.dedupeKey },
        update: {
          title: payload.title,
          body: payload.body,
          href: payload.href ?? null,
          sessionId: payload.sessionId ?? null,
          kind: payload.kind,
          readAt: null, // Reset unread status when updated
          createdAt: new Date(),
        },
        create: {
          userId: payload.userId,
          kind: payload.kind,
          title: payload.title,
          body: payload.body,
          href: payload.href ?? null,
          sessionId: payload.sessionId ?? null,
          dedupeKey: payload.dedupeKey,
        },
      });
    }

    return await prisma.notification.create({
      data: {
        userId: payload.userId,
        kind: payload.kind,
        title: payload.title,
        body: payload.body,
        href: payload.href ?? null,
        sessionId: payload.sessionId ?? null,
      },
    });
  } catch (err: any) {
    console.error("[sendInAppNotification] Failed:", err);
    throw err;
  }
}

/**
 * Transporter singleton for nodemailer SMTP
 */
function getEmailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (!host) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
    // Short timeouts to prevent serverless lockup
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  });
}

/**
 * Delivers an EMAIL notification with automatic retry (up to maxAttempts)
 * and writes to NotificationLog.
 */
export async function sendEmailNotification(
  payload: SendEmailPayload,
  maxAttempts = 3
): Promise<{ status: DeliveryStatus; logId?: number; error?: string }> {
  // Check idempotency: if already SENT with this dedupeKey, skip
  if (payload.dedupeKey) {
    const existing = await prisma.notificationLog.findUnique({
      where: { dedupeKey: payload.dedupeKey },
    });
    if (existing && existing.status === "SENT") {
      return { status: "SKIPPED", logId: existing.id };
    }
  }

  const fromEmail =
    process.env.SMTP_FROM ||
    process.env.EMAIL_FROM ||
    `"ScienceLab Academic Routine" <noreply@sciencelab.edu.bd>`;

  const transporter = getEmailTransporter();
  const isTestMock = Boolean((globalThis as any).__TEST_SMTP_MOCK__);

  // If SMTP is not configured and not in mock mode, mark as FAILED with descriptive error
  if (!transporter && !isTestMock) {
    const errMessage = "SMTP server is not configured (SMTP_HOST is missing in environment)";
    const log = await prisma.notificationLog.upsert({
      where: { dedupeKey: payload.dedupeKey },
      update: {
        status: "FAILED",
        error: errMessage,
        attempts: { increment: 1 },
      },
      create: {
        teacherId: payload.teacherId,
        channel: "EMAIL",
        kind: payload.kind,
        forDate: payload.forDate,
        status: "FAILED",
        recipient: payload.to,
        error: errMessage,
        attempts: 1,
        dedupeKey: payload.dedupeKey,
      },
    });
    return { status: "FAILED", logId: log.id, error: errMessage };
  }

  // Attempt delivery with retry
  let attempt = 0;
  let lastError: any = null;
  let messageId: string | null = null;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      if (isTestMock) {
        // Mock successful delivery for unit tests without network calls
        messageId = `<mock-${Date.now()}-${attempt}@sciencelab.local>`;
      } else if (transporter) {
        const info = await transporter.sendMail({
          from: fromEmail,
          to: payload.to,
          subject: payload.subject,
          text: payload.text,
          html: payload.html || payload.text.replace(/\n/g, "<br>"),
        });
        messageId = info.messageId || `smtp-${Date.now()}`;
      }
      break;
    } catch (err: any) {
      lastError = err;
      console.warn(`[sendEmailNotification] Attempt ${attempt} failed for ${payload.to}:`, err.message);
      if (attempt < maxAttempts) {
        // Exponential backoff wait (500ms, 1000ms)
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    }
  }

  if (messageId) {
    const log = await prisma.notificationLog.upsert({
      where: { dedupeKey: payload.dedupeKey },
      update: {
        status: "SENT",
        providerMessageId: messageId,
        error: null,
        attempts: attempt,
        sentAt: new Date(),
      },
      create: {
        teacherId: payload.teacherId,
        channel: "EMAIL",
        kind: payload.kind,
        forDate: payload.forDate,
        status: "SENT",
        recipient: payload.to,
        providerMessageId: messageId,
        attempts: attempt,
        sentAt: new Date(),
        dedupeKey: payload.dedupeKey,
      },
    });
    return { status: "SENT", logId: log.id };
  } else {
    const errText = lastError?.message || "Email delivery failed after max retries";
    const log = await prisma.notificationLog.upsert({
      where: { dedupeKey: payload.dedupeKey },
      update: {
        status: "FAILED",
        error: errText,
        attempts: attempt,
      },
      create: {
        teacherId: payload.teacherId,
        channel: "EMAIL",
        kind: payload.kind,
        forDate: payload.forDate,
        status: "FAILED",
        recipient: payload.to,
        error: errText,
        attempts: attempt,
        dedupeKey: payload.dedupeKey,
      },
    });
    return { status: "FAILED", logId: log.id, error: errText };
  }
}

/**
 * Formats the standard teacher daily digest text according to Spec Section 9:
 *
 * Sci-Lab — Your schedule for Sat, 25 Oct
 * 1) 4:00 PM — Physics — Batch 2620 (SSC Boys)
 * 2) 6:00 PM — Chemistry — Batch 2610 (SSC Girls)
 * 3) 10:00 AM — Exam duty — Model Test 2
 * Reply to the office for any change.
 */
export function formatTeacherDailyDigest(
  forDate: string,
  sessions: any[]
): { text: string; html: string; sessionCount: number } {
  const headerDate = formatDhakaDate(forDate, "digest"); // e.g. "Sat, 25 Oct"
  const lines: string[] = [`Sci-Lab — Your schedule for ${headerDate}`];
  const htmlItems: string[] = [];

  // Sort sessions chronologically
  const sorted = [...sessions].sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

  sorted.forEach((s, idx) => {
    const num = idx + 1;
    const timeFormatted = formatTime12h(s.startTime);

    if (s.kind === "EXAM_DUTY") {
      const examTitle = s.specialExam?.title || s.exam?.type || "Invigilation Duty";
      const roomStr = s.room ? ` (Room ${s.room})` : "";
      const line = `${num}) ${timeFormatted} — Exam duty — ${examTitle}${roomStr}`;
      lines.push(line);
      htmlItems.push(`
        <li style="margin-bottom: 8px; padding: 6px 10px; background-color: #fdf2f8; border-left: 3px solid #ec4899; border-radius: 4px;">
          <strong>${timeFormatted}</strong> &mdash; <span style="color: #be185d; font-weight: 600;">Exam Duty</span> &mdash; ${examTitle}${roomStr}
        </li>
      `);
    } else {
      const subject = s.subjectName || s.programSubject?.name || "Class";
      const batchName = s.batch?.name || (s.batch?.code ? `Batch ${s.batch.code}` : "Batch");
      const roomStr = s.room ? ` (${s.room.toLowerCase().startsWith("room") ? s.room : `Room ${s.room}`})` : "";
      const extraTag = s.kind === "EXTRA" ? " [Extra Class]" : "";
      const line = `${num}) ${timeFormatted} — ${subject}${extraTag} — ${batchName}${roomStr}`;
      lines.push(line);
      htmlItems.push(`
        <li style="margin-bottom: 8px; padding: 6px 10px; background-color: #f0fdf4; border-left: 3px solid #16a34a; border-radius: 4px;">
          <strong>${timeFormatted}</strong> &mdash; <strong>${subject}${extraTag}</strong> &mdash; ${batchName}${roomStr}
        </li>
      `);
    }
  });

  lines.push("Reply to the office for any change.");

  const text = lines.join("\n");
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; line-height: 1.5; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <div style="border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 16px;">
        <h2 style="margin: 0; color: #1e1b4b; font-size: 20px;">ScienceLab Coaching Center</h2>
        <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 13px;">Daily Faculty Class Schedule</p>
      </div>
      <p style="font-size: 15px; font-weight: 600; color: #374151; margin-bottom: 12px;">
        Schedule for ${headerDate}:
      </p>
      <ul style="list-style: none; padding: 0; margin: 0 0 16px 0;">
        ${htmlItems.join("")}
      </ul>
      <div style="margin-top: 20px; padding: 12px; background-color: #f9fafb; border-radius: 6px; font-size: 12px; color: #6b7280;">
        <p style="margin: 0;">Please arrive 10 minutes prior to class time. Reply to the office staff or phone directly for any schedule adjustments.</p>
      </div>
    </div>
  `;

  return { text, html, sessionCount: sorted.length };
}

/**
 * Runs the Daily Digest job (scheduled at 19:00 Dhaka time).
 * Builds one message per teacher with sessions tomorrow, delivers via Email & In-App,
 * creates NotificationLog records, and records a JobRun entry.
 */
export async function runDailyDigestJob(options?: {
  forDate?: string;
  force?: boolean;
}): Promise<{
  success: boolean;
  forDate: string;
  jobRunId: number;
  processedTeachers: number;
  sentEmails: number;
  skippedEmails: number;
  failedEmails: number;
  sentInApp: number;
  error?: string;
}> {
  const targetDate = options?.forDate || tomorrowDhaka();
  const dbDate = toDhakaDbDate(targetDate);
  const force = Boolean(options?.force);

  // Initialize JobRun
  const jobRun = await prisma.jobRun.create({
    data: {
      job: "DAILY_DIGEST",
      forDate: targetDate,
      status: "RUNNING",
      startedAt: new Date(),
    },
  });

  try {
    // Query all SCHEDULED sessions for targetDate
    const sessions = await prisma.classSession.findMany({
      where: {
        date: dbDate,
        status: { in: ["SCHEDULED", "CONDUCTED"] },
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            notifyEmail: true,
            whatsappNumber: true,
            userId: true,
          },
        },
        batch: { select: { id: true, name: true, code: true } },
        specialExam: { select: { id: true, title: true } },
        exam: { select: { id: true, type: true } },
      },
      orderBy: { startTime: "asc" },
    });

    // Group sessions by teacherId
    const teacherSessionsMap = new Map<number, { teacher: any; sessions: any[] }>();
    for (const s of sessions) {
      if (!s.teacherId || !s.teacher) continue;
      if (!teacherSessionsMap.has(s.teacherId)) {
        teacherSessionsMap.set(s.teacherId, { teacher: s.teacher, sessions: [] });
      }
      teacherSessionsMap.get(s.teacherId)!.sessions.push(s);
    }

    let sentEmails = 0;
    let skippedEmails = 0;
    let failedEmails = 0;
    let sentInApp = 0;

    for (const [teacherId, { teacher, sessions: teacherSessions }] of teacherSessionsMap.entries()) {
      if (teacherSessions.length === 0) continue;

      const { text, html } = formatTeacherDailyDigest(targetDate, teacherSessions);
      const emailDedupeKey = `teacher:${teacherId}:${targetDate}:EMAIL:DAILY_DIGEST`;
      const inAppDedupeKey = `teacher:${teacherId}:${targetDate}:IN_APP:DAILY_DIGEST`;

      // 1. In-App Bell Notification for Teacher (if teacher has linked user account)
      if (teacher.userId) {
        try {
          await sendInAppNotification({
            userId: teacher.userId,
            kind: "DAILY_DIGEST",
            title: `Your Schedule for ${formatDhakaDate(targetDate, "short")}`,
            body: text,
            href: "/teacher-route/routine",
            dedupeKey: inAppDedupeKey,
          });
          sentInApp++;
        } catch (inAppErr) {
          console.error(`[runDailyDigestJob] Failed in-app notice for teacher #${teacherId}:`, inAppErr);
        }
      }

      // 2. Email Delivery (if teacher has notifyEmail enabled and a valid email address)
      if (teacher.notifyEmail && teacher.email && teacher.email.includes("@")) {
        // If not force, check if already sent
        if (!force) {
          const alreadySent = await prisma.notificationLog.findFirst({
            where: { dedupeKey: emailDedupeKey, status: "SENT" },
          });
          if (alreadySent) {
            skippedEmails++;
            continue;
          }
        }

        const emailResult = await sendEmailNotification({
          to: teacher.email,
          teacherId,
          kind: "DAILY_DIGEST",
          subject: `Sci-Lab — Class Routine for ${formatDhakaDate(targetDate, "digest")}`,
          text,
          html,
          forDate: targetDate,
          dedupeKey: emailDedupeKey,
        });

        if (emailResult.status === "SENT") {
          sentEmails++;
        } else if (emailResult.status === "SKIPPED") {
          skippedEmails++;
        } else {
          failedEmails++;
        }
      } else {
        // Teacher has no email or opted out: record SKIPPED log
        await prisma.notificationLog.upsert({
          where: { dedupeKey: emailDedupeKey },
          update: {
            status: "SKIPPED",
            error: !teacher.notifyEmail ? "Email notifications disabled by teacher" : "No email address on file",
          },
          create: {
            teacherId,
            channel: "EMAIL",
            kind: "DAILY_DIGEST",
            forDate: targetDate,
            status: "SKIPPED",
            recipient: teacher.email || null,
            error: !teacher.notifyEmail ? "Email notifications disabled by teacher" : "No email address on file",
            attempts: 0,
            dedupeKey: emailDedupeKey,
          },
        });
        skippedEmails++;
      }
    }

    const summary = {
      targetDate,
      processedTeachers: teacherSessionsMap.size,
      totalSessions: sessions.length,
      sentEmails,
      skippedEmails,
      failedEmails,
      sentInApp,
    };

    await prisma.jobRun.update({
      where: { id: jobRun.id },
      data: {
        status: failedEmails > 0 && sentEmails === 0 ? "FAILED" : "SUCCESS",
        finishedAt: new Date(),
        summary,
      },
    });

    return {
      success: true,
      forDate: targetDate,
      jobRunId: jobRun.id,
      processedTeachers: teacherSessionsMap.size,
      sentEmails,
      skippedEmails,
      failedEmails,
      sentInApp,
    };
  } catch (err: any) {
    console.error("[runDailyDigestJob] Fatal error:", err);
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
      forDate: targetDate,
      jobRunId: jobRun.id,
      processedTeachers: 0,
      sentEmails: 0,
      skippedEmails: 0,
      failedEmails: 0,
      sentInApp: 0,
      error: err.message,
    };
  }
}

/**
 * Checks whether an immediate change notice should be sent to a teacher.
 * Rules from Spec Section 6:
 * - A change made BEFORE the 19:00 digest is sent for tomorrow appears in the digest only.
 * - A change made AFTER the digest, or for TODAY (or past dates), sends an immediate notice.
 */
export async function shouldSendImmediateTeacherNotice(
  teacherId: number,
  sessionDateString: string
): Promise<boolean> {
  const today = todayDhaka();
  const tomorrow = tomorrowDhaka();

  // If change is for today or earlier, immediate notice is always sent
  if (sessionDateString <= today) {
    return true;
  }

  // If change is for tomorrow:
  if (sessionDateString === tomorrow) {
    // Check if the 19:00 digest has already been sent to this teacher
    const digestLog = await prisma.notificationLog.findFirst({
      where: {
        teacherId,
        forDate: tomorrow,
        kind: "DAILY_DIGEST",
        status: "SENT",
      },
    });

    if (digestLog) {
      return true; // Digest was already sent, so teacher must be alerted immediately!
    }

    // If past 7:00 PM Dhaka, immediate notice is sent
    if (isPast7PmDhaka()) {
      return true;
    }

    // Before 19:00 and digest not yet sent -> will appear in 19:00 digest
    return false;
  }

  // For dates beyond tomorrow, routine is still being planned, skip immediate noise
  return false;
}

export interface NotifySessionChangeParams {
  action: "CREATE" | "UPDATE" | "REASSIGN" | "RESCHEDULE" | "CANCEL";
  session: any;
  originalSession?: any;
  previousTeacherId?: number;
  newTeacherId?: number;
  reason?: string;
  affectedStudents?: Array<{ id: number; name: string; userId?: number | null }>;
}

/**
 * Dispatches immediate change notices to affected teachers and students.
 */
export async function notifySessionChange(params: NotifySessionChangeParams) {
  const { action, session, originalSession, reason, affectedStudents } = params;
  const sessionDateStr = toDhakaDateString(session.date);
  const formattedDate = formatDhakaDate(sessionDateStr, "medium");
  const timeFormatted = formatTime12h(session.startTime);
  const subject = session.subjectName || "Class";
  const batchName = session.batch?.name || (session.batch?.code ? `Batch ${session.batch.code}` : "Batch");

  // ----------------------------------------------------
  // 1. Teacher Notices
  // ----------------------------------------------------
  if (action === "REASSIGN") {
    // Old teacher gets CANCEL / UNASSIGN notice
    if (params.previousTeacherId) {
      const oldTeacherId = params.previousTeacherId;
      const shouldSend = await shouldSendImmediateTeacherNotice(oldTeacherId, sessionDateStr);
      if (shouldSend) {
        const oldTeacher = await prisma.teacher.findUnique({
          where: { id: oldTeacherId },
          select: { id: true, name: true, email: true, notifyEmail: true, userId: true },
        });

        if (oldTeacher) {
          const title = `Class Reassigned: ${subject} (${batchName})`;
          const body = `Your ${subject} session for ${batchName} on ${formattedDate} at ${timeFormatted} has been reassigned to another teacher. Reason: ${reason || "Faculty reassignment"}`;

          if (oldTeacher.userId) {
            await sendInAppNotification({
              userId: oldTeacher.userId,
              kind: "CANCEL",
              title,
              body,
              sessionId: session.id,
              dedupeKey: `teacher:${oldTeacherId}:session:${session.id}:REASSIGN_OLD`,
            });
          }

          if (oldTeacher.notifyEmail && oldTeacher.email) {
            await sendEmailNotification({
              to: oldTeacher.email,
              teacherId: oldTeacherId,
              kind: "CANCEL",
              subject: `Sci-Lab Notice: ${title}`,
              text: body,
              forDate: sessionDateStr,
              dedupeKey: `teacher:${oldTeacherId}:session:${session.id}:EMAIL_REASSIGN_OLD`,
            });
          }
        }
      }
    }

    // New teacher gets ASSIGN notice
    const newTeacherId = session.teacherId;
    if (newTeacherId) {
      const shouldSend = await shouldSendImmediateTeacherNotice(newTeacherId, sessionDateStr);
      if (shouldSend) {
        const newTeacher = await prisma.teacher.findUnique({
          where: { id: newTeacherId },
          select: { id: true, name: true, email: true, notifyEmail: true, userId: true },
        });

        if (newTeacher) {
          const title = `New Assignment: ${subject} (${batchName})`;
          const body = `You have been assigned to conduct ${subject} for ${batchName} on ${formattedDate} at ${timeFormatted}${session.room ? ` (Room ${session.room})` : ""}. Reason: ${reason || "Assignment"}`;

          if (newTeacher.userId) {
            await sendInAppNotification({
              userId: newTeacher.userId,
              kind: "ASSIGN",
              title,
              body,
              href: "/teacher-route/routine",
              sessionId: session.id,
              dedupeKey: `teacher:${newTeacherId}:session:${session.id}:REASSIGN_NEW`,
            });
          }

          if (newTeacher.notifyEmail && newTeacher.email) {
            await sendEmailNotification({
              to: newTeacher.email,
              teacherId: newTeacherId,
              kind: "ASSIGN",
              subject: `Sci-Lab Assignment: ${title}`,
              text: body,
              forDate: sessionDateStr,
              dedupeKey: `teacher:${newTeacherId}:session:${session.id}:EMAIL_REASSIGN_NEW`,
            });
          }
        }
      }
    }
  } else if (action === "RESCHEDULE") {
    const teacherId = session.teacherId;
    if (teacherId) {
      const origDateStr = originalSession ? toDhakaDateString(originalSession.date) : sessionDateStr;
      const origFormattedDate = formatDhakaDate(origDateStr, "medium");
      const origTime = originalSession ? formatTime12h(originalSession.startTime) : "";

      const shouldSend =
        (await shouldSendImmediateTeacherNotice(teacherId, origDateStr)) ||
        (await shouldSendImmediateTeacherNotice(teacherId, sessionDateStr));

      if (shouldSend) {
        const teacher = await prisma.teacher.findUnique({
          where: { id: teacherId },
          select: { id: true, name: true, email: true, notifyEmail: true, userId: true },
        });

        if (teacher) {
          const title = `Class Rescheduled: ${subject} (${batchName})`;
          // Template from spec: Update: Physics, Batch 2620 moved to Sun 26 Oct, 4:00 PM (was Sat 25 Oct, 5:00 PM). Reason: <reason>
          const body = `Update: ${subject}, ${batchName} moved to ${formattedDate}, ${timeFormatted} (was ${origFormattedDate}, ${origTime}). Reason: ${reason || "Routine adjustment"}`;

          if (teacher.userId) {
            await sendInAppNotification({
              userId: teacher.userId,
              kind: "SCHEDULE_CHANGE",
              title,
              body,
              href: "/teacher-route/routine",
              sessionId: session.id,
              dedupeKey: `teacher:${teacherId}:session:${session.id}:RESCHEDULE`,
            });
          }

          if (teacher.notifyEmail && teacher.email) {
            await sendEmailNotification({
              to: teacher.email,
              teacherId,
              kind: "CHANGE",
              subject: `Sci-Lab Notice: ${title}`,
              text: body,
              forDate: sessionDateStr,
              dedupeKey: `teacher:${teacherId}:session:${session.id}:EMAIL_RESCHEDULE`,
            });
          }
        }
      }
    }
  } else if (action === "CANCEL") {
    const teacherId = session.teacherId;
    if (teacherId) {
      const shouldSend = await shouldSendImmediateTeacherNotice(teacherId, sessionDateStr);
      if (shouldSend) {
        const teacher = await prisma.teacher.findUnique({
          where: { id: teacherId },
          select: { id: true, name: true, email: true, notifyEmail: true, userId: true },
        });

        if (teacher) {
          const title = `Class Cancelled: ${subject} (${batchName})`;
          const body = `Notice: ${subject} for ${batchName} on ${formattedDate} at ${timeFormatted} has been cancelled. Reason: ${reason || "Office schedule notice"}`;

          if (teacher.userId) {
            await sendInAppNotification({
              userId: teacher.userId,
              kind: "CANCEL",
              title,
              body,
              sessionId: session.id,
              dedupeKey: `teacher:${teacherId}:session:${session.id}:CANCEL`,
            });
          }

          if (teacher.notifyEmail && teacher.email) {
            await sendEmailNotification({
              to: teacher.email,
              teacherId,
              kind: "CANCEL",
              subject: `Sci-Lab Notice: ${title}`,
              text: body,
              forDate: sessionDateStr,
              dedupeKey: `teacher:${teacherId}:session:${session.id}:EMAIL_CANCEL`,
            });
          }
        }
      }
    }
  } else if (action === "CREATE" || action === "UPDATE") {
    // Only send immediate notice if for today or tomorrow post-digest
    const teacherId = session.teacherId;
    if (teacherId) {
      const shouldSend = await shouldSendImmediateTeacherNotice(teacherId, sessionDateStr);
      if (shouldSend) {
        const teacher = await prisma.teacher.findUnique({
          where: { id: teacherId },
          select: { id: true, name: true, email: true, notifyEmail: true, userId: true },
        });

        if (teacher) {
          const isExtra = session.kind === "EXTRA";
          const title = isExtra ? `Extra Class Scheduled: ${subject}` : `Schedule Update: ${subject}`;
          const body = `${isExtra ? "Extra class" : "Class session"} scheduled for ${batchName} on ${formattedDate} at ${timeFormatted}${session.room ? ` (Room ${session.room})` : ""}.`;

          if (teacher.userId) {
            await sendInAppNotification({
              userId: teacher.userId,
              kind: "SCHEDULE_CHANGE",
              title,
              body,
              href: "/teacher-route/routine",
              sessionId: session.id,
              dedupeKey: `teacher:${teacherId}:session:${session.id}:CREATE_UPDATE`,
            });
          }

          if (teacher.notifyEmail && teacher.email) {
            await sendEmailNotification({
              to: teacher.email,
              teacherId,
              kind: "CHANGE",
              subject: `Sci-Lab Notice: ${title}`,
              text: body,
              forDate: sessionDateStr,
              dedupeKey: `teacher:${teacherId}:session:${session.id}:EMAIL_CREATE_UPDATE`,
            });
          }
        }
      }
    }
  }

  // ----------------------------------------------------
  // 2. Student In-App Notices
  // ----------------------------------------------------
  // Exam duty creates NO student notice.
  if (session.kind === "EXAM_DUTY") {
    return;
  }

  // Students with linked user accounts receive in-app notice
  // Deduplication collapses repeated edits to the same session
  if (affectedStudents && affectedStudents.length > 0) {
    let studentTitle = "";
    let studentBody = "";

    if (action === "RESCHEDULE") {
      const origDateStr = originalSession ? toDhakaDateString(originalSession.date) : sessionDateStr;
      const origFormattedDate = formatDhakaDate(origDateStr, "medium");
      const origTime = originalSession ? formatTime12h(originalSession.startTime) : "";
      studentTitle = `Class Rescheduled: ${subject}`;
      // Template from spec: Physics class rescheduled to Sun 26 Oct, 4:00 PM (was Sat 25 Oct, 5:00 PM).
      studentBody = `${subject} class rescheduled to ${formattedDate}, ${timeFormatted} (was ${origFormattedDate}, ${origTime}).`;
    } else if (action === "CANCEL") {
      studentTitle = `Class Cancelled: ${subject}`;
      studentBody = `${subject} class on ${formattedDate} at ${timeFormatted} has been cancelled. Reason: ${reason || "Notice"}`;
    } else if (action === "CREATE" && session.kind === "EXTRA") {
      studentTitle = `Extra Class: ${subject}`;
      studentBody = `An extra ${subject} class has been scheduled on ${formattedDate} at ${timeFormatted}${session.room ? ` (Room ${session.room})` : ""}.`;
    } else if (action === "REASSIGN") {
      studentTitle = `Teacher Update: ${subject}`;
      studentBody = `${subject} class on ${formattedDate} at ${timeFormatted} will be conducted by ${session.teacher?.name || "new faculty"}.`;
    } else {
      studentTitle = `Schedule Update: ${subject}`;
      studentBody = `${subject} class on ${formattedDate} updated to ${timeFormatted}${session.room ? ` (Room ${session.room})` : ""}.`;
    }

    const sessionIdForDedupe = originalSession?.id || session.id;

    for (const st of affectedStudents) {
      if (!st.userId) continue; // Only students with accounts get in-app notices

      try {
        await sendInAppNotification({
          userId: st.userId,
          kind: action === "CANCEL" ? "CANCEL" : "SCHEDULE_CHANGE",
          title: studentTitle,
          body: studentBody,
          href: "/student-route/schedule",
          sessionId: session.id,
          // Collapsing repeated edits to the same session:
          dedupeKey: `student:${st.userId}:session:${sessionIdForDedupe}`,
        });
      } catch (stErr) {
        console.error(`[notifySessionChange] Failed student notice for user #${st.userId}:`, stErr);
      }
    }
  }
}

/**
 * Runs the staff planning reminder job (scheduled around 17:30 Dhaka time).
 * Checks if tomorrow has 0 scheduled sessions; if so, alerts ADMIN and STAFF.
 */
export async function runPlanningReminderJob(options?: {
  forDate?: string;
}): Promise<{
  success: boolean;
  forDate: string;
  sessionsCount: number;
  remindedStaffCount: number;
}> {
  const targetDate = options?.forDate || tomorrowDhaka();
  const dbDate = toDhakaDbDate(targetDate);

  const jobRun = await prisma.jobRun.create({
    data: {
      job: "PLANNING_REMINDER",
      forDate: targetDate,
      status: "RUNNING",
      startedAt: new Date(),
    },
  });

  try {
    const sessionCount = await prisma.classSession.count({
      where: {
        date: dbDate,
        status: { in: ["SCHEDULED", "CONDUCTED"] },
      },
    });

    let remindedStaffCount = 0;

    if (sessionCount === 0) {
      const staffUsers = await prisma.user.findMany({
        where: {
          role: { in: ["ADMIN", "STAFF"] },
          active: true,
        },
        select: { id: true, name: true, role: true },
      });

      const formattedTomorrow = formatDhakaDate(targetDate, "medium");
      const title = "Planning Reminder: Tomorrow's Routine";
      const body = `No classes or exam duties have been scheduled yet for tomorrow (${formattedTomorrow}). Please review and plan the day's routine before 19:00.`;

      for (const staff of staffUsers) {
        await sendInAppNotification({
          userId: staff.id,
          kind: "PLANNING_REMINDER",
          title,
          body,
          href: `/admin-route/routine?date=${targetDate}`,
          dedupeKey: `user:${staff.id}:${targetDate}:PLANNING_REMINDER`,
        });
        remindedStaffCount++;
      }
    }

    await prisma.jobRun.update({
      where: { id: jobRun.id },
      data: {
        status: "SUCCESS",
        finishedAt: new Date(),
        summary: { targetDate, sessionCount, remindedStaffCount },
      },
    });

    return {
      success: true,
      forDate: targetDate,
      sessionsCount: sessionCount,
      remindedStaffCount,
    };
  } catch (err: any) {
    console.error("[runPlanningReminderJob] Error:", err);
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
      forDate: targetDate,
      sessionsCount: 0,
      remindedStaffCount: 0,
    };
  }
}
