"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

export async function assignStudentOptionalSubjectAction(
  studentId: number,
  subjectId: number
) {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    // 1. Remove any previous optional subject for this student in the same program
    const targetSubject = await prisma.programSubject.findUnique({
      where: { id: subjectId },
    });

    if (!targetSubject) {
      return { success: false, error: "Program subject not found" };
    }

    // Upsert the optional assignment
    const existing = await prisma.studentSubject.findFirst({
      where: {
        studentId,
        subject: { programId: targetSubject.programId },
        isOptional: true,
      },
    });

    if (existing) {
      await prisma.studentSubject.delete({
        where: { id: existing.id },
      });
    }

    const assigned = await prisma.studentSubject.create({
      data: {
        studentId,
        subjectId,
        isOptional: true,
      },
      include: {
        subject: true,
      },
    });

    revalidatePath("/admin-route/special-batch");
    revalidatePath("/admin-route/students");
    return { success: true, data: assigned };
  } catch (error) {
    console.error("Error assigning student optional subject:", error);
    return { success: false, error: "Failed to assign optional subject" };
  }
}

export async function getProgramOptionalCandidatesAction(programId: number) {
  try {
    await requireRole(["ADMIN", "STAFF", "TEACHER", "STUDENT"]);
    // Return subjects configured for this program
    // Prefer subjects marked isOptional: true, or if none are marked, return all elective candidates
    const subjects = await prisma.programSubject.findMany({
      where: { programId },
      orderBy: { sortOrder: "asc" },
    });

    return { success: true, data: subjects };
  } catch (error) {
    console.error("Error fetching program optional subjects:", error);
    return { success: false, error: "Failed to fetch optional subjects", data: [] };
  }
}

export async function getProgramStudentsWithSubjectsAction(
  programId: number,
  batchId?: number
) {
  try {
    await requireRole(["ADMIN", "STAFF", "TEACHER"]);
    const where: any = {
      active: true,
      batch: { programId },
    };

    if (batchId) {
      where.batchId = batchId;
    }

    const [students, subjects] = await Promise.all([
      prisma.student.findMany({
        where,
        orderBy: [{ batch: { code: "asc" } }, { roll: "asc" }],
        include: {
          batch: true,
          school: true,
          studentSubjects: {
            where: { isOptional: true },
            include: { subject: true },
          },
        },
      }),
      prisma.programSubject.findMany({
        where: { programId },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    return {
      success: true,
      data: {
        students,
        subjects,
      },
    };
  } catch (error) {
    console.error("Error fetching students with subjects:", error);
    return { success: false, error: "Failed to fetch students", data: null };
  }
}

export async function batchAssignStudentOptionalSubjectsAction(
  assignments: { studentId: number; subjectId: number | null }[],
  programId: number
) {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    await prisma.$transaction(async (tx) => {
      for (const { studentId, subjectId } of assignments) {
        // Delete any existing optional subject in this program
        const existing = await tx.studentSubject.findFirst({
          where: {
            studentId,
            subject: { programId },
            isOptional: true,
          },
        });

        if (existing) {
          await tx.studentSubject.delete({
            where: { id: existing.id },
          });
        }

        if (subjectId) {
          await tx.studentSubject.create({
            data: {
              studentId,
              subjectId,
              isOptional: true,
            },
          });
        }
      }
    });

    revalidatePath("/admin-route/special-batch");
    revalidatePath("/admin-route/students");
    return { success: true };
  } catch (error) {
    console.error("Error batch assigning optional subjects:", error);
    return { success: false, error: "Failed to save optional subject assignments" };
  }
}
