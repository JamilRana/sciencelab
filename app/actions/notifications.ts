"use server";

import { prisma } from "@/lib/prisma";
import { requireRole, getCurrentSession } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignored outside Next.js request context (e.g. test runner)
  }
}
import {
  runDailyDigestJob,
  sendEmailNotification,
  buildWhatsAppLink,
  normalizeBdPhone,
  formatTeacherDailyDigest,
} from "@/lib/notifications";
import { tomorrowDhaka, toDhakaDbDate } from "@/lib/dhaka-time";
import {
  isWhatsAppCloudConfigured,
  sendWhatsAppCloudMessage,
} from "@/lib/whatsapp-cloud";

/**
 * Returns the logged-in user's recent in-app notifications.
 */
export async function getInAppNotificationsAction(limit = 20) {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized", data: [] };
  }

  const userId = typeof session.user.id === "string" ? parseInt(session.user.id, 10) : session.user.id;

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, readAt: null },
    });

    return {
      success: true,
      data: notifications,
      unreadCount,
    };
  } catch (error: any) {
    console.error("[getInAppNotificationsAction] Error:", error);
    return { success: false, error: error.message || "Failed to load notifications", data: [] };
  }
}

/**
 * Marks one or all in-app notifications as read for the logged-in user.
 */
