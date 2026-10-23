"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

export interface ArchivedStudentItem {
  id: number;
  name: string;
  fatherName: string;
  motherName: string;
  mobile: string;
  homeMobile: string;
  class: string;
  roll: number;
  displayRoll: number;
  batchId: number;
  batchName: string;
  gender: string;
  schoolName: string;
  archivedYear: number | null;
  archivedReason: string | null;
  archivedAt: Date | null;
}

export async function getClassTenYearEndRosterAction(year: number = new Date().getFullYear()) {
  await requireRole(["ADMIN", "STAFF"]);
  try {
    // 1. All active Class Ten regular students
    const regularTenStudents = await prisma.student.findMany({
      where: {
        active: true,
        isArchived: false,
        class: "Ten",
        batch: { programId: null },
      },
      include: {
        batch: { select: { id: true, name: true, code: true } },
        school: { select: { id: true, name: true } },
      },
      orderBy: [{ batch: { code: "asc" } }, { roll: "asc" }],
    });

    // 2. Fetch available SSC special program batches
    const sscBatches = await prisma.batch.findMany({
      where: {
        program: { category: "SSC", active: true },
      },
      include: {
        program: { select: { id: true, name: true, code: true, year: true } },
        _count: { select: { students: { where: { active: true } } } },
      },
      orderBy: { name: "asc" },
    });

    // 3. For each regular student, check if they are already in an SSC batch (by mobile or name)
    const sscMobiles = new Set(
      (
        await prisma.student.findMany({
          where: {
            batch: { program: { category: "SSC" } },
            active: true,
          },
          select: { mobile: true },
        })
      ).map((s) => s.mobile)
    );

    const students = regularTenStudents.map((s) => ({
      id: s.id,
      name: s.name,
      roll: s.roll,
      displayRoll: (s.batch?.code || 0) * 100 + s.roll,
      mobile: s.mobile,
      gender: s.gender,
      schoolName: s.school?.name || "N/A",
      batchId: s.batchId,
      batchName: s.batch?.name || "N/A",
      isEnrolledInSscBatch: sscMobiles.has(s.mobile),
    }));

    return {
      success: true,
      data: {
        year,
        totalRegularTen: regularTenStudents.length,
        sscBatches: sscBatches.map((b) => ({
          id: b.id,
          name: b.name,
          code: b.code,
          programName: b.program?.name || "SSC Program",
          studentCount: b._count.students,
        })),
        students,
      },
    };
  } catch (error) {
    console.error("Error fetching Class Ten roster:", error);
    return { success: false, error: "Failed to load Class Ten roster" };
  }
}

export async function archiveClassTenYearEndAction(
  studentIds: number[],
  year: number = new Date().getFullYear(),
  reason: string = "Class Ten Year-End Graduation (Non-SSC)"
) {
  await requireRole(["ADMIN", "STAFF"]);
  try {
    if (!studentIds || studentIds.length === 0) {
      return { success: false, error: "No students selected for archiving" };
    }

    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      include: { batch: true },
    });

    await prisma.$transaction(async (tx) => {
      for (const st of students) {
        // 1. Snapshot history
        const existingHistory = await tx.studentAcademicHistory.findUnique({
          where: {
            studentId_year: {
              studentId: st.id,
              year,
            },
          },
        });

        if (!existingHistory) {
          await tx.studentAcademicHistory.create({
            data: {
              studentId: st.id,
              year,
              class: st.class,
              batchId: st.batchId,
              roll: st.roll,
              note: reason,
            },
          });
        }

        // 2. Mark student as archived
        await tx.student.update({
          where: { id: st.id },
          data: {
            active: false,
            isArchived: true,
            archivedYear: year,
            archivedReason: reason,
            archivedAt: new Date(),
          },
        });
      }
    });

    revalidatePath("/admin-route/students");
    revalidatePath("/admin-route/students/archived");
    revalidatePath("/admin-route/dashboard");

    return {
      success: true,
      message: `${students.length} Class Ten students archived successfully for Session ${year}.`,
    };
  } catch (error: any) {
    console.error("Error archiving Class Ten students:", error);
    return { success: false, error: error?.message || "Failed to archive students" };
  }
}

