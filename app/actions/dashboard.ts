//app/actions/dashboard.ts
"use server";

import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

/* ----------------------------------------
   MAIN DASHBOARD STATS
---------------------------------------- */

export async function getDashboardStats(role: Role) {

  const canViewFinancial = role === "ADMIN";

  const [
    studentCount,
    activeStudents,
    teacherCount,
    examCount,
    batchCount,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.student.count({ where: { active: true } }),
    prisma.teacher.count(),
    prisma.exam.count(),
    prisma.batch.count(),
  ]);

  const baseStats = {
    studentCount,
    activeStudents,
    inactiveStudents: studentCount - activeStudents,
    teacherCount,
    examCount,
    batchCount,
    recentActivity: await getRecentActivity(6),
  };

  if (!canViewFinancial) return baseStats;

  const [receiptStats, expenseStats] = await Promise.all([
    prisma.receipt.aggregate({
      _sum: { amount: true },
      _count: true,
    }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  return {
    ...baseStats,
    totalRevenue: receiptStats._sum.amount ?? 0,
    totalExpenses: expenseStats._sum.amount ?? 0,
    receiptCount: receiptStats._count,
    expenseCount: expenseStats._count,
    netBalance:
      (receiptStats._sum.amount ?? 0) -
      (expenseStats._sum.amount ?? 0),
  };
}

/* ----------------------------------------
   STUDENT ANALYTICS
---------------------------------------- */

export async function getStudentAnalytics() {

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

export async function getFinancialAnalytics(role: Role) {

  if (role !== "ADMIN")
    throw new Error("Unauthorized");

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