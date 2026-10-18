"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

export interface RecordCoursePaymentInput {
  studentId: number;
  programId: number;
  amount: number;
  paymentMethod?: string;
  note?: string;
  agreedFee?: number;
}

export async function getSpecialProgramsAction() {
  try {
    const programs = await prisma.program.findMany({
      where: { active: true },
      include: {
        batches: {
          select: {
            id: true,
            name: true,
            code: true,
            classId: true,
            _count: {
              select: { students: true },
            },
          },
        },
        subjects: {
          orderBy: { sortOrder: "asc" },
        },
        _count: {
          select: { subjects: true, specialExams: true, courseFees: true },
        },
      },
      orderBy: { year: "desc" },
    });
    return { success: true, data: programs };
  } catch (error) {
    console.error("Error fetching special programs:", error);
    return { success: false, error: "Failed to fetch programs", data: [] };
  }
}

export async function getSpecialCourseFeesAction(programId?: number) {
  try {
    await requireRole("ADMIN");
    const whereClause = programId ? { programId } : {};

    const courseFees = await prisma.studentCourseFee.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            mobile: true,
            roll: true,
            class: true,
            gender: true,
            batch: {
              select: { id: true, name: true, code: true },
            },
          },
        },
        program: {
          select: { id: true, name: true, code: true, category: true },
        },
        payments: {
          orderBy: { paymentDate: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const enriched = courseFees.map((cf) => {
      const totalPaid = cf.payments.reduce((sum, p) => sum + p.amount, 0);
      return {
        ...cf,
        totalPaid,
        installmentsCount: cf.payments.length,
      };
    });

    return { success: true, data: enriched };
  } catch (error) {
    console.error("Error fetching course fees:", error);
    return { success: false, error: "Failed to load course fees", data: [] };
  }
}

export async function recordCoursePaymentAction(input: RecordCoursePaymentInput) {
  await requireRole("ADMIN");
  try {
    const { studentId, programId, amount, paymentMethod = "CASH", note = "", agreedFee } = input;

    if (!studentId || !programId || amount <= 0) {
      return { success: false, error: "Invalid payment details" };
    }

    // Verify student exists and belongs to a batch in this program
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { batch: true },
    });

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    if (student.batch?.programId !== programId) {
      return {
        success: false,
        error: `Student is in batch '${student.batch?.name || "General"}', which does not belong to this program.`,
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Get or create StudentCourseFee
      let feeRecord = await tx.studentCourseFee.findUnique({
        where: {
          studentId_programId: {
            studentId,
            programId,
          },
        },
      });

      if (!feeRecord) {
        feeRecord = await tx.studentCourseFee.create({
          data: {
            studentId,
            programId,
            agreedFee: agreedFee || null,
            notes: note || "",
          },
        });
      } else if (agreedFee !== undefined && agreedFee !== feeRecord.agreedFee) {
        feeRecord = await tx.studentCourseFee.update({
          where: { id: feeRecord.id },
          data: { agreedFee },
        });
      }

      // 2. Create CoursePayment installment first
      const payment = await tx.coursePayment.create({
        data: {
          studentCourseFeeId: feeRecord.id,
          amount,
          paymentMethod,
          note,
          paymentDate: new Date(),
        },
      });

      // 3. Monotonically generate guaranteed unique receipt number using payment sequence ID
      const receiptNo = `CR-${new Date().getFullYear()}-${String(payment.id).padStart(5, "0")}`;
      const updatedPayment = await tx.coursePayment.update({
        where: { id: payment.id },
        data: { receiptNo },
      });

      return { feeRecord, payment: updatedPayment };
    });

    revalidatePath("/admin-route/accounts");
    revalidatePath("/admin-route/fees");

    return {
      success: true,
      data: result.payment,
      receiptNo: result.payment.receiptNo,
    };
  } catch (error) {
    console.error("Error recording course payment:", error);
    return { success: false, error: "Failed to record installment payment" };
  }
}

