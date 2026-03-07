// app/actions/marks.ts
"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Mark, ServiceResult } from "@/types";
import { Prisma } from "@prisma/client";

const markSchema = z.object({
  examSubjectId: z.number().min(1),
  studentId: z.number().min(1),
  written: z.number().min(0).max(100).optional(),
  objective: z.number().min(0).max(100).optional(),
});

async function validateAction() {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "STAFF", "TEACHER"].includes(session.user.role)) {
    return { success: false, error: "Unauthorized" } as const;
  }
  return { success: true } as const;
}

export async function getExamsByClassAction(className?: string) {
  try {
    const where: Prisma.ExamWhereInput = {};
    if (className) where.class = className;

    const exams = await prisma.exam.findMany({
      where,
      include: {
        subjects: {
          include: {
            teacher: { select: { id: true, name: true } },
            _count: { select: { marks: true } },
          },
          orderBy: { subject: "asc" },
        },
      },
      orderBy: [{ class: "asc" }, { month: "asc" }],
    });

    return { success: true, exams };
  } catch (error) {
    console.error("Get exams error:", error);
    return { success: false, error: "Failed to fetch exams" };
  }
}

export async function getStudentsByBatchAction(batchId: number) {
  try {
    const students = await prisma.student.findMany({
      where: { active: true, batchId },
      select: {
        id: true,
        name: true,
        roll: true,
        class: true,
        batch: { select: { id: true, name: true, code: true } },
      },
      orderBy: { roll: "asc" },
    });
    return { success: true, students };
  } catch (error) {
    return { success: false, error: "Failed to fetch students" };
  }
}

export async function getMarksForSubjectAction(examSubjectId: number, batchId: number) {
  try {
    const marks = await prisma.mark.findMany({
      where: {
        examSubjectId,
        student: { batchId },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            roll: true,
            batch: { select: { code: true } },
          },
        },
      },
    });
    return { success: true, marks };
  } catch (error) {
    return { success: false, error: "Failed to fetch marks" };
  }
}

export async function saveMarkAction(input: unknown) {
  const auth = await validateAction();
  if (!auth.success) return auth;

  const parsed = markSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input", details: parsed.error.flatten() };
  }

  const { examSubjectId, studentId, written = 0, objective = 0 } = parsed.data;

  try {
    const subject = await prisma.examSubject.findUnique({
      where: { id: examSubjectId },
      include: { exam: true },
    });

    if (!subject || subject.status !== 1) {
      return { success: false, error: "Exam subject not available" };
    }

    const mark = await prisma.mark.upsert({
      where: {
        examSubjectId_studentId: { examSubjectId, studentId },
      },
      update: { written, objective },
      create: { examSubjectId, studentId, written, objective },
      include: {
        student: { select: { id: true, name: true, roll: true, batch: { select: { code: true } } } },
      },
    });

    revalidatePath("/admin-route/marks");
    return { success: true, mark, message: "Mark saved" };
  } catch (error) {
    console.error("Save mark error:", error);
    return { success: false, error: "Database error" };
  }
}

export async function bulkSaveMarksAction(entries: Array<{
  examSubjectId: number;
  studentId: number;
  written?: number;
  objective?: number;
}>) {
  const auth = await validateAction();
  if (!auth.success) return auth;

  try {
    const results: Mark[] = [];
    for (const entry of entries) {
      const parsed = markSchema.safeParse(entry);
      if (!parsed.success) continue;

      const { examSubjectId, studentId, written = 0, objective = 0 } = parsed.data;
      
      const mark = await prisma.mark.upsert({
        where: { examSubjectId_studentId: { examSubjectId, studentId } },
        update: { written, objective },
        create: { examSubjectId, studentId, written, objective },
      });
      results.push(mark);
    }

    revalidatePath("/admin-route/marks");
    return { success: true, results, message: `${results.length} marks saved` };
  } catch (error) {
    console.error("Bulk save error:", error);
    return { success: false, error: "Failed to save marks" };
  }
}
