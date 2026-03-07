"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveFee(studentId: number, month: string, amount: number) {
  try {
    // Check if a receipt already exists for this student and month
    const existingReceipt = await prisma.receipt.findFirst({
      where: {
        studentId,
        month,
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
      // Create new receipt
      await prisma.receipt.create({
        data: {
          studentId,
          month,
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