export async function getCoursePaymentReceiptAction(paymentId: number) {
  try {
    const session = await requireRole(["ADMIN", "STUDENT"]);
    const payment = await prisma.coursePayment.findUnique({
      where: { id: paymentId },
      include: {
        courseFee: {
          include: {
            student: {
              include: {
                batch: true,
                school: true,
              },
            },
            program: true,
            payments: {
              orderBy: { paymentDate: "asc" },
            },
          },
        },
      },
    });

    if (!payment) {
      return { success: false, error: "Receipt not found" };
    }

    if (session.role === "STUDENT") {
      const student = await prisma.student.findFirst({
        where: { userId: parseInt(session.id, 10) },
      });
      if (!student || student.id !== payment.courseFee.studentId) {
        return { success: false, error: "Unauthorized" };
      }
    }

    const totalPaidToDate = payment.courseFee.payments
      .filter((p) => new Date(p.paymentDate) <= new Date(payment.paymentDate))
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      success: true,
      data: {
        ...payment,
        totalPaidToDate,
        totalInstallments: payment.courseFee.payments.length,
      },
    };
  } catch (error) {
    console.error("Error fetching payment receipt:", error);
    return { success: false, error: "Failed to generate receipt" };
  }
}

import { CURRICULUM_TEMPLATES } from "@/lib/curriculum-templates";

export interface CreateProgramInput {
  name: string;
  code: string;
  category: "SSC" | "JSC";
  year?: number;
  classLevel: string;
  batchNames?: string[];
  batchCodes?: number[];
  curriculumTemplate?: keyof typeof CURRICULUM_TEMPLATES | "NONE";
}

export async function createSpecialProgramAction(input: CreateProgramInput) {
  await requireRole(["ADMIN", "STAFF"]);
  try {
    const {
      name,
      code,
      category,
      year = 2026,
      classLevel,
      batchNames = ["Boys", "Girls"],
      curriculumTemplate = category === "SSC" ? "SSC_SCIENCE" : "JSC_GENERAL",
    } = input;

    const program = await prisma.$transaction(async (tx) => {
      const created = await tx.program.create({
        data: {
          name,
          code,
          category,
          year,
          active: true,
        },
      });

      for (let i = 0; i < batchNames.length; i++) {
        const bName = batchNames[i];
        const defaultCode =
          (input.batchCodes && input.batchCodes[i]) ||
          (year % 100) * 100 + (category === "SSC" ? 20 - i * 10 : 82 - i);

        await tx.batch.create({
          data: {
            classId: classLevel,
            name: `${created.code} ${bName}`,
            code: defaultCode,
            programId: created.id,
          },
        });
      }

      // Populate dynamic curriculum if selected
      if (curriculumTemplate && curriculumTemplate !== "NONE" && CURRICULUM_TEMPLATES[curriculumTemplate]) {
        const t = CURRICULUM_TEMPLATES[curriculumTemplate];
        for (const subj of t.subjects) {
          await tx.programSubject.create({
            data: {
              programId: created.id,
              name: subj.name,
              code: subj.code,
              isCombined: subj.isCombined,
              combinedGroupId: subj.combinedGroupId,
              isOptional: subj.isOptional,
              hasPractical: subj.hasPractical,
              fullMarks: subj.fullMarks,
              cqMax: subj.cqMax,
              mcqMax: subj.mcqMax,
              practicalMax: subj.practicalMax,
              sortOrder: subj.sortOrder,
            },
          });
        }
      }

      return created;
    });

    revalidatePath("/admin-route/special-batch");
    revalidatePath("/admin-route/batches");
    revalidatePath("/admin-route/accounts");

    return { success: true, data: program };
  } catch (error: any) {
    console.error("Error creating special program:", error);
    return { success: false, error: error?.message || "Failed to create special program" };
  }
}