export async function archiveSscBatchAction(
  batchId: number,
  reason: string = "Completed SSC Special Program"
) {
  await requireRole(["ADMIN", "STAFF"]);
  try {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        program: true,
        students: { where: { isArchived: false } },
      },
    });

    if (!batch || !batch.programId) {
      return { success: false, error: "Batch not found or not a special program batch" };
    }

    const year = batch.program?.year || new Date().getFullYear();
    const students = batch.students;

    if (students.length === 0) {
      return { success: false, error: "No active students in this batch to archive" };
    }

    await prisma.$transaction(async (tx) => {
      for (const st of students) {
        // Snapshot history
        const existingHistory = await tx.studentAcademicHistory.findUnique({
          where: {
            studentId_year: {
              studentId: st.id,
              year,
            },
          },
        });

        if (!existingHistory) {
          await tx.studentAcademicHistory.create({
            data: {
              studentId: st.id,
              year,
              class: st.class,
              batchId: st.batchId,
              roll: st.roll,
              note: `${reason} - ${batch.name}`,
            },
          });
        }

        // Archive student
        await tx.student.update({
          where: { id: st.id },
          data: {
            active: false,
            isArchived: true,
            archivedYear: year,
            archivedReason: `${reason} (${batch.name})`,
            archivedAt: new Date(),
          },
        });
      }
    });

    revalidatePath("/admin-route/special-batch");
    revalidatePath(`/admin-route/special-batch/batches/${batchId}`);
    revalidatePath("/admin-route/students/archived");

    return {
      success: true,
      message: `Batch '${batch.name}' archived: ${students.length} students archived for Session ${year}.`,
    };
  } catch (error: any) {
    console.error("Error archiving SSC batch:", error);
    return { success: false, error: error?.message || "Failed to archive batch" };
  }
}

export async function moveStudentsToSscBatchAction(
  studentIds: number[],
  targetBatchId: number
) {
  await requireRole(["ADMIN", "STAFF"]);
  try {
    const targetBatch = await prisma.batch.findUnique({
      where: { id: targetBatchId },
      include: { program: true },
    });

    if (!targetBatch || !targetBatch.programId) {
      return { success: false, error: "Target batch is not an SSC special batch" };
    }

    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
    });

    let enrolledCount = 0;

    await prisma.$transaction(async (tx) => {
      // Find starting roll
      const last = await tx.student.findFirst({
        where: { batchId: targetBatchId },
        orderBy: { roll: "desc" },
        select: { roll: true },
      });
      let rollCounter = last ? last.roll : 0;

      for (const st of students) {
        // Check if already in batch
        const exists = await tx.student.findFirst({
          where: { batchId: targetBatchId, mobile: st.mobile },
        });
        if (exists) continue;

        rollCounter++;

        // Create new special batch enrollment record
        await tx.student.create({
          data: {
            name: st.name,
            fatherName: st.fatherName,
            motherName: st.motherName,
            mobile: st.mobile,
            homeMobile: st.homeMobile,
            gender: st.gender,
            schoolId: st.schoolId,
            address: st.address,
            email: st.email,
            dob: st.dob,
            class: targetBatch.classId,
            batchId: targetBatchId,
            roll: rollCounter,
            active: true,
            userId: st.userId || undefined,
          },
        });
        enrolledCount++;
      }
    });

    revalidatePath("/admin-route/special-batch");
    revalidatePath(`/admin-route/special-batch/batches/${targetBatchId}`);
    revalidatePath("/admin-route/students");

    return {
      success: true,
      message: `${enrolledCount} students successfully moved/enrolled into ${targetBatch.name}.`,
    };
  } catch (error: any) {
    console.error("Error moving students to SSC batch:", error);
    return { success: false, error: error?.message || "Failed to move students" };
  }
}

