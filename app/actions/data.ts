"use server";

import { prisma } from "@/lib/prisma";

export async function getStudentsAction() {
  return await prisma.student.findMany({
    include: { school: true, batch: true },
    orderBy: { id: "desc" },
  });
}

export async function getSchoolsAction() {
  return await prisma.school.findMany({ orderBy: { name: "asc" } });
}

export async function getBatchesAction() {
  return await prisma.batch.findMany({
    include: { _count: { select: { students: true } } },
    orderBy: { classId: "asc" },
  });
}

export async function getBatchesByClassAction(classId: string) {
  return await prisma.batch.findMany({
    where: { classId },
    select: { id: true, name: true, code: true },
    orderBy: { code: "asc" },
  });
}

export async function getExamsAction() {
  return await prisma.exam.findMany({
    include: { subjects: { include: { teacher: true, marks: true } } },
    orderBy: { id: "desc" },
  });
}

export async function getTeachersAction() {
  return await prisma.teacher.findMany({ orderBy: { name: "asc" } });
}

export async function getReceiptsAction() {
  return await prisma.receipt.findMany({
    include: { student: true },
    orderBy: { date: "desc" },
  });
}

export async function getExpensesAction() {
  return await prisma.expense.findMany({ orderBy: { date: "desc" } });
}

export async function getMarksAction() {
  return await prisma.mark.findMany({
    include: { student: true, examSubject: { include: { exam: true, teacher: true, marks: true } } },
  });
}

export async function getDashboardStats() {
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
    prisma.receipt.count(),
    prisma.receipt.aggregate({
      _sum: { amount: true },
      where: { date: { gte: startOfMonth, lte: endOfMonth } },
    }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { date: { gte: startOfMonth, lte: endOfMonth } },
    }),
    prisma.receipt.aggregate({
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      _sum: { amount: true },
    }),
  ]);

  return { 
    studentCount, 
    teacherCount, 
    examCount, 
    receiptCount,
    monthlyIncome: monthlyIncome._sum?.amount || 0,
    monthlyExpense: monthlyExpense._sum?.amount || 0,
    totalIncome: totalIncome._sum?.amount || 0,
    totalExpense: totalExpense._sum?.amount || 0,
  };
}
