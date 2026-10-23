"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

export interface BatchMapping {
  sourceBatchId: number;
  sourceBatchName: string;
  sourceClass: string;
  targetBatchId: number;
  targetBatchName: string;
  targetClass: string;
}

export interface StudentPromotionDecision {
  studentId: number;
  decision: "PROMOTE" | "HOLD_BACK" | "EXCLUDE";
  customTargetBatchId?: number;
  customRoll?: number;
  note?: string;
}

export interface ExecutePromotionInput {
  sourceYear: number;
  targetYear: number;
  batchMappings: {
    sourceBatchId: number;
    targetBatchId: number;
    targetClass: string;
  }[];
  studentDecisions: StudentPromotionDecision[];
}

const CLASS_NEXT_MAP: Record<string, string> = {
  Six: "Seven",
  Seven: "Eight",
  Eight: "Nine",
  Nine: "Ten",
};

export async function getPromotionWizardDataAction(sourceYear: number = new Date().getFullYear()) {
  await requireRole(["ADMIN", "STAFF"]);
  try {
    const targetYear = sourceYear + 1;

    // 1. Fetch all regular batches (programId is null)
    const batches = await prisma.batch.findMany({
      where: { programId: null },
      include: {
        _count: {
          select: {
            students: {
              where: { active: true, isArchived: false },
            },
          },
        },
      },
      orderBy: [{ classId: "asc" }, { code: "asc" }],
    });

    // 2. Fetch all active, non-archived regular students in Classes Six through Nine
    const eligibleStudents = await prisma.student.findMany({
      where: {
        active: true,
        isArchived: false,
        class: { in: ["Six", "Seven", "Eight", "Nine"] },
        batch: { programId: null },
      },
      include: {
        batch: { select: { id: true, name: true, code: true, classId: true } },
        school: { select: { id: true, name: true } },
      },
      orderBy: [
        { class: "asc" },
        { batch: { code: "asc" } },
        { roll: "asc" },
      ],
    });

    // 3. Class Ten regular students summary (not promoted, but need transition or year-end archive)
    const classTenStudents = await prisma.student.findMany({
      where: {
        active: true,
        isArchived: false,
        class: "Ten",
        batch: { programId: null },
      },
      select: {
        id: true,
        name: true,
        roll: true,
        mobile: true,
        gender: true,
        school: { select: { name: true } },
        batch: { select: { name: true, code: true } },
      },
      orderBy: [{ batch: { code: "asc" } }, { roll: "asc" }],
    });

    // 4. Group batches by class
    const batchesByClass: Record<string, any[]> = {
      Six: [],
      Seven: [],
      Eight: [],
      Nine: [],
      Ten: [],
    };
    for (const b of batches) {
      if (batchesByClass[b.classId]) {
        batchesByClass[b.classId].push({
          id: b.id,
          name: b.name,
          code: b.code,
          classId: b.classId,
          studentCount: b._count.students,
        });
      }
    }

    // 5. Build intelligent default batch mappings (e.g., 6A -> 7A, 8A -> 9A)
    const defaultMappings: BatchMapping[] = [];
    const sourceClasses = ["Six", "Seven", "Eight", "Nine"];

    for (const sClass of sourceClasses) {
      const nextClass = CLASS_NEXT_MAP[sClass];
      const sourceList = batchesByClass[sClass] || [];
      const targetList = batchesByClass[nextClass] || [];

      for (const sBatch of sourceList) {
        // Try to match by suffix (e.g., 6A -> 7A, 8B -> 9B)
        const suffix = sBatch.name.replace(/^[0-9]+/, "").toUpperCase();
        let matchedTarget = targetList.find((tb) =>
          tb.name.toUpperCase().endsWith(suffix)
        );
        if (!matchedTarget && targetList.length > 0) {
          matchedTarget = targetList[0];
        }

        if (matchedTarget) {
          defaultMappings.push({
            sourceBatchId: sBatch.id,
            sourceBatchName: sBatch.name,
            sourceClass: sClass,
            targetBatchId: matchedTarget.id,
            targetBatchName: matchedTarget.name,
            targetClass: nextClass,
          });
        }
      }
    }

    return {
      success: true,
      data: {
        sourceYear,
        targetYear,
        eligibleStudentsCount: eligibleStudents.length,
        classTenCount: classTenStudents.length,
        batchesByClass,
        defaultMappings,
        students: eligibleStudents.map((s) => ({
          id: s.id,
          name: s.name,
          roll: s.roll,
          displayRoll: (s.batch?.code || 0) * 100 + s.roll,
          class: s.class,
          nextClass: CLASS_NEXT_MAP[s.class] || s.class,
          batchId: s.batchId,
          batchName: s.batch?.name || "N/A",
          gender: s.gender,
          mobile: s.mobile,
          schoolName: s.school?.name || "N/A",
        })),
        classTenStudents: classTenStudents.map((s) => ({
          id: s.id,
          name: s.name,
          roll: s.roll,
          displayRoll: (s.batch?.code || 0) * 100 + s.roll,
          mobile: s.mobile,
          gender: s.gender,
          schoolName: s.school?.name || "N/A",
          batchName: s.batch?.name || "N/A",
        })),
      },
    };
  } catch (error) {
    console.error("Error fetching promotion wizard data:", error);
    return { success: false, error: "Failed to load promotion data" };
  }
}

