"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";

export type TeacherAnalytics = {
  totalExamAssigned: number;
  markSubmitted: number;
  classesTaken: number;
  totalPaid: number;
  currentDue: number;
};

export async function createClassLogForTeacherAction(
  teacherId: number,
  data: {
    date: string;
    classes: number;
    notebook: number;
    other: number;
    month: string;
  }
) {
  await requireRole(["ADMIN", "STAFF"]);

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { perClass: true },
  });

  if (!teacher) {
    throw new Error("Teacher not found");
  }

  const totalActivities = data.classes + data.notebook + data.other;
  const amount = totalActivities * teacher.perClass;

  const log = await prisma.teacherClassLog.create({
    data: {
      teacherId,
      date: new Date(data.date),
      classes: data.classes,
      notebook: data.notebook,
      other: data.other,
      month: data.month,
      perClass: teacher.perClass,
      paid: 0,
    },
  });

  revalidatePath("/admin-route/class-log");
  return log;
}

export async function getTeacherAnalyticsAction(
  month?: string,
  year?: number
): Promise<TeacherAnalytics> {
  const session = await requireRole("TEACHER");
  
  const teacher = await prisma.teacher.findFirst({
    where: { userId: parseInt(session.id, 10) },
  });
  
  if (!teacher) {
    throw new Error("Teacher profile not found");
  }
  const teacherId = teacher.id;

  let monthFilter = month;
  let yearFilter = year || new Date().getFullYear();

  if (!monthFilter) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    monthFilter = months[new Date().getMonth()];
  }

  // Get exam subjects assigned to this teacher
  const examSubjects = await prisma.examSubject.findMany({
    where: { teacherId },
    select: { id: true },
  });
  
  const examSubjectIds = examSubjects.map((es) => es.id);
  const examAssigned = examSubjects.length;

  // Count marks submitted for teacher's subjects
let markSubmitted = 0;
if (examSubjectIds.length > 0) {
  const result = await prisma.mark.groupBy({
    by: ['examSubjectId'],
    where: { examSubjectId: { in: examSubjectIds } },
  });
  markSubmitted = result.length;
}

  // Get classes taken from TeacherClassLog
  let classesTaken = 0;
  const classLogs = await prisma.teacherClassLog.findMany({
    where: {
      teacherId,
      month: monthFilter,
    },
    select: { classes: true, notebook: true, other: true },
  });
  
  classesTaken = classLogs.reduce((sum, log) => sum + log.classes + log.notebook + log.other, 0);

  // Get total paid from TeacherPayment
  let totalPaid = 0;
  const payments = await prisma.teacherPayment.aggregate({
    where: { teacherId },
    _sum: { amount: true },
  });
  totalPaid = payments._sum.amount || 0;

  // Current due = (classesTaken * perClass) - totalPaid
  const calculatedDue = (classesTaken * teacher.perClass) - totalPaid;
  const currentDue = Math.max(0, calculatedDue);

  return {
    totalExamAssigned: examAssigned,
    markSubmitted,
    classesTaken,
    totalPaid,
    currentDue,
  };
}

export async function getTeacherPaymentHistoryAction(
  teacherId: number,
  month?: string
) {
  const session = await requireRole(["ADMIN", "STAFF", "TEACHER"]);
  if (session.role === "TEACHER") {
    const teacher = await prisma.teacher.findFirst({
      where: { userId: parseInt(session.id, 10) },
    });
    if (!teacher || teacher.id !== teacherId) {
      throw new Error("Unauthorized");
    }
  }

  const whereClause: any = { teacherId };
  
  if (month && month !== "All") {
    whereClause.month = month;
  }

  return await prisma.teacherPayment.findMany({
    where: whereClause,
    orderBy: { date: "desc" },
  });
}

export async function getTeacherPaymentsAction(teacherId: number, month?: string) {
  return getTeacherPaymentHistoryAction(teacherId, month);
}

export type TeacherClassLogInput = {
  date: string;
  classes: number;
  notebook: number;
  other: number;
  month: string;
};

