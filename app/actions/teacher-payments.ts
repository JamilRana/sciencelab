"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { normalizeMonth } from "@/lib/month";
import { requireRole } from "@/lib/auth-guard";

export async function getTeacherPaymentsAction() {
  await requireRole("ADMIN");
  return await prisma.teacherPayment.findMany({
    include: { teacher: true },
    orderBy: { date: "desc" },
  });
}

export async function getTeachersForPaymentAction() {
  await requireRole("ADMIN");
  return await prisma.teacher.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          classLogs: true,
          payments: true,
        },
      },
    },
  });
}

export async function getTeacherMonthStatsAction(teacherId: number, month: string) {
  try {
    const session = await requireRole(["ADMIN", "TEACHER"]);
    if (session.role === "TEACHER") {
      const teacher = await prisma.teacher.findFirst({
        where: { userId: parseInt(session.id, 10) },
      });
      if (!teacher || teacher.id !== teacherId) {
        return { success: false, error: "Unauthorized" };
      }
    }
    const normMonth = normalizeMonth(month);

    const [teacher, monthLogs, monthPayments, allLogs, allPayments] = await Promise.all([
      prisma.teacher.findUnique({
        where: { id: teacherId },
        select: { id: true, name: true, mobile: true, perClass: true, due: true },
      }),
      prisma.teacherClassLog.findMany({
        where: {
          teacherId,
          ...(normMonth ? { month: normMonth } : {}),
        },
      }),
      prisma.teacherPayment.findMany({
        where: {
          teacherId,
          ...(normMonth ? { month: normMonth } : {}),
        },
      }),
      prisma.teacherClassLog.findMany({
        where: { teacherId },
      }),
      prisma.teacherPayment.findMany({
        where: { teacherId },
      }),
    ]);

    if (!teacher) {
      return { success: false, error: "Teacher not found" };
    }

    // Month calculations
    const monthClasses = monthLogs.reduce(
      (sum, log) => sum + (log.classes || 0) + (log.notebook || 0) + (log.other || 0),
      0
    );
    const monthEarned = monthClasses * (teacher.perClass || 0);
    const monthPaid = monthPayments.reduce((sum, p) => sum + p.amount, 0);
    const monthDue = Math.max(0, monthEarned - monthPaid);

    // Lifetime calculations
    const lifetimeClasses = allLogs.reduce(
      (sum, log) => sum + (log.classes || 0) + (log.notebook || 0) + (log.other || 0),
      0
    );
    const lifetimeEarned = lifetimeClasses * (teacher.perClass || 0);
    const lifetimePaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
    const lifetimeDue = Math.max(0, lifetimeEarned - lifetimePaid);

    return {
      success: true,
      data: {
        teacher,
        month: normMonth,
        monthClasses,
        monthEarned,
        monthPaid,
        monthDue,
        lifetimeClasses,
        lifetimeEarned,
        lifetimePaid,
        lifetimeDue,
      },
    };
  } catch (error) {
    console.error("Error getting teacher month stats:", error);
    return { success: false, error: "Failed to load teacher stats" };
  }
}

export async function createTeacherPaymentAction(data: {
  teacherId: string;
  month: string;
  amount: string;
  note?: string;
  date?: string;
}) {
  try {
    await requireRole("ADMIN");
    const teacherIdNum = parseInt(data.teacherId);
    const amountNum = parseInt(data.amount);
    const normMonth = normalizeMonth(data.month);
    const paymentDate = data.date ? new Date(data.date) : new Date();

    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherIdNum },
    });

    if (!teacher) {
      return { success: false, error: "Teacher not found" };
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create TeacherPayment record
      const payment = await tx.teacherPayment.create({
        data: {
          teacherId: teacherIdNum,
          month: normMonth,
          amount: amountNum,
          note: data.note || "",
          date: paymentDate,
        },
      });

      // 2. Synchronize with Institutional Expense with explicit payment voucher reference
      await tx.expense.create({
        data: {
          description: `Teacher Payment [Ref #${payment.id}] - ${teacher.name} (${normMonth})`,
          amount: amountNum,
          date: paymentDate,
        },
      });

      return payment;
    });

    revalidatePath("/admin-route/payments");
    revalidatePath("/admin-route/expenses");
    revalidatePath("/admin-route/accounts");
    revalidatePath("/admin-route/dashboard");
    revalidatePath("/teacher-route/payments");

    return { success: true, data: result };
  } catch (error) {
    console.error("Error creating payment:", error);
    return { success: false, error: "Failed to create payment" };
  }
}

export async function deleteTeacherPaymentAction(id: number) {
  try {
    await requireRole("ADMIN");
    const payment = await prisma.teacherPayment.findUnique({
      where: { id },
      include: { teacher: true },
    });

    if (!payment) {
      return { success: false, error: "Payment not found" };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete associated expense (by reference tag or exact description match)
      await tx.expense.deleteMany({
        where: {
          OR: [
            { description: { contains: `[Ref #${id}]` } },
            {
              description: `Teacher Payment - ${payment.teacher?.name || "Unknown"} (${payment.month})`,
              amount: payment.amount,
            },
          ],
        },
      });

      // 2. Delete teacher payment record
      await tx.teacherPayment.delete({
        where: { id },
      });
    });

    revalidatePath("/admin-route/payments");
    revalidatePath("/admin-route/expenses");
    revalidatePath("/admin-route/accounts");
    revalidatePath("/admin-route/dashboard");
    revalidatePath("/teacher-route/payments");

    return { success: true };
  } catch (error) {
    console.error("Error deleting payment:", error);
    return { success: false, error: "Failed to delete payment" };
  }
}
