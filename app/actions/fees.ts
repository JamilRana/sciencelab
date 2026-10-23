"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

export async function saveFee(
  studentId: number,
  month: string,
  amount: number,
  year: number = new Date().getFullYear()
) {
  try {
    await requireRole("ADMIN");
    // Check if a receipt already exists for this student, month, and year
    const existingReceipt = await prisma.receipt.findFirst({
      where: {
        studentId,
        month,
        year,
      },
    });

    if (existingReceipt) {
      if (amount <= 0) {
        // If amount is 0 or less, delete the receipt (unmark as paid)
        await prisma.receipt.delete({
          where: { id: existingReceipt.id },
        });
      } else {
        // Update existing receipt
        await prisma.receipt.update({
          where: { id: existingReceipt.id },
          data: { amount },
        });
      }
    } else if (amount > 0) {
      // Create new receipt with academic year
      await prisma.receipt.create({
        data: {
          studentId,
          month,
          year,
          amount,
        },
      });
    }

    revalidatePath("/admin-route/fees");
    return { success: true };
  } catch (error) {
    console.error("Error saving fee:", error);
    return { success: false, error: "Failed to save fee" };
  }
}