export async function createTeacherClassLogAction(data: TeacherClassLogInput) {
  const session = await requireRole("TEACHER");
  
  const teacher = await prisma.teacher.findFirst({
    where: { userId: parseInt(session.id, 10) },
  });
  
  if (!teacher) {
    throw new Error("Teacher profile not found");
  }
  const teacherId = teacher.id;

  return await prisma.teacherClassLog.create({
    data: {
      teacherId,
      date: new Date(data.date),
      classes: data.classes,
      notebook: data.notebook,
      other: data.other,
      month: data.month,
      perClass: 0, // Will be updated from teacher.perClass
    },
  });
}

export async function updateTeacherClassLogAction(id: number, data: TeacherClassLogInput) {
  const session = await requireRole("TEACHER");
  const teacher = await prisma.teacher.findFirst({
    where: { userId: parseInt(session.id, 10) },
  });
  if (!teacher) throw new Error("Teacher profile not found");

  const log = await prisma.teacherClassLog.findUnique({ where: { id } });
  if (!log || log.teacherId !== teacher.id) throw new Error("Unauthorized");

  return await prisma.teacherClassLog.update({
    where: { id },
    data: {
      date: new Date(data.date),
      classes: data.classes,
      notebook: data.notebook,
      other: data.other,
      month: data.month,
    },
  });
}

export async function deleteTeacherClassLogAction(id: number) {
  const session = await requireRole("TEACHER");
  const teacher = await prisma.teacher.findFirst({
    where: { userId: parseInt(session.id, 10) },
  });
  if (!teacher) throw new Error("Teacher profile not found");

  const log = await prisma.teacherClassLog.findUnique({ where: { id } });
  if (!log || log.teacherId !== teacher.id) throw new Error("Unauthorized");

  return await prisma.teacherClassLog.delete({
    where: { id },
  });
}

export async function getTeacherClassLogsAction(
  teacherId: number, 
  month?: string,
  page: number = 1,
  limit: number = 10
) {
  const session = await requireRole(["ADMIN", "STAFF", "TEACHER"]);
  if (session.role === "TEACHER") {
    const teacher = await prisma.teacher.findFirst({
      where: { userId: parseInt(session.id, 10) },
    });
    if (!teacher || teacher.id !== teacherId) {
      throw new Error("Unauthorized");
    }
  }
  const whereClause: any = { teacherId };
  
  if (month && month !== "All") {
    whereClause.month = month;
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.teacherClassLog.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
      skip,
      take: limit,
    }),
    prisma.teacherClassLog.count({ where: whereClause }),
  ]);

  return {
    logs,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  };
}

export async function getTeacherWithPerClassAction(teacherId: number) {
  await requireRole("ADMIN");
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { id: true, name: true, perClass: true },
  });
  return teacher;
}

// Admin functions for all teachers class logs
export async function getAllClassLogsAction(
  month?: string,
  teacherId?: number,
  startDate?: string,  // YYYY-MM-DD
  endDate?: string,    // YYYY-MM-DD
  page: number = 1,
  limit: number = 20
) {
  await requireRole(["ADMIN", "STAFF"]);
  const whereClause: any = {};
  
  if (month && month !== "All") {
    whereClause.month = month;
  }
  if (teacherId) {
    whereClause.teacherId = teacherId;
  }
  if (startDate) {
    whereClause.date = { ...whereClause.date, gte: new Date(startDate) };
  }
  if (endDate) {
    whereClause.date = { ...whereClause.date, lte: new Date(endDate) };
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.teacherClassLog.findMany({
      where: whereClause,
      include: {
        teacher: { select: { id: true, name: true, mobile: true, perClass: true } },
      },
      orderBy: { date: "desc" },
      skip,
      take: limit,
    }),
    prisma.teacherClassLog.count({ where: whereClause }),
  ]);

  return {
    logs,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  };
}


