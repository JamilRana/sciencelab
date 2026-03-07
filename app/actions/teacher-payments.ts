"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getTeacherPaymentsAction() {
  return await prisma.teacherPayment.findMany({
    include: { teacher: true },
    orderBy: { date: "desc" },
  });
}

export async function getTeachersForPaymentAction() {
  return await prisma.teacher.findMany({ orderBy: { name: "asc" } });
}

export async function createTeacherPaymentAction(data: {
  teacherId: string;
  month: string;
  amount: string;
  note?: string;
}) {
  try {
    const payment = await prisma.teacherPayment.create({
      data: {
        teacherId: parseInt(data.teacherId),
        month: data.month,
        amount: parseInt(data.amount),
        note: data.note || "",
      },
    });
    revalidatePath("/admin-route/payments");
    return { success: true, data: payment };
  } catch (error) {
    console.error("Error creating payment:", error);
    return { success: false, error: "Failed to create payment" };
  }
}

export async function deleteTeacherPaymentAction(id: number) {
  try {
    await prisma.teacherPayment.delete({
      where: { id },
    });
    revalidatePath("/admin-route/payments");
    return { success: true };
  } catch (error) {
    console.error("Error deleting payment:", error);
    return { success: false, error: "Failed to delete payment" };
  }
}
