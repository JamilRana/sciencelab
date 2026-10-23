"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";

export async function getStudentsAction() {
  await requireRole(["ADMIN", "STAFF"]);
  return await prisma.student.findMany({
    where: { isArchived: false },
    include: { school: true, batch: true },
    orderBy: { id: "desc" },
  });
}

export async function getSchoolsAction() {
  await requireRole(["ADMIN", "STAFF", "TEACHER"]);
  return await prisma.school.findMany({
    include: {
      _count: {
        select: { students: true },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getBatchesAction() {
  await requireRole(["ADMIN", "STAFF", "TEACHER"]);
  return await prisma.batch.findMany({
    include: { _count: { select: { students: true } } },
    orderBy: { classId: "asc" },
  });
}

export async function getBatchesByClassAction(classId: string) {
  await requireRole(["ADMIN", "STAFF", "TEACHER"]);
  return await prisma.batch.findMany({
    where: { classId },
    select: { id: true, name: true, code: true },
    orderBy: { code: "asc" },
  });
}

export async function getExamsAction() {
  await requireRole(["ADMIN", "STAFF", "TEACHER"]);
  return await prisma.exam.findMany({
    include: { subjects: { include: { teacher: true, marks: true } } },
    orderBy: { id: "desc" },
  });
}

export async function getTeachersAction() {
  await requireRole(["ADMIN", "STAFF", "TEACHER"]);
  return await prisma.teacher.findMany({ orderBy: { name: "asc" } });
}

export async function getReceiptsAction() {
  await requireRole("ADMIN");
  return await prisma.receipt.findMany({
    include: { student: true },
    orderBy: { date: "desc" },
  });
}

export async function getExpensesAction() {
  await requireRole("ADMIN");
  return await prisma.expense.findMany({ orderBy: { date: "desc" } });
}

export async function getMarksAction() {
  await requireRole(["ADMIN", "STAFF", "TEACHER"]);
  return await prisma.mark.findMany({
    include: { student: true, examSubject: { include: { exam: true, teacher: true, marks: true } } },
  });
}

export async function getDashboardStats() {
  const session = await requireRole(["ADMIN", "STAFF"]);
  const canSeeFinance = session.role === "ADMIN";
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const [
    studentCount,
    teacherCount,
    examCount,
    receiptCount,
    monthlyIncome,
    monthlyExpense,
    totalIncome,
    totalExpense,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.exam.count(),
    canSeeFinance ? prisma.receipt.count() : Promise.resolve(0),
    canSeeFinance
      ? prisma.receipt.aggregate({
          _sum: { amount: true },
          where: { date: { gte: startOfMonth, lte: endOfMonth } },
        })
      : Promise.resolve({ _sum: { amount: 0 } }),
    canSeeFinance
      ? prisma.expense.aggregate({
          _sum: { amount: true },
          where: { date: { gte: startOfMonth, lte: endOfMonth } },
        })
      : Promise.resolve({ _sum: { amount: 0 } }),
    canSeeFinance
      ? prisma.receipt.aggregate({
          _sum: { amount: true },
        })
      : Promise.resolve({ _sum: { amount: 0 } }),
    canSeeFinance
      ? prisma.expense.aggregate({
          _sum: { amount: true },
        })
      : Promise.resolve({ _sum: { amount: 0 } }),
  ]);

  return { 
    studentCount, 
    teacherCount, 
    examCount, 
    receiptCount: canSeeFinance ? receiptCount : 0,
    monthlyIncome: monthlyIncome._sum?.amount || 0,
    monthlyExpense: monthlyExpense._sum?.amount || 0,
    totalIncome: totalIncome._sum?.amount || 0,
    totalExpense: totalExpense._sum?.amount || 0,
  };
}
