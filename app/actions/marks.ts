// app/actions/marks.ts
"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Mark, ServiceResult } from "@/types";
import { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/auth-guard";

const markSchema = z.object({
  examSubjectId: z.number().min(1),
  studentId: z.number().min(1),
  written: z.number().min(0).max(100).optional(),
  objective: z.number().min(0).max(100).optional(),
});

async function validateAction() {
  try {
    const session = await requireRole(["ADMIN", "STAFF", "TEACHER"]);
    return { success: true, user: session } as const;
  } catch (err: any) {
    return { success: false, error: err.message || "Unauthorized" } as const;
  }
}

export async function getExamsByClassAction(className?: string) {
  try {
    await requireRole(["ADMIN", "STAFF", "TEACHER"]);
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
    await requireRole(["ADMIN", "STAFF", "TEACHER"]);
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
    await requireRole(["ADMIN", "STAFF", "TEACHER"]);
    const marks = await prisma.mark.findMany({
      where: {
        examSubjectId,
        student: { batchId, active: true },
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
  const user = auth.user;

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

    if (user.role === "TEACHER") {
      const teacher = await prisma.teacher.findFirst({
        where: {
          OR: [
            { userId: parseInt(user.id, 10) },
            { mobile: user.username },
          ],
        },
        select: { id: true },
      });

      if (!teacher || subject.teacherId !== teacher.id) {
        return { success: false, error: "You can only enter marks for your assigned subjects." };
      }

      // Check if mark already exists - teacher cannot edit existing marks
      const existingMark = await prisma.mark.findUnique({
        where: {
          examSubjectId_studentId: { examSubjectId, studentId },
        },
      });

      if (existingMark) {
        return {
          success: false,
          error: "This mark has already been entered. Teachers cannot edit existing marks; only staff and admin can edit them.",
        };
      }
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
    revalidatePath("/teacher-route/marks");
    revalidatePath("/teacher-route/exams");
    return { success: true, mark, message: "Mark saved" };
  } catch (error) {
    console.error("Save mark error:", error);
    return { success: false, error: "Database error" };
  }
}

// 🔹 Return types
type BulkSaveSuccess = {
  success: true;
  results: Mark[];
  count: number;
  message: string;
};

type BulkSaveError = {
  success: false;
  error: string;
};

type BulkSaveResult = BulkSaveSuccess | BulkSaveError;

export async function bulkSaveMarksAction(entries: Array<{
  examSubjectId: number;
  studentId: number;
  written?: number;
  objective?: number;
}>): Promise<BulkSaveResult> {
  const auth = await validateAction();
  if (!auth.success) return auth;
  const user = auth.user;

  if (!entries || entries.length === 0) {
    return { success: false, error: "No entries provided" };
  }

  try {
    let allowedEntries = entries;

    if (user.role === "TEACHER") {
      const teacher = await prisma.teacher.findFirst({
        where: {
          OR: [
            { userId: parseInt(user.id, 10) },
            { mobile: user.username },
          ],
        },
        select: { id: true },
      });

      if (!teacher) {
        return { success: false, error: "Teacher record not found" };
      }

      // Check subject assignment
      const subjectIds = Array.from(new Set(entries.map((e) => e.examSubjectId)));
      const subjects = await prisma.examSubject.findMany({
        where: { id: { in: subjectIds } },
        select: { id: true, teacherId: true },
      });

      const unauthorized = subjects.some((s) => s.teacherId !== teacher.id);
      if (unauthorized || subjects.length !== subjectIds.length) {
        return { success: false, error: "You can only enter marks for your assigned subjects." };
      }

      // Check existing marks in database - teacher cannot edit existing marks
      const existingMarks = await prisma.mark.findMany({
        where: {
          OR: entries.map((e) => ({
            examSubjectId: e.examSubjectId,
            studentId: e.studentId,
          })),
        },
        select: { examSubjectId: true, studentId: true },
      });

      const existingSet = new Set(
        existingMarks.map((m) => `${m.examSubjectId}_${m.studentId}`)
      );

      // Only allow new/empty marks
      allowedEntries = entries.filter(
        (e) => !existingSet.has(`${e.examSubjectId}_${e.studentId}`)
      );

      if (allowedEntries.length === 0 && entries.length > 0) {
        return {
          success: false,
          error: "All selected marks already exist. Teachers cannot edit existing marks; only staff and admin can edit them.",
        };
      }
    }

    const results: Mark[] = [];
    for (const entry of allowedEntries) {
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
    revalidatePath("/teacher-route/marks");
    revalidatePath("/teacher-route/exams");

    return {
      success: true,
      results,
      count: results.length,
      message: `${results.length} marks saved successfully`,
    } satisfies BulkSaveSuccess;
  } catch (error) {
    console.error("Bulk save error:", error);
    return { success: false, error: "Failed to save marks" } satisfies BulkSaveError;
  }
}