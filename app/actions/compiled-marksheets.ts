"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import {
  calculateCompiledMarksheetResults,
  CompiledMarksheetExamItem,
  StudentExamMarkDetail,
  StudentRosterItem,
  ProcessedCompiledMarksheet,
} from "@/lib/special-batch-results";

export interface CreateCompiledMarksheetInput {
  programId: number;
  batchId?: number;
  title: string;
  description?: string;
  examIds: number[];
}

export async function createCompiledMarksheetAction(input: CreateCompiledMarksheetInput) {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    const { programId, batchId, title, description, examIds } = input;

    if (!programId || !title.trim() || !examIds || examIds.length === 0) {
      return { success: false, error: "Please select exams and provide a title" };
    }

    const compiled = await prisma.$transaction(async (tx) => {
      const marksheet = await tx.compiledMarksheet.create({
        data: {
          programId,
          batchId: batchId || null,
          title: title.trim(),
          description: description?.trim() || "",
        },
      });

      for (let i = 0; i < examIds.length; i++) {
        await tx.compiledMarksheetExam.create({
          data: {
            compiledMarksheetId: marksheet.id,
            specialExamId: examIds[i],
            sortOrder: i + 1,
          },
        });
      }

      return marksheet;
    });

    revalidatePath("/admin-route/special-batch");
    return { success: true, data: compiled };
  } catch (error) {
    console.error("Error creating compiled marksheet:", error);
    return { success: false, error: "Failed to create compiled marksheet" };
  }
}

export async function getCompiledMarksheetsAction(programId?: number) {
  try {
    await requireRole(["ADMIN", "STAFF", "TEACHER", "STUDENT"]);
    const where = programId ? { programId } : {};

    const list = await prisma.compiledMarksheet.findMany({
      where,
      include: {
        program: { select: { id: true, name: true, code: true } },
        batch: { select: { id: true, name: true, code: true } },
        exams: {
          include: {
            specialExam: {
              select: {
                id: true,
                title: true,
                lectureNo: true,
                lectureLabel: true,
                subjects: {
                  select: { totalMax: true },
                },
              },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const enriched = list.map((item) => {
      const totalPossibleMarks = item.exams.reduce((sum, e) => {
        const subTotal = e.specialExam.subjects.reduce((sSum, s) => sSum + s.totalMax, 0);
        return sum + subTotal;
      }, 0);

      return {
        ...item,
        examCount: item.exams.length,
        totalPossibleMarks,
      };
    });

    return { success: true, data: enriched };
  } catch (error) {
    console.error("Error fetching compiled marksheets:", error);
    return { success: false, error: "Failed to load compiled marksheets", data: [] };
  }
}

export async function getCompiledMarksheetDetailsAction(
  compiledMarksheetId: number,
  sectionFilter?: "ALL" | "BOYS" | "GIRLS"
) {
  try {
    await requireRole(["ADMIN", "STAFF", "TEACHER", "STUDENT"]);
    const marksheet = await prisma.compiledMarksheet.findUnique({
      where: { id: compiledMarksheetId },
      include: {
        program: true,
        batch: true,
        exams: {
          include: {
            specialExam: {
              include: {
                subjects: {
                  include: {
                    programSubject: true,
                    marks: {
                      include: {
                        student: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!marksheet) {
      return { success: false, error: "Compiled marksheet not found" };
    }

    // 1. Resolve Roster of Students
    const programId = marksheet.programId;
    const batchId = marksheet.batchId;

    let students = await prisma.student.findMany({
      where: {
        active: true,
        ...(batchId ? { batchId } : { batch: { programId } }),
      },
      orderBy: [{ batch: { code: "asc" } }, { roll: "asc" }],
      include: {
        school: true,
        batch: true,
      },
    });

    // Apply Section Filter if requested
    if (sectionFilter && sectionFilter !== "ALL") {
      students = students.filter((stu) => {
        if (sectionFilter === "BOYS") {
          return stu.gender === "Male" || stu.batch?.name?.toLowerCase().includes("boy");
        } else if (sectionFilter === "GIRLS") {
          return stu.gender === "Female" || stu.batch?.name?.toLowerCase().includes("girl");
        }
        return true;
      });
    }

    // Map roster
    const roster: StudentRosterItem[] = students.map((stu) => {
      const batchCode = stu.batch?.code || 0;
      const displayRoll = batchCode ? batchCode * 100 + stu.roll : stu.roll;

      return {
        id: stu.id,
        name: stu.name,
        roll: stu.roll,
        displayRoll,
        class: stu.class,
        batchName: stu.batch?.name,
        section: (stu.gender === "Male" || stu.batch?.name?.toLowerCase().includes("boy")) ? "BOYS" : "GIRLS",
        schoolName: stu.school?.name,
      };
    });

    // 2. Prepare Exams list
    const examsList: CompiledMarksheetExamItem[] = marksheet.exams.map((ce) => {
      const exam = ce.specialExam;
      const maxMark = exam.subjects.reduce((sum, s) => sum + s.totalMax, 0) || 100;

      return {
        id: exam.id,
        title: exam.title,
        lectureNo: exam.lectureNo,
        lectureLabel: exam.lectureLabel,
        maxMark,
        sortOrder: ce.sortOrder,
      };
    });

    // 3. Assemble Marks Matrix [studentId][examId]
    const marksMatrix: Record<number, Record<number, StudentExamMarkDetail>> = {};

    students.forEach((stu) => {
      marksMatrix[stu.id] = {};

      marksheet.exams.forEach((ce) => {
        const exam = ce.specialExam;
        let examObtained = 0;
        let isAbsent = false;
        let hasMarkRecord = false;

        exam.subjects.forEach((subj) => {
          const markRecord = subj.marks.find((m) => m.studentId === stu.id);
          if (markRecord) {
            hasMarkRecord = true;
            if (markRecord.isAbsent) {
              isAbsent = true;
            } else {
              examObtained += markRecord.total || (markRecord.cq + markRecord.mcq + markRecord.practical);
            }
          }
        });

        marksMatrix[stu.id][exam.id] = {
          mark: isAbsent ? 0 : examObtained,
          isAbsent,
          isUnmarked: !hasMarkRecord,
        };
      });
    });

    // 4. Compute Ungraded Matrix & Competition Ranking (1, 1, 3...)
    const processed = calculateCompiledMarksheetResults(roster, examsList, marksMatrix);

    return {
      success: true,
      data: {
        marksheet,
        processed,
      },
    };
  } catch (error) {
    console.error("Error loading compiled marksheet details:", error);
    return { success: false, error: "Failed to generate compiled marksheet" };
  }
}

export async function deleteCompiledMarksheetAction(id: number) {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    await prisma.compiledMarksheet.delete({
      where: { id },
    });
    revalidatePath("/admin-route/special-batch");
    return { success: true };
  } catch (error) {
    console.error("Error deleting compiled marksheet:", error);
    return { success: false, error: "Failed to delete compiled marksheet" };
  }
}