export async function markNotificationReadAction(notificationId: number | "all") {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = typeof session.user.id === "string" ? parseInt(session.user.id, 10) : session.user.id;

  try {
    if (notificationId === "all") {
      await prisma.notification.updateMany({
        where: { userId, readAt: null },
        data: { readAt: new Date() },
      });
    } else {
      await prisma.notification.updateMany({
        where: { id: notificationId, userId },
        data: { readAt: new Date() },
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("[markNotificationReadAction] Error:", error);
    return { success: false, error: error.message || "Failed to update notification" };
  }
}

/**
 * Returns filtered delivery logs (NotificationLog) for the admin notification center.
 */
export async function getNotificationLogsAction(filters?: {
  date?: string;
  teacherId?: number;
  channel?: string;
  status?: string;
  take?: number;
  skip?: number;
}) {
  await requireRole(["ADMIN", "STAFF"]);

  try {
    const where: any = {};
    if (filters?.date) where.forDate = filters.date;
    if (filters?.teacherId) where.teacherId = filters.teacherId;
    if (filters?.channel && filters.channel !== "ALL") where.channel = filters.channel;
    if (filters?.status && filters.status !== "ALL") where.status = filters.status;

    const [logs, total] = await Promise.all([
      prisma.notificationLog.findMany({
        where,
        include: {
          teacher: {
            select: { id: true, name: true, mobile: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: filters?.take || 50,
        skip: filters?.skip || 0,
      }),
      prisma.notificationLog.count({ where }),
    ]);

    return { success: true, data: logs, total };
  } catch (error: any) {
    console.error("[getNotificationLogsAction] Error:", error);
    return { success: false, error: error.message || "Failed to fetch logs", data: [], total: 0 };
  }
}

/**
 * Retries a FAILED email notification delivery.
 */
export async function retryNotificationAction(logId: number) {
  await requireRole(["ADMIN", "STAFF"]);

  try {
    const log = await prisma.notificationLog.findUnique({
      where: { id: logId },
      include: { teacher: true },
    });

    if (!log) {
      return { success: false, error: "Notification log record not found" };
    }

    if (log.channel !== "EMAIL") {
      return { success: false, error: "Only email notifications can be retried through the provider transport" };
    }

    if (!log.teacher.email) {
      return { success: false, error: "Teacher has no email address configured" };
    }

    // Reconstruct digest for the given date
    const dbDate = toDhakaDbDate(log.forDate);
    const sessions = await prisma.classSession.findMany({
      where: {
        teacherId: log.teacherId,
        date: dbDate,
        status: { in: ["SCHEDULED", "CONDUCTED"] },
      },
      include: {
        batch: { select: { id: true, name: true, code: true } },
        specialExam: { select: { id: true, title: true } },
        exam: { select: { id: true, type: true } },
      },
      orderBy: { startTime: "asc" },
    });

    const { text, html } = formatTeacherDailyDigest(log.forDate, sessions);

    const result = await sendEmailNotification(
      {
        to: log.teacher.email,
        teacherId: log.teacherId,
        kind: (log.kind as any) || "DAILY_DIGEST",
        subject: `Sci-Lab — Class Routine for ${log.forDate} (Retry)`,
        text,
        html,
        forDate: log.forDate,
        dedupeKey: `retry:${log.id}:${Date.now()}`,
      },
      3
    );

    safeRevalidate("/admin-route/routine/tomorrow");
    safeRevalidate("/admin-route/routine/notifications");

    return {
      success: result.status === "SENT",
      status: result.status,
      error: result.error,
    };
  } catch (error: any) {
    console.error("[retryNotificationAction] Error:", error);
    return { success: false, error: error.message || "Failed to retry delivery" };
  }
}

/**
 * Generates the pre-filled WhatsApp digest URL for a teacher on tomorrow's date.
 */
export async function getTeacherDigestWhatsAppUrlAction(teacherId: number, forDate?: string) {
  await requireRole(["ADMIN", "STAFF"]);

  const targetDate = forDate || tomorrowDhaka();
  const dbDate = toDhakaDbDate(targetDate);

  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { id: true, name: true, mobile: true, whatsappNumber: true },
    });

    if (!teacher) {
      return { success: false, error: "Teacher not found" };
    }

    const sessions = await prisma.classSession.findMany({
      where: {
        teacherId,
        date: dbDate,
        status: { in: ["SCHEDULED", "CONDUCTED"] },
      },
      include: {
        batch: { select: { id: true, name: true, code: true } },
        specialExam: { select: { id: true, title: true } },
        exam: { select: { id: true, type: true } },
      },
      orderBy: { startTime: "asc" },
    });

    if (sessions.length === 0) {
      return { success: false, error: "No sessions scheduled for this teacher on this date" };
    }

    const { text } = formatTeacherDailyDigest(targetDate, sessions);
    const targetPhone = teacher.whatsappNumber || teacher.mobile;

    if (!targetPhone) {
      return { success: false, error: "Teacher has no mobile or WhatsApp number on file" };
    }

    const url = buildWhatsAppLink(targetPhone, text);

    return {
      success: true,
      url,
      text,
      targetPhone,
      sessionCount: sessions.length,
    };
  } catch (error: any) {
    console.error("[getTeacherDigestWhatsAppUrlAction] Error:", error);
    return { success: false, error: error.message || "Failed to generate WhatsApp link" };
  }
}

/**
 * Logs that a staff member sent the routine digest to a teacher via WhatsApp.
 */
export async function logWhatsAppSentAction(teacherId: number, forDate?: string) {
  await requireRole(["ADMIN", "STAFF"]);

  const targetDate = forDate || tomorrowDhaka();
  const dedupeKey = `teacher:${teacherId}:${targetDate}:WHATSAPP_LINK:DAILY_DIGEST`;

  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { mobile: true, whatsappNumber: true },
    });

    const phone = teacher?.whatsappNumber || teacher?.mobile || null;

    const log = await prisma.notificationLog.upsert({
      where: { dedupeKey },
      update: {
        status: "SENT",
        recipient: phone,
        sentAt: new Date(),
        attempts: { increment: 1 },
      },
      create: {
        teacherId,
        channel: "WHATSAPP_LINK",
        kind: "DAILY_DIGEST",
        forDate: targetDate,
        status: "SENT",
        recipient: phone,
        sentAt: new Date(),
        attempts: 1,
        dedupeKey,
      },
    });

    safeRevalidate("/admin-route/routine/tomorrow");
    return { success: true, data: log };
  } catch (error: any) {
    console.error("[logWhatsAppSentAction] Error:", error);
    return { success: false, error: error.message || "Failed to record WhatsApp log" };
  }
}

/**
 * Returns recent JobRun records.
 */
export async function getJobRunsAction(limit = 30) {
  await requireRole(["ADMIN", "STAFF"]);

  try {
    const jobRuns = await prisma.jobRun.findMany({
      orderBy: { startedAt: "desc" },
      take: limit,
    });
    return { success: true, data: jobRuns };
  } catch (error: any) {
    console.error("[getJobRunsAction] Error:", error);
    return { success: false, error: error.message || "Failed to fetch job runs", data: [] };
  }
}

/**
 * Manually triggers the Daily Digest job from the admin UI.
 */
export async function triggerDailyDigestAction(targetDate?: string, force = false) {
  await requireRole(["ADMIN", "STAFF"]);

  try {
    const result = await runDailyDigestJob({ forDate: targetDate, force });
    safeRevalidate("/admin-route/routine/tomorrow");
    safeRevalidate("/admin-route/routine/notifications");
    return { success: result.success, data: result };
  } catch (error: any) {
    console.error("[triggerDailyDigestAction] Error:", error);
    return { success: false, error: error.message || "Failed to run daily digest" };
  }
}

