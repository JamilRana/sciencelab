// app/actions/receipts.ts
"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/auth-guard";

const receiptSchema = z.object({
  studentId: z.number().min(1),
  month: z.enum(["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]),
  year: z.number().optional(),
  amount: z.number().min(0).max(10000),
  date: z.string().or(z.date()).optional(),
});

async function validateAction() {
  try {
    const session = await requireRole("ADMIN");
    return { success: true, user: session } as const;
  } catch (err: any) {
    return { success: false, error: err.message || "Unauthorized" } as const;
  }
}

export async function getReceiptsAction(filters?: {
  class?: string;
  batchId?: number;
  studentId?: number;
  month?: string;
  year?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    await requireRole("ADMIN");
    const where: Prisma.ReceiptWhereInput = {};
    
    if (filters?.studentId) {
      where.studentId = filters.studentId;
    }
    if (filters?.month) {
      where.month = filters.month;
    }
    if (filters?.year) {
      where.year = filters.year;
    }
    
    // Date range filter
    if (filters?.startDate || filters?.endDate) {
      const start = filters.startDate ? new Date(filters.startDate) : new Date(0);
      const end = filters.endDate ? new Date(filters.endDate) : new Date();
      end.setHours(23, 59, 59, 999);
      where.date = {
        gte: start,
        lte: end,
      };
    }
    
    if (filters?.search) {
      const searchNum = parseInt(filters.search);
      where.student = {
        OR: [
          { name: { contains: filters.search, mode: "insensitive" } },
          { mobile: { contains: filters.search } },
          ...(isNaN(searchNum) ? [] : [{ roll: { equals: searchNum } }]),
        ],
      };
    }
    
    if (filters?.class || filters?.batchId) {
      where.student = {
        ...where.student as object,
        ...(filters.class && { class: filters.class }),
        ...(filters.batchId && { batchId: filters.batchId }),
      };
    }

    const receipts = await prisma.receipt.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            roll: true,
            class: true,
            batch: { select: { id: true, name: true, code: true } },
            mobile: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return { success: true, data: receipts };
  } catch (error) {
    console.error("Get receipts error:", error);
    return { success: false, error: "Failed to fetch receipts" };
  }
}

export async function createReceiptAction(input: unknown) {
  const auth = await validateAction();
  if (!auth.success) return auth;

  const parsed = receiptSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input", details: parsed.error.flatten() };
  }

  const { studentId, month, year, amount, date } = parsed.data;
  const receiptDate = date ? new Date(date) : new Date();
  const receiptYear = year || receiptDate.getFullYear();

  try {
    const existing = await prisma.receipt.findFirst({
      where: { studentId, month, year: receiptYear },
    });
    if (existing) {
      return { success: false, error: "Receipt already exists for this student, month, and year" };
    }

    const receipt = await prisma.receipt.create({
      data: {
        studentId,
        month,
        year: receiptYear,
        amount,
        date: receiptDate,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            roll: true,
            class: true,
            batch: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    revalidatePath("/admin-route/receipts");
    revalidatePath("/admin-route/fees");
    return { success: true, data: receipt, message: "Receipt created" };
  } catch (error) {
    console.error("Create receipt error:", error);
    return { success: false, error: "Database error" };
  }
}

export async function updateReceiptAction(id: number, input: unknown) {
  const auth = await validateAction();
  if (!auth.success) return auth;

  const parsed = receiptSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const { studentId, month, amount, date } = parsed.data;

  try {
    const receipt = await prisma.receipt.update({
      where: { id },
      data: {
        studentId,
        month,
        amount,
        date: date ? new Date(date) : undefined,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            roll: true,
            class: true,
            batch: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    revalidatePath("/admin-route/receipts");
    revalidatePath("/admin-route/fees");
    return { success: true, data: receipt, message: "Receipt updated" };
  } catch (error) {
    console.error("Update receipt error:", error);
    return { success: false, error: "Failed to update receipt" };
  }
}

export async function deleteReceiptAction(id: number) {
  const auth = await validateAction();
  if (!auth.success) return auth;

  try {
    await prisma.receipt.delete({ where: { id } });
    revalidatePath("/admin-route/receipts");
    revalidatePath("/admin-route/fees");
    return { success: true, message: "Receipt deleted" };
  } catch (error) {
    console.error("Delete receipt error:", error);
    return { success: false, error: "Failed to delete receipt" };
  }
}

export async function getBatchesByClassAction(className: string) {
  try {
    await requireRole(["ADMIN", "STAFF", "TEACHER"]);
    const batches = await prisma.batch.findMany({
      where: { classId: className },
      select: { id: true, classId: true, name: true, code: true },
      orderBy: { code: "asc" },
    });
    return { success: true, data: batches };
  } catch (error) {
    return { success: false, error: "Failed to fetch batches" };
  }
}
