"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

export interface EnrollExistingStudentInput {
  studentId: number;
  targetBatchId: number;
  agreedFee?: number;
  feeNote?: string;
  optionalSubjectId?: number;
}

export interface EnrollNewStudentInput {
  targetBatchId: number;
  name: string;
  fatherName: string;
  motherName: string;
  mobile: string;
  homeMobile?: string;
  gender: string;
  schoolId: number;
  address: string;
  email?: string;
  dob?: string;
  agreedFee?: number;
  feeNote?: string;
  optionalSubjectId?: number;
}

export async function getSpecialBatchEnrollmentInfoAction(batchId: number) {
  await requireRole(["ADMIN", "STAFF"]);
  try {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        program: {
          include: {
            subjects: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });

    if (!batch || !batch.programId || !batch.program) {
      return { success: false, error: "Special batch or program not found" };
    }

    const [schools, lastStudent] = await Promise.all([
      prisma.school.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.student.findFirst({
        where: { batchId },
        orderBy: { roll: "desc" },
        select: { roll: true },
      }),
    ]);

    const nextRoll = lastStudent ? lastStudent.roll + 1 : 1;
    const displayRoll = batch.code * 100 + nextRoll;

    return {
      success: true,
      data: {
        batch: {
          id: batch.id,
          name: batch.name,
          code: batch.code,
          classId: batch.classId,
          programId: batch.programId,
        },
        program: {
          id: batch.program.id,
          name: batch.program.name,
          code: batch.program.code,
          category: batch.program.category,
          subjects: batch.program.subjects,
        },
        schools,
        nextRoll,
        displayRoll,
      },
    };
  } catch (error) {
    console.error("Error fetching special batch enrollment info:", error);
    return { success: false, error: "Failed to load enrollment info" };
  }
}

export async function searchExistingStudentsForEnrollmentAction(
  search: string,
  targetBatchId: number
) {
  await requireRole(["ADMIN", "STAFF"]);
  try {
    const trimmed = search.trim();
    if (!trimmed) {
      return { success: true, data: [] };
    }

    const targetBatch = await prisma.batch.findUnique({
      where: { id: targetBatchId },
      select: { id: true, programId: true, classId: true },
    });

    if (!targetBatch || !targetBatch.programId) {
      return { success: false, error: "Target special batch not found" };
    }

    const searchNum = parseInt(trimmed);

    // Search active students matching name, mobile, or roll
    const students = await prisma.student.findMany({
      where: {
        active: true,
        OR: [
          { name: { contains: trimmed, mode: "insensitive" } },
          { mobile: { contains: trimmed } },
          ...(!isNaN(searchNum) ? [{ roll: searchNum }] : []),
        ],
      },
      include: {
        batch: { select: { id: true, name: true, code: true, programId: true } },
        school: { select: { id: true, name: true } },
      },
      take: 20,
      orderBy: { id: "desc" },
    });

    // Check which of these are already in this target batch or program
    const enriched = students.map((s) => {
      const isAlreadyInTargetBatch = s.batchId === targetBatchId;
      const isAlreadyInProgram = s.batch?.programId === targetBatch.programId;
      return {
        id: s.id,
        name: s.name,
        roll: s.roll,
        displayRoll: (s.batch?.code || 0) * 100 + s.roll,
        class: s.class,
        mobile: s.mobile,
        homeMobile: s.homeMobile,
        gender: s.gender,
        schoolId: s.schoolId,
        schoolName: s.school?.name || "N/A",
        batchId: s.batchId,
        batchName: s.batch?.name || "N/A",
        isSpecialBatch: !!s.batch?.programId,
        isAlreadyInTargetBatch,
        isAlreadyInProgram,
      };
    });

    return { success: true, data: enriched };
  } catch (error) {
    console.error("Error searching students for enrollment:", error);
    return { success: false, error: "Failed to search students", data: [] };
  }
}

