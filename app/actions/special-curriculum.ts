"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { CURRICULUM_TEMPLATES } from "@/lib/curriculum-templates";

export interface ProgramSubjectInput {
  programId: number;
  name: string;
  code?: string;
  isCombined?: boolean;
  combinedGroupId?: string;
  isOptional?: boolean;
  hasPractical?: boolean;
  fullMarks?: number;
  cqMax?: number;
  mcqMax?: number;
  practicalMax?: number;
  sortOrder?: number;
}

export async function getProgramCurriculumAction(programId: number) {
  try {
    await requireRole(["ADMIN", "STAFF", "TEACHER"]);
    const subjects = await prisma.programSubject.findMany({
      where: { programId },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { specialExamSubjects: true, studentSubjects: true },
        },
      },
    });

    return { success: true, data: subjects };
  } catch (error: any) {
    console.error("Error fetching program curriculum:", error);
    return { success: false, error: error?.message || "Failed to load curriculum", data: [] };
  }
}

export async function addProgramSubjectAction(input: ProgramSubjectInput) {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    const {
      programId,
      name,
      code = "",
      isCombined = false,
      combinedGroupId = null,
      isOptional = false,
      hasPractical = false,
      fullMarks = 100,
      cqMax = 70,
      mcqMax = 30,
      practicalMax = 0,
      sortOrder,
    } = input;

    if (!name.trim()) {
      return { success: false, error: "Subject name is required" };
    }

    const maxSort = await prisma.programSubject.findFirst({
      where: { programId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const nextSort = sortOrder ?? (maxSort?.sortOrder ? maxSort.sortOrder + 1 : 1);

    const subject = await prisma.programSubject.create({
      data: {
        programId,
        name: name.trim(),
        code: code?.trim() || null,
        isCombined,
        combinedGroupId: isCombined && combinedGroupId ? combinedGroupId.trim().toUpperCase() : null,
        isOptional,
        hasPractical,
        fullMarks: Number(fullMarks),
        cqMax: Number(cqMax),
        mcqMax: Number(mcqMax),
        practicalMax: Number(practicalMax),
        sortOrder: nextSort,
      },
    });

    revalidatePath("/admin-route/special-batch");
    return { success: true, data: subject };
  } catch (error: any) {
    console.error("Error adding program subject:", error);
    return { success: false, error: error?.message || "Failed to add subject" };
  }
}

export async function updateProgramSubjectAction(
  subjectId: number,
  input: Partial<ProgramSubjectInput>
) {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    const existing = await prisma.programSubject.findUnique({
      where: { id: subjectId },
    });

    if (!existing) {
      return { success: false, error: "Subject not found" };
    }

    const updated = await prisma.programSubject.update({
      where: { id: subjectId },
      data: {
        ...(input.name ? { name: input.name.trim() } : {}),
        ...(input.code !== undefined ? { code: input.code?.trim() || null } : {}),
        ...(input.isCombined !== undefined ? { isCombined: input.isCombined } : {}),
        ...(input.combinedGroupId !== undefined
          ? { combinedGroupId: input.isCombined && input.combinedGroupId ? input.combinedGroupId.trim().toUpperCase() : null }
          : {}),
        ...(input.isOptional !== undefined ? { isOptional: input.isOptional } : {}),
        ...(input.hasPractical !== undefined ? { hasPractical: input.hasPractical } : {}),
        ...(input.fullMarks !== undefined ? { fullMarks: Number(input.fullMarks) } : {}),
        ...(input.cqMax !== undefined ? { cqMax: Number(input.cqMax) } : {}),
        ...(input.mcqMax !== undefined ? { mcqMax: Number(input.mcqMax) } : {}),
        ...(input.practicalMax !== undefined ? { practicalMax: Number(input.practicalMax) } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: Number(input.sortOrder) } : {}),
      },
    });

    revalidatePath("/admin-route/special-batch");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error updating program subject:", error);
    return { success: false, error: error?.message || "Failed to update subject" };
  }
}

export async function deleteProgramSubjectAction(subjectId: number) {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    const subject = await prisma.programSubject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      return { success: false, error: "Subject not found" };
    }

    // Check if marks are already recorded for this subject
    const marksCount = await prisma.specialMark.count({
      where: { examSubject: { programSubjectId: subjectId } },
    });

    if (marksCount > 0) {
      return {
        success: false,
        error: `Cannot delete '${subject.name}' because ${marksCount} student marks are already recorded in exams. Delete or clear the exam marks first.`,
      };
    }

    // Safely delete optional student assignments & un-marked exam subjects
    await prisma.$transaction(async (tx) => {
      await tx.studentSubject.deleteMany({
        where: { subjectId },
      });
      await tx.specialExamSubject.deleteMany({
        where: { programSubjectId: subjectId },
      });
      await tx.programSubject.delete({
        where: { id: subjectId },
      });
    });

    revalidatePath("/admin-route/special-batch");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting program subject:", error);
    return { success: false, error: error?.message || "Failed to delete subject" };
  }
}

export async function applyProgramCurriculumTemplateAction(
  programId: number,
  templateKey: keyof typeof CURRICULUM_TEMPLATES
) {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    const template = CURRICULUM_TEMPLATES[templateKey];
    if (!template) {
      return { success: false, error: "Template not found" };
    }

    const program = await prisma.program.findUnique({
      where: { id: programId },
    });

    if (!program) {
      return { success: false, error: "Program not found" };
    }

    // Check existing marks before overwriting
    const existingMarks = await prisma.specialMark.count({
      where: { examSubject: { programSubject: { programId } } },
    });

    if (existingMarks > 0) {
      return {
        success: false,
        error: `Cannot replace curriculum: ${existingMarks} exam marks are already recorded for this program. You can add or edit individual subjects instead.`,
      };
    }

    await prisma.$transaction(async (tx) => {
      // Clear existing subjects and optional mappings
      await tx.studentSubject.deleteMany({
        where: { subject: { programId } },
      });
      await tx.specialExamSubject.deleteMany({
        where: { programSubject: { programId } },
      });
      await tx.programSubject.deleteMany({
        where: { programId },
      });

      // Insert template subjects
      for (const subj of template.subjects) {
        await tx.programSubject.create({
          data: {
            programId,
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
    });

    revalidatePath("/admin-route/special-batch");
    return { success: true };
  } catch (error: any) {
    console.error("Error applying curriculum template:", error);
    return { success: false, error: error?.message || "Failed to apply template" };
  }
}