export async function seedStandardProgramsAction() {
  await requireRole("ADMIN");
  try {
    const existing = await prisma.program.findMany({ select: { id: true } });
    if (existing.length > 0) {
      return { success: false, error: "Programs already exist in the database." };
    }

    // 1. Create SSC-2026
    const ssc = await prisma.program.create({
      data: {
        name: "SSC Special Batch 2026",
        code: "SSC-2026",
        category: "SSC",
        year: 2026,
        active: true,
      },
    });

    // Batches for SSC
    await prisma.batch.createMany({
      data: [
        { classId: "Ten", name: "SSC-2026 Boys", code: 2620, programId: ssc.id },
        { classId: "Ten", name: "SSC-2026 Girls", code: 2610, programId: ssc.id },
      ],
    });

    // Standard subjects for SSC
    await prisma.programSubject.createMany({
      data: [
        { programId: ssc.id, name: "Bangla 1st", code: "101", isCombined: true, combinedGroupId: "BANGLA", isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 70, mcqMax: 30, practicalMax: 0, sortOrder: 1 },
        { programId: ssc.id, name: "Bangla 2nd", code: "102", isCombined: true, combinedGroupId: "BANGLA", isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 70, mcqMax: 30, practicalMax: 0, sortOrder: 2 },
        { programId: ssc.id, name: "English 1st", code: "107", isCombined: true, combinedGroupId: "ENGLISH", isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 100, mcqMax: 0, practicalMax: 0, sortOrder: 3 },
        { programId: ssc.id, name: "English 2nd", code: "108", isCombined: true, combinedGroupId: "ENGLISH", isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 100, mcqMax: 0, practicalMax: 0, sortOrder: 4 },
        { programId: ssc.id, name: "General Math", code: "109", isCombined: false, combinedGroupId: null, isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 70, mcqMax: 30, practicalMax: 0, sortOrder: 5 },
        { programId: ssc.id, name: "Physics", code: "136", isCombined: false, combinedGroupId: null, isOptional: false, hasPractical: true, fullMarks: 100, cqMax: 50, mcqMax: 25, practicalMax: 25, sortOrder: 6 },
        { programId: ssc.id, name: "Chemistry", code: "137", isCombined: false, combinedGroupId: null, isOptional: false, hasPractical: true, fullMarks: 100, cqMax: 50, mcqMax: 25, practicalMax: 25, sortOrder: 7 },
        { programId: ssc.id, name: "Biology", code: "138", isCombined: false, combinedGroupId: null, isOptional: true, hasPractical: true, fullMarks: 100, cqMax: 50, mcqMax: 25, practicalMax: 25, sortOrder: 8 },
        { programId: ssc.id, name: "Higher Math", code: "126", isCombined: false, combinedGroupId: null, isOptional: true, hasPractical: true, fullMarks: 100, cqMax: 50, mcqMax: 25, practicalMax: 25, sortOrder: 9 },
      ],
    });

    // 2. Create Junior School-2026
    const jsc = await prisma.program.create({
      data: {
        name: "Junior School Special Batch 2026",
        code: "JSC-2026",
        category: "JSC",
        year: 2026,
        active: true,
      },
    });

    await prisma.batch.createMany({
      data: [
        { classId: "Eight", name: "Junior-2026 Boys", code: 2682, programId: jsc.id },
        { classId: "Eight", name: "Junior-2026 Girls", code: 2681, programId: jsc.id },
      ],
    });

    await prisma.programSubject.createMany({
      data: [
        { programId: jsc.id, name: "Bangla", code: "101", isCombined: false, combinedGroupId: null, isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 70, mcqMax: 30, practicalMax: 0, sortOrder: 1 },
        { programId: jsc.id, name: "English", code: "107", isCombined: false, combinedGroupId: null, isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 100, mcqMax: 0, practicalMax: 0, sortOrder: 2 },
        { programId: jsc.id, name: "Mathematics", code: "109", isCombined: false, combinedGroupId: null, isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 70, mcqMax: 30, practicalMax: 0, sortOrder: 3 },
        { programId: jsc.id, name: "General Science", code: "127", isCombined: false, combinedGroupId: null, isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 70, mcqMax: 30, practicalMax: 0, sortOrder: 4 },
        { programId: jsc.id, name: "BGS", code: "150", isCombined: false, combinedGroupId: null, isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 70, mcqMax: 30, practicalMax: 0, sortOrder: 5 },
      ],
    });

    revalidatePath("/admin-route/special-batch");
    revalidatePath("/admin-route/batches");
    revalidatePath("/admin-route/accounts");

    return { success: true };
  } catch (error: any) {
    console.error("Error seeding standard programs:", error);
    return { success: false, error: error?.message || "Failed to seed programs" };
  }
}
