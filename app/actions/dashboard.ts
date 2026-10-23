//app/actions/dashboard.ts
"use server";

import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth-guard";

/* ----------------------------------------
   MAIN DASHBOARD STATS
---------------------------------------- */

export async function getDashboardStats(_role?: Role) {
  const session = await requireRole(["ADMIN", "STAFF"]);
  const canViewFinancial = session.role === "ADMIN";

  const [
    studentCount,
    activeStudents,
    specialStudentCount,
    teacherCount,
    examCount,
    batchCount,
  ] = await Promise.all([
    prisma.student.count({ where: { batch: { programId: null } } }),
    prisma.student.count({ where: { active: true, batch: { programId: null } } }),
    prisma.student.count({ where: { active: true, batch: { programId: { not: null } } } }),
    prisma.teacher.count(),
    prisma.exam.count(),
    prisma.batch.count({ where: { programId: null } }),
  ]);

  const baseStats = {
    studentCount,
    activeStudents,
    specialStudentCount,
    inactiveStudents: studentCount - activeStudents,
    teacherCount,
    examCount,
    batchCount,
    recentActivity: await getRecentActivity(6),
  };

  if (!canViewFinancial) return baseStats;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [monthReceiptStats, monthExpenseStats, allReceiptStats] = await Promise.all([
    prisma.receipt.aggregate({
      where: { date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.expense.aggregate({
      where: { date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.receipt.aggregate({
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  return {
    ...baseStats,
    totalRevenue: monthReceiptStats._sum.amount ?? 0,
    allTimeRevenue: allReceiptStats._sum.amount ?? 0,
    totalExpenses: monthExpenseStats._sum.amount ?? 0,
    receiptCount: monthReceiptStats._count,
    expenseCount: monthExpenseStats._count,
    netBalance:
      (monthReceiptStats._sum.amount ?? 0) -
      (monthExpenseStats._sum.amount ?? 0),
  };
}

/* ----------------------------------------
   STUDENT ANALYTICS
---------------------------------------- */

export async function getStudentAnalytics() {
  await requireRole(["ADMIN", "STAFF", "TEACHER"]);
  const [genderStats, classStats, schoolStats] =
    await Promise.all([
      prisma.student.groupBy({
        by: ["gender"],
        _count: { id: true },
      }),

      prisma.student.groupBy({
        by: ["class"],
        _count: { id: true },
        orderBy: { class: "asc" },
      }),

      prisma.student.groupBy({
        by: ["schoolId"],
        _count: { id: true },
      }),
    ]);

  const schools = await prisma.school.findMany({
    select: { id: true, name: true },
  });

  const schoolMap = new Map(
    schools.map((s) => [s.id, s.name])
  );

  return {
    byGender: genderStats.map((g) => ({
      label: g.gender,
      value: g._count.id,
    })),

    byClass: classStats.map((c) => ({
      label: c.class,
      value: c._count.id,
    })),

    bySchool: schoolStats.map((s) => ({
      label: schoolMap.get(s.schoolId) || "Unknown",
      value: s._count.id,
      schoolId: s.schoolId,
    })),
  };
}

/* ----------------------------------------
   EXAM ANALYTICS
---------------------------------------- */

export async function getExamAnalytics() {
  await requireRole(["ADMIN", "STAFF", "TEACHER"]);
  const exams = await prisma.exam.findMany({
    include: {
      subjects: {
        include: {
          marks: true,
          teacher: { select: { name: true } },
        },
      },
    },
    orderBy: { id: "desc" },
    take: 8,
  });

  return exams.map((exam) => {

    const marks = exam.subjects.flatMap((s) => s.marks);

    const total =
      marks.reduce(
        (sum, m) => sum + m.written + m.objective,
        0
      ) || 0;

    const avg =
      marks.length > 0
        ? total / marks.length
        : 0;

    return {
      examId: exam.id,
      type: exam.type,
      class: exam.class,
      month: exam.month,
      subjects: exam.subjects.length,
      students: new Set(marks.map((m) => m.studentId)).size,
      averageScore: avg.toFixed(2),
    };
  });
}

/* ----------------------------------------
   TEACHER ANALYTICS
---------------------------------------- */

export async function getTeacherAnalytics() {
  await requireRole(["ADMIN", "STAFF"]);
  const teachers = await prisma.teacher.findMany({
    include: {
      classLogs: true,
      payments: true,
      examSubjects: true,
    },
  });

  return teachers.map((t) => {

    const classesTaken = t.classLogs.reduce(
      (sum, log) => sum + log.classes,
      0
    );

    const totalPaid = t.payments.reduce(
      (sum, p) => sum + p.amount,
      0
    );

    return {
      id: t.id,
      name: t.name,
      mobile: t.mobile,
      subjectsAssigned: t.examSubjects.length,
      classesTaken,
      totalPaid,
      due: t.due,
    };
  });
}

/* ----------------------------------------
   FINANCIAL ANALYTICS
---------------------------------------- */

export async function getFinancialAnalytics(_role?: Role) {
  await requireRole("ADMIN");

  const [receipts, expenses] = await Promise.all([
    prisma.receipt.findMany({
      select: {
        month: true,
        amount: true,
      },
    }),

    prisma.expense.findMany({
      select: {
        date: true,
        amount: true,
      },
    }),
  ]);

  const revenueByMonth: Record<string, number> = {};
  const expenseByMonth: Record<string, number> = {};

  receipts.forEach((r) => {
    revenueByMonth[r.month] =
      (revenueByMonth[r.month] || 0) + r.amount;
  });

  expenses.forEach((e) => {
    const month = e.date.toISOString().slice(0, 7);

    expenseByMonth[month] =
      (expenseByMonth[month] || 0) + e.amount;
  });

  return {
    revenueTrend: Object.entries(revenueByMonth).map(
      ([month, amount]) => ({
        month,
        amount,
      })
    ),

    expenseTrend: Object.entries(expenseByMonth).map(
      ([month, amount]) => ({
        month,
        amount,
      })
    ),
  };
}

/* ----------------------------------------
   RECENT ACTIVITY
---------------------------------------- */

async function getRecentActivity(limit: number) {

  const [
    students,
    exams,
    receipts,
  ] = await Promise.all([

    prisma.student.findMany({
      take: limit,
      orderBy: { id: "desc" },
      include: { batch: true },
    }),

    prisma.exam.findMany({
      take: limit,
      orderBy: { id: "desc" },
    }),

    prisma.receipt.findMany({
      take: limit,
      orderBy: { date: "desc" },
      include: { student: true },
    }),
  ]);

  const activity = [

    ...students.map((s) => ({
      type: "student",
      label: `🎓 ${s.name} joined ${s.batch.name}`,
      time: s.id,
    })),

    ...exams.map((e) => ({
      type: "exam",
      label: `📝 ${e.type} exam for class ${e.class}`,
      time: e.id,
    })),

    ...receipts.map((r) => ({
      type: "payment",
      label: `💰 ${r.student.name} paid ৳${r.amount}`,
      time: r.date.getTime(),
    })),
  ];

  return activity
    .sort((a, b) => b.time - a.time)
    .slice(0, limit);
}