export async function getClassLogStatsAction(month?: string) {
  const session = await requireRole(["ADMIN", "STAFF"]);
  const canSeeFinance = session.role === "ADMIN";
  const whereClause: any = {};
  
  if (month) {
    whereClause.month = month;
  }

  const [logs, teachers] = await Promise.all([
    prisma.teacherClassLog.findMany({
      where: whereClause,
      include: {
        teacher: { select: { id: true, name: true, perClass: true } },
      },
    }),
    canSeeFinance
      ? prisma.teacher.findMany({
          include: {
            payments: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const totalClasses = logs.reduce((sum, log) => sum + log.classes + log.notebook + log.other, 0);
  
  const teacherStats = teachers.map((t) => {
    const teacherLogs = logs.filter((l) => l.teacherId === t.id);
    const teacherClasses = teacherLogs.reduce((sum, log) => sum + log.classes + log.notebook + log.other, 0);
    const totalPaid = t.payments.reduce((sum, p) => sum + p.amount, 0);
    const calculatedDue = (teacherClasses * t.perClass) - totalPaid;
    
    return {
      id: t.id,
      name: t.name,
      totalClasses: teacherClasses,
      totalPaid,
      due: Math.max(0, calculatedDue),
    };
  });

  const totalPaid = teacherStats.reduce((sum, t) => sum + t.totalPaid, 0);
  const totalDue = teacherStats.reduce((sum, t) => sum + t.due, 0);

  return {
    totalClasses,
    totalPaid: canSeeFinance ? totalPaid : 0,
    totalDue: canSeeFinance ? totalDue : 0,
    teacherCount: canSeeFinance ? teachers.length : 0,
    logsCount: logs.length,
  };
}

export async function getAllTeachersWithStatsAction(
  month?: string,
  startDate?: string,
  endDate?: string,
  hideFinancials: boolean = false  // For staff role
) {
  const session = await requireRole(["ADMIN", "STAFF"]);
  const shouldHideFinancials = session.role === "STAFF" || hideFinancials;
  const whereClause: any = {};
  
  if (month && month !== "All") {
    whereClause.month = month;
  }
  if (startDate) {
    whereClause.date = { ...whereClause.date, gte: new Date(startDate) };
  }
  if (endDate) {
    whereClause.date = { ...whereClause.date, lte: new Date(endDate) };
  }

  const teachers = await prisma.teacher.findMany({
    include: {
      classLogs: {
        where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      },
      payments: !shouldHideFinancials,
    },
  });

  return teachers.map((t) => {
    const totalClasses = t.classLogs.reduce((sum, log) => sum + log.classes + log.notebook + log.other, 0);
    
    // Staff cannot see financial data
    if (shouldHideFinancials) {
      return {
        id: t.id,
        name: t.name,
        mobile: t.mobile,
        perClass: 0,  // Hide rate
        totalClasses,
        totalPaid: 0,
        due: 0,
      };
    }
    
    const totalPaid = t.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const calculatedDue = (totalClasses * t.perClass) - totalPaid;
    
    return {
      id: t.id,
      name: t.name,
      mobile: t.mobile,
      perClass: t.perClass,
      totalClasses,
      totalPaid,
      due: Math.max(0, calculatedDue),
    };
  });
}


export async function updateClassLogAction(
  id: number,
  data: {
    date: string;
    classes: number;
    notebook: number;
    other: number;
    month: string;
  }
) {
  await requireRole(["ADMIN", "STAFF"]);

  const updated = await prisma.teacherClassLog.update({
    where: { id },
    data: {
      date: new Date(data.date),
      classes: data.classes,
      notebook: data.notebook,
      other: data.other,
      month: data.month,
    },
  });

  revalidatePath("/admin-route/class-log");
  return updated;
}

// ✅ NEW: Delete log (admin only - staff cannot delete)
export async function deleteClassLogAction(id: number) {
  await requireRole("ADMIN");

  await prisma.teacherClassLog.delete({ where: { id } });
  revalidatePath("/admin-route/class-log");
  return { success: true };
}