export async function executePromotionWizardAction(input: ExecutePromotionInput) {
  await requireRole(["ADMIN", "STAFF"]);
  try {
    const { sourceYear, targetYear, batchMappings, studentDecisions } = input;

    if (!batchMappings || batchMappings.length === 0) {
      return { success: false, error: "Please configure batch mappings for promotion" };
    }

    // Build lookup for fast mapping by source batch ID
    const mappingMap = new Map<number, { targetBatchId: number; targetClass: string }>();
    for (const m of batchMappings) {
      mappingMap.set(m.sourceBatchId, {
        targetBatchId: m.targetBatchId,
        targetClass: m.targetClass,
      });
    }

    // Build lookup for student decision overrides
    const decisionMap = new Map<number, StudentPromotionDecision>();
    for (const d of studentDecisions || []) {
      decisionMap.set(d.studentId, d);
    }

    // Fetch all students being promoted
    const studentsToProcess = await prisma.student.findMany({
      where: {
        active: true,
        isArchived: false,
        class: { in: ["Six", "Seven", "Eight", "Nine"] },
        batch: { programId: null },
      },
      include: {
        batch: true,
      },
      orderBy: [
        { batchId: "asc" },
        { roll: "asc" },
      ],
    });

    if (studentsToProcess.length === 0) {
      return { success: false, error: "No eligible students found to promote" };
    }

    // Keep track of roll counters per target batch
    const targetBatchRolls = new Map<number, number>();

    // Pre-calculate initial starting rolls for target batches
    const targetBatchIds = Array.from(new Set(batchMappings.map((m) => m.targetBatchId)));
    for (const tId of targetBatchIds) {
      const lastStudent = await prisma.student.findFirst({
        where: { batchId: tId, isArchived: false },
        orderBy: { roll: "desc" },
        select: { roll: true },
      });
      targetBatchRolls.set(tId, lastStudent ? lastStudent.roll : 0);
    }

    let promotedCount = 0;
    let heldBackCount = 0;
    let excludedCount = 0;

    // Run promotion in transaction
    await prisma.$transaction(async (tx) => {
      for (const student of studentsToProcess) {
        const override = decisionMap.get(student.id);
        const decision = override?.decision || "PROMOTE";
        const mapping = mappingMap.get(student.batchId);

        // 1. Snapshot existing academic history for sourceYear
        const existingHistory = await tx.studentAcademicHistory.findUnique({
          where: {
            studentId_year: {
              studentId: student.id,
              year: sourceYear,
            },
          },
        });

        const historyNote =
          decision === "PROMOTE"
            ? `Promoted from Class ${student.class} (${student.batch.name}) to ${mapping?.targetClass || "next class"}`
            : decision === "HOLD_BACK"
            ? `Held back in Class ${student.class} (${student.batch.name})`
            : `Excluded from promotion: ${override?.note || "Left coaching"}`;

        if (!existingHistory) {
          await tx.studentAcademicHistory.create({
            data: {
              studentId: student.id,
              year: sourceYear,
              class: student.class,
              batchId: student.batchId,
              roll: student.roll,
              note: historyNote,
            },
          });
        } else {
          await tx.studentAcademicHistory.update({
            where: { id: existingHistory.id },
            data: { note: historyNote },
          });
        }

        // 2. Apply action to student record
        if (decision === "EXCLUDE") {
          // Exclude student
          await tx.student.update({
            where: { id: student.id },
            data: {
              active: false,
              isArchived: true,
              archivedYear: sourceYear,
              archivedReason: override?.note || "Excluded during annual promotion",
              archivedAt: new Date(),
            },
          });
          excludedCount++;
        } else if (decision === "HOLD_BACK") {
          // Held back: keep in current class
          const targetBatchId = override?.customTargetBatchId || student.batchId;
          const targetRoll = override?.customRoll || student.roll;

          await tx.student.update({
            where: { id: student.id },
            data: {
              batchId: targetBatchId,
              roll: targetRoll,
              active: true,
            },
          });
          heldBackCount++;
        } else {
          // PROMOTE
          if (!mapping) {
            // If no mapping found for this batch, skip promotion and keep as is
            continue;
          }

          const targetBatchId = override?.customTargetBatchId || mapping.targetBatchId;
          let newRoll: number;

          if (override?.customRoll) {
            newRoll = override.customRoll;
          } else {
            const currentRollCounter = targetBatchRolls.get(targetBatchId) || 0;
            newRoll = currentRollCounter + 1;
            targetBatchRolls.set(targetBatchId, newRoll);
          }

          await tx.student.update({
            where: { id: student.id },
            data: {
              class: mapping.targetClass,
              batchId: targetBatchId,
              roll: newRoll,
              active: true,
            },
          });
          promotedCount++;
        }
      }
    }, {
      timeout: 30000,
    });

    revalidatePath("/admin-route/students");
    revalidatePath("/admin-route/batches");
    revalidatePath("/admin-route/dashboard");
    revalidatePath("/admin-route/fees");

    return {
      success: true,
      message: `Annual Promotion completed: ${promotedCount} students promoted, ${heldBackCount} held back, ${excludedCount} excluded/archived. Academic history recorded for Session ${sourceYear}.`,
      data: {
        promotedCount,
        heldBackCount,
        excludedCount,
        sourceYear,
        targetYear,
      },
    };
  } catch (error: any) {
    console.error("Error executing promotion wizard:", error);
    return {
      success: false,
      error: error?.message || "Failed to execute student promotion",
    };
  }
}