/**
 * Updates a teacher's notification settings (notifyEmail toggle and WhatsApp number).
 */
export async function updateTeacherNotificationSettingsAction(
  teacherId: number,
  data: {
    notifyEmail: boolean;
    whatsappNumber?: string | null;
  }
) {
  const user = await requireRole(["ADMIN", "STAFF", "TEACHER"]);

  // If TEACHER role, they can only edit their own settings
  if (user.role === "TEACHER") {
    const userIdNum = typeof user.id === "string" ? parseInt(user.id, 10) : user.id;
    const teacher = await prisma.teacher.findUnique({
      where: { userId: userIdNum },
      select: { id: true },
    });
    if (!teacher || teacher.id !== teacherId) {
      return { success: false, error: "Teachers can only modify their own notification settings" };
    }
  }

  try {
    let cleanWa = data.whatsappNumber?.trim() || null;
    if (cleanWa) {
      const normalized = normalizeBdPhone(cleanWa);
      if (normalized.isValid) {
        cleanWa = normalized.e164;
      }
    }

    const updated = await prisma.teacher.update({
      where: { id: teacherId },
      data: {
        notifyEmail: data.notifyEmail,
        whatsappNumber: cleanWa,
      },
    });

    safeRevalidate("/admin-route/teachers");
    safeRevalidate("/admin-route/routine/tomorrow");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("[updateTeacherNotificationSettingsAction] Error:", error);
    return { success: false, error: error.message || "Failed to update notification settings" };
  }
}

/**
 * Teacher/User acknowledgment ("Seen") for a specific notification.
 */
export async function acknowledgeNotificationAction(notificationId: number) {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = typeof session.user.id === "string" ? parseInt(session.user.id, 10) : session.user.id;

  try {
    const existing = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!existing || existing.userId !== userId) {
      return { success: false, error: "Notification not found or unauthorized" };
    }

    const now = new Date();
    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: now },
    });

    safeRevalidate("/teacher-route/agenda");
    return { success: true, acknowledgedAt: now, data: updated };
  } catch (error: any) {
    console.error("[acknowledgeNotificationAction] Error:", error);
    return { success: false, error: error.message || "Failed to acknowledge notification" };
  }
}

/**
 * Checks if WhatsApp Cloud API is configured.
 */
export async function isWhatsAppCloudConfiguredAction() {
  await requireRole(["ADMIN", "STAFF"]);
  return { configured: isWhatsAppCloudConfigured() };
}

/**
 * Sends a daily digest to a teacher using the official WhatsApp Cloud API.
 */
export async function sendWhatsAppCloudDigestAction(teacherId: number, forDate?: string) {
  await requireRole(["ADMIN", "STAFF"]);

  const targetDate = forDate || tomorrowDhaka();
  const dbDate = toDhakaDbDate(targetDate);

  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { id: true, name: true, mobile: true, whatsappNumber: true },
    });

    if (!teacher) {
      return { success: false, error: "Teacher not found" };
    }

    const recipient = teacher.whatsappNumber || teacher.mobile;
    if (!recipient) {
      return { success: false, error: "Teacher has no phone number on file" };
    }

    const sessions = await prisma.classSession.findMany({
      where: {
        teacherId,
        date: dbDate,
        status: { in: ["SCHEDULED", "CONDUCTED"] },
      },
      include: {
        batch: { select: { id: true, name: true, code: true } },
        program: { select: { id: true, name: true } },
        exam: { select: { id: true, type: true } },
        specialExam: { select: { id: true, title: true } },
      },
      orderBy: { startTime: "asc" },
    });

    if (sessions.length === 0) {
      return { success: false, error: `No scheduled sessions found for teacher on ${targetDate}` };
    }

    const { text: digestText } = formatTeacherDailyDigest(targetDate, sessions);

    const result = await sendWhatsAppCloudMessage({
      to: recipient,
      text: digestText,
      teacherId,
      kind: "DAILY_DIGEST",
      forDate: targetDate,
      dedupeKey: `teacher:${teacherId}:${targetDate}:WHATSAPP_CLOUD:DAILY_DIGEST`,
    });

    safeRevalidate("/admin-route/routine/tomorrow");
    return result;
  } catch (error: any) {
    console.error("[sendWhatsAppCloudDigestAction] Error:", error);
    return { success: false, error: error.message || "Failed to send WhatsApp Cloud message" };
  }
}