export async function enrollExistingStudentInSpecialBatchAction(
  input: EnrollExistingStudentInput
) {
  await requireRole(["ADMIN", "STAFF"]);
  try {
    const { studentId, targetBatchId, agreedFee, feeNote, optionalSubjectId } = input;

    const targetBatch = await prisma.batch.findUnique({
      where: { id: targetBatchId },
      include: { program: true },
    });

    if (!targetBatch || !targetBatch.programId) {
      return { success: false, error: "Target batch is not a special program batch" };
    }

    const existingStudent = await prisma.student.findUnique({
      where: { id: studentId },
      include: { school: true, batch: true },
    });

    if (!existingStudent) {
      return { success: false, error: "Student not found" };
    }

    // Check if the student is already enrolled in this exact special batch
    const alreadyEnrolled = await prisma.student.findFirst({
      where: {
        batchId: targetBatchId,
        active: true,
        OR: [
          { mobile: existingStudent.mobile },
          { name: existingStudent.name, schoolId: existingStudent.schoolId },
        ],
      },
    });

    if (alreadyEnrolled) {
      return {
        success: false,
        error: `Student is already enrolled in ${targetBatch.name} with Roll #${targetBatch.code * 100 + alreadyEnrolled.roll}.`,
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Get next roll for this batch
      const lastInBatch = await tx.student.findFirst({
        where: { batchId: targetBatchId },
        orderBy: { roll: "desc" },
        select: { roll: true },
      });
      const nextRoll = lastInBatch ? lastInBatch.roll + 1 : 1;

      // 2. Create the special batch student record
      const specialStudent = await tx.student.create({
        data: {
          name: existingStudent.name,
          fatherName: existingStudent.fatherName,
          motherName: existingStudent.motherName,
          mobile: existingStudent.mobile,
          homeMobile: existingStudent.homeMobile || "",
          address: existingStudent.address || "Science Lab Center",
          gender: existingStudent.gender,
          email: existingStudent.email || "",
          dob: existingStudent.dob,
          class: targetBatch.classId,
          schoolId: existingStudent.schoolId,
          batchId: targetBatchId,
          roll: nextRoll,
          active: true,
          userId: existingStudent.userId || undefined,
        },
      });

      // 3. Create course fee entry if agreed fee or note provided
      if (agreedFee !== undefined || feeNote) {
        await tx.studentCourseFee.create({
          data: {
            studentId: specialStudent.id,
            programId: targetBatch.programId!,
            agreedFee: agreedFee && agreedFee > 0 ? agreedFee : null,
            notes: feeNote || "",
          },
        });
      }

      // 4. Create optional subject assignment if provided
      if (optionalSubjectId) {
        await tx.studentSubject.create({
          data: {
            studentId: specialStudent.id,
            subjectId: optionalSubjectId,
            isOptional: true,
          },
        });
      }

      return {
        student: specialStudent,
        nextRoll,
        displayRoll: targetBatch.code * 100 + nextRoll,
      };
    });

    revalidatePath("/admin-route/special-batch");
    revalidatePath(`/admin-route/special-batch/batches/${targetBatchId}`);
    revalidatePath("/admin-route/students");

    return {
      success: true,
      data: result,
      message: `Enrolled successfully as Roll #${result.displayRoll} in ${targetBatch.name}`,
    };
  } catch (error: any) {
    console.error("Error enrolling existing student in special batch:", error);
    return {
      success: false,
      error: error?.message || "Failed to enroll student in special batch",
    };
  }
}

export async function enrollNewStudentInSpecialBatchAction(
  input: EnrollNewStudentInput
) {
  await requireRole(["ADMIN", "STAFF"]);
  try {
    const {
      targetBatchId,
      name,
      fatherName,
      motherName,
      mobile,
      homeMobile,
      gender,
      schoolId,
      address,
      email,
      dob,
      agreedFee,
      feeNote,
      optionalSubjectId,
    } = input;

    if (!name?.trim() || !mobile?.trim() || !fatherName?.trim() || !gender) {
      return { success: false, error: "Please fill in all required student details" };
    }

    const targetBatch = await prisma.batch.findUnique({
      where: { id: targetBatchId },
      include: { program: true },
    });

    if (!targetBatch || !targetBatch.programId) {
      return { success: false, error: "Target batch is not a special program batch" };
    }

    // Check duplicate within the same special batch
    const existingInBatch = await prisma.student.findFirst({
      where: {
        batchId: targetBatchId,
        active: true,
        OR: [{ mobile: mobile.trim() }, { name: name.trim(), schoolId }],
      },
    });

    if (existingInBatch) {
      return {
        success: false,
        error: `A student with this name or mobile already exists in ${targetBatch.name} (Roll #${targetBatch.code * 100 + existingInBatch.roll}).`,
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Get next roll
      const lastInBatch = await tx.student.findFirst({
        where: { batchId: targetBatchId },
        orderBy: { roll: "desc" },
        select: { roll: true },
      });
      const nextRoll = lastInBatch ? lastInBatch.roll + 1 : 1;

      // 2. Create the special batch student record
      const specialStudent = await tx.student.create({
        data: {
          name: name.trim(),
          fatherName: fatherName.trim(),
          motherName: motherName.trim(),
          mobile: mobile.trim(),
          homeMobile: homeMobile?.trim() || "",
          address: address?.trim() || "Science Lab Center",
          gender,
          email: email?.trim() || "",
          dob: dob ? new Date(dob) : null,
          class: targetBatch.classId,
          schoolId,
          batchId: targetBatchId,
          roll: nextRoll,
          active: true,
        },
      });

      // 3. Create course fee entry if specified
      if (agreedFee !== undefined || feeNote) {
        await tx.studentCourseFee.create({
          data: {
            studentId: specialStudent.id,
            programId: targetBatch.programId!,
            agreedFee: agreedFee && agreedFee > 0 ? agreedFee : null,
            notes: feeNote || "",
          },
        });
      }

      // 4. Create optional subject assignment if provided
      if (optionalSubjectId) {
        await tx.studentSubject.create({
          data: {
            studentId: specialStudent.id,
            subjectId: optionalSubjectId,
            isOptional: true,
          },
        });
      }

      return {
        student: specialStudent,
        nextRoll,
        displayRoll: targetBatch.code * 100 + nextRoll,
      };
    });

    revalidatePath("/admin-route/special-batch");
    revalidatePath(`/admin-route/special-batch/batches/${targetBatchId}`);
    revalidatePath("/admin-route/students");

    return {
      success: true,
      data: result,
      message: `New student enrolled as Roll #${result.displayRoll} in ${targetBatch.name}`,
    };
  } catch (error: any) {
    console.error("Error enrolling new student in special batch:", error);
    return {
      success: false,
      error: error?.message || "Failed to enroll new student in special batch",
    };
  }
}