export async function getArchivedStudentsAction(filters?: {
  year?: number;
  class?: string;
  reason?: string;
  search?: string;
}) {
  await requireRole(["ADMIN", "STAFF"]);
  try {
    const where: any = { isArchived: true };

    if (filters?.year) {
      where.archivedYear = filters.year;
    }
    if (filters?.class) {
      where.class = filters.class;
    }
    if (filters?.search) {
      const q = filters.search.trim();
      const num = parseInt(q);
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { mobile: { contains: q } },
        ...(!isNaN(num) ? [{ roll: num }] : []),
      ];
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        batch: { select: { id: true, name: true, code: true } },
        school: { select: { id: true, name: true } },
        academicHistories: {
          orderBy: { year: "desc" },
          include: { batch: { select: { name: true, code: true } } },
        },
      },
      orderBy: [{ archivedYear: "desc" }, { archivedAt: "desc" }],
    });

    return {
      success: true,
      data: students.map((s) => ({
        id: s.id,
        name: s.name,
        fatherName: s.fatherName,
        motherName: s.motherName,
        mobile: s.mobile,
        homeMobile: s.homeMobile,
        class: s.class,
        roll: s.roll,
        displayRoll: (s.batch?.code || 0) * 100 + s.roll,
        batchId: s.batchId,
        batchName: s.batch?.name || "N/A",
        gender: s.gender,
        schoolName: s.school?.name || "N/A",
        archivedYear: s.archivedYear,
        archivedReason: s.archivedReason,
        archivedAt: s.archivedAt,
        academicHistories: s.academicHistories || [],
      })),
    };
  } catch (error) {
    console.error("Error fetching archived students:", error);
    return { success: false, error: "Failed to load archived students", data: [] };
  }
}

export async function restoreArchivedStudentAction(
  studentId: number,
  targetBatchId?: number
) {
  await requireRole(["ADMIN", "STAFF"]);
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { batch: true },
    });

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    let batchId = student.batchId;
    let className = student.class;
    let roll = student.roll;

    if (targetBatchId) {
      const batch = await prisma.batch.findUnique({
        where: { id: targetBatchId },
      });
      if (batch) {
        batchId = batch.id;
        className = batch.classId;
        const last = await prisma.student.findFirst({
          where: { batchId: batch.id, active: true, isArchived: false },
          orderBy: { roll: "desc" },
          select: { roll: true },
        });
        roll = last ? last.roll + 1 : 1;
      }
    }

    await prisma.student.update({
      where: { id: studentId },
      data: {
        active: true,
        isArchived: false,
        archivedYear: null,
        archivedReason: null,
        archivedAt: null,
        batchId,
        class: className,
        roll,
      },
    });

    revalidatePath("/admin-route/students");
    revalidatePath("/admin-route/students/archived");
    revalidatePath("/admin-route/dashboard");

    return {
      success: true,
      message: `Student '${student.name}' has been restored to active status (Class ${className}, Roll #${roll}).`,
    };
  } catch (error: any) {
    console.error("Error restoring student:", error);
    return { success: false, error: error?.message || "Failed to restore student" };
  }
}

export async function getStudentAcademicHistoriesAction(studentId: number) {
  await requireRole(["ADMIN", "STAFF", "TEACHER", "STUDENT"]);
  try {
    const histories = await prisma.studentAcademicHistory.findMany({
      where: { studentId },
      include: {
        batch: { select: { id: true, name: true, code: true } },
      },
      orderBy: { year: "desc" },
    });

    return { success: true, data: histories };
  } catch (error) {
    console.error("Error fetching student academic histories:", error);
    return { success: false, error: "Failed to load academic history", data: [] };
  }
}
