"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { 
  calculateBoardStandardResults, 
  ProcessedStudentExamResult,
  StudentRosterItem,
  SubjectMarkEntry 
} from "@/lib/special-batch-results";

export interface CreateSpecialExamInput {
  programId: number;
  batchId?: number;
  title: string;
  kind: "CLASS_TEST" | "PRE_MODEL" | "MODEL_TEST" | "BOARD_EXAM";
  lectureNo?: number;
  lectureLabel?: string;
  examDate: Date | string;
  subjects: {
    programSubjectId: number;
    isCompulsory?: boolean; // Defined by test creator (compulsory vs optional)
    cqMax?: number;
    mcqMax?: number;
    practicalMax?: number;
    totalMax: number;
    teacherId?: number;
  }[];
}

export async function createSpecialExamAction(input: CreateSpecialExamInput) {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    const { programId, batchId, title, kind, lectureNo, lectureLabel, examDate, subjects } = input;

    const exam = await prisma.$transaction(async (tx) => {
      const createdExam = await tx.specialExam.create({
        data: {
          programId,
          batchId: batchId || null,
          title,
          kind,
          lectureNo: lectureNo ?? null,
          lectureLabel: lectureLabel ?? null,
          examDate: new Date(examDate),
          status: "SCHEDULED",
        },
      });

      for (const subj of subjects) {
        await tx.specialExamSubject.create({
          data: {
            examId: createdExam.id,
            programSubjectId: subj.programSubjectId,
            teacherId: subj.teacherId || null,
            isCompulsory: subj.isCompulsory !== undefined ? subj.isCompulsory : true,
            cqMax: subj.cqMax || 0,
            mcqMax: subj.mcqMax || 0,
            practicalMax: subj.practicalMax || 0,
            totalMax: subj.totalMax || 100,
          },
        });
      }

      return createdExam;
    });

    revalidatePath("/admin-route/exams");
    revalidatePath("/admin-route/special-batch");
    return { success: true, data: exam };
  } catch (error) {
    console.error("Error creating special exam:", error);
    return { success: false, error: "Failed to schedule special exam" };
  }
}

export interface BatchCreateLectureExamsInput {
  programId: number;
  batchId?: number;
  programSubjectId: number;
  lectureStart: number;
  lectureEnd: number;
  prefix?: string;
  defaultMaxMark: number;
  startDate?: Date | string;
}

export async function batchCreateLectureExamsAction(input: BatchCreateLectureExamsInput) {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    const {
      programId,
      batchId,
      programSubjectId,
      lectureStart,
      lectureEnd,
      prefix = "L",
      defaultMaxMark = 20,
      startDate = new Date(),
    } = input;

    if (lectureStart > lectureEnd) {
      return { success: false, error: "Start lecture number must be <= end lecture number" };
    }

    const programSubject = await prisma.programSubject.findUnique({
      where: { id: programSubjectId },
    });

    if (!programSubject) return { success: false, error: "Subject not found" };

    const created = await prisma.$transaction(async (tx) => {
      const exams: any[] = [];
      const baseDate = new Date(startDate);

      for (let num = lectureStart; num <= lectureEnd; num++) {
        const examDate = new Date(baseDate);
        examDate.setDate(baseDate.getDate() + (num - lectureStart) * 2);

        const exam = await tx.specialExam.create({
          data: {
            programId,
            batchId: batchId || null,
            title: `${programSubject.name} [${prefix}-${String(num).padStart(2, "0")}]`,
            kind: "CLASS_TEST",
            lectureNo: num,
            lectureLabel: `${prefix}-${num}`,
            examDate,
            status: "SCHEDULED",
          },
        });

        await tx.specialExamSubject.create({
          data: {
            examId: exam.id,
            programSubjectId,
            isCompulsory: true,
            totalMax: defaultMaxMark,
            cqMax: 0,
            mcqMax: 0,
            practicalMax: 0,
          },
        });

        exams.push(exam);
      }
      return exams;
    });

    revalidatePath("/admin-route/exams");
    revalidatePath("/admin-route/special-batch");
    return { success: true, count: created.length };
  } catch (error) {
    console.error("Error batch creating lecture exams:", error);
    return { success: false, error: "Failed to batch create lecture exams" };
  }
}

export async function deleteSpecialExamAction(examId: number) {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    await prisma.specialExam.delete({
      where: { id: examId },
    });
    revalidatePath("/admin-route/exams");
    revalidatePath("/admin-route/special-batch");
    return { success: true };
  } catch (error) {
    console.error("Error deleting special exam:", error);
    return { success: false, error: "Failed to delete exam" };
  }
}

export async function getSpecialExamsAction(programId?: number) {
  try {
    await requireRole(["ADMIN", "STAFF", "TEACHER"]);
    const exams = await prisma.specialExam.findMany({
      where: programId ? { programId } : {},
      include: {
        program: { select: { id: true, name: true, code: true } },
        batch: { select: { id: true, name: true, code: true } },
        subjects: {
          include: {
            programSubject: true,
            teacher: { select: { id: true, name: true } },
            _count: { select: { marks: true } },
          },
        },
      },
      orderBy: { examDate: "desc" },
    });

    return { success: true, data: exams };
  } catch (error) {
    console.error("Error fetching special exams:", error);
    return { success: false, error: "Failed to fetch exams", data: [] };
  }
}

export async function getSpecialExamDetailsAction(examId: number) {
  try {
    await requireRole(["ADMIN", "STAFF", "TEACHER", "STUDENT"]);
    const exam = await prisma.specialExam.findUnique({
      where: { id: examId },
      include: {
        program: {
          include: {
            subjects: true,
          },
        },
        batch: {
          include: {
            students: {
              where: { active: true },
              orderBy: { roll: "asc" },
              include: {
                studentSubjects: true,
                school: true,
              },
            },
          },
        },
        subjects: {
          include: {
            programSubject: true,
            teacher: true,
            marks: {
              include: {
                student: true,
              },
            },
          },
        },
      },
    });

    if (!exam) return { success: false, error: "Exam not found" };

    if (!exam.batch) {
      const allStudents = await prisma.student.findMany({
        where: {
          active: true,
          batch: { programId: exam.programId },
        },
        orderBy: [{ batch: { code: "asc" } }, { roll: "asc" }],
        include: {
          studentSubjects: true,
          school: true,
          batch: true,
        },
      });
      (exam as any).allStudents = allStudents;
    }

    return { success: true, data: exam };
  } catch (error) {
    console.error("Error getting special exam details:", error);
    return { success: false, error: "Failed to load exam details" };
  }
}

export interface SaveSpecialMarksInput {
  specialExamSubjectId: number;
  marks: {
    studentId: number;
    cq: number;
    mcq: number;
    practical: number;
    total: number;
    isAbsent: boolean;
  }[];
}

export async function saveSpecialMarksAction(input: SaveSpecialMarksInput) {
  try {
    const session = await requireRole(["ADMIN", "STAFF", "TEACHER"]);
    const { specialExamSubjectId, marks } = input;

    const subject = await prisma.specialExamSubject.findUnique({
      where: { id: specialExamSubjectId },
      include: {
        exam: true,
      },
    });

    if (!subject) {
      return { success: false, error: "Exam subject not found" };
    }

    if (session.role === "TEACHER") {
      const teacher = await prisma.teacher.findFirst({
        where: { userId: parseInt(session.id, 10) },
      });
      if (!teacher || (subject.teacherId && subject.teacherId !== teacher.id)) {
        return { success: false, error: "You are not authorized to record marks for this subject" };
      }
    }

    const validatedMarks: {
      studentId: number;
      cq: number;
      mcq: number;
      practical: number;
      total: number;
      isAbsent: boolean;
    }[] = [];

    const isMultiComponent = (subject.cqMax > 0 && subject.mcqMax > 0) || subject.practicalMax > 0;

    for (const m of marks) {
      if (m.isAbsent) {
        validatedMarks.push({
          studentId: m.studentId,
          cq: 0,
          mcq: 0,
          practical: 0,
          total: 0,
          isAbsent: true,
        });
        continue;
      }

      const cq = Number(m.cq) || 0;
      const mcq = Number(m.mcq) || 0;
      const practical = Number(m.practical) || 0;

      if (cq < 0 || mcq < 0 || practical < 0) {
        return { success: false, error: "Marks cannot be negative" };
      }

      if (subject.cqMax > 0 && cq > subject.cqMax) {
        return { success: false, error: `CQ marks (${cq}) exceed maximum permitted (${subject.cqMax})` };
      }
      if (subject.mcqMax > 0 && mcq > subject.mcqMax) {
        return { success: false, error: `MCQ marks (${mcq}) exceed maximum permitted (${subject.mcqMax})` };
      }
      if (subject.practicalMax > 0 && practical > subject.practicalMax) {
        return { success: false, error: `Practical marks (${practical}) exceed maximum permitted (${subject.practicalMax})` };
      }

      let computedTotal = 0;
      if (isMultiComponent) {
        computedTotal = cq + mcq + practical;
      } else if (subject.cqMax > 0) {
        computedTotal = cq;
      } else if (subject.mcqMax > 0) {
        computedTotal = mcq;
      } else {
        const singleMark = Number(m.total ?? m.cq) || 0;
        if (singleMark < 0) {
          return { success: false, error: "Marks cannot be negative" };
        }
        computedTotal = singleMark;
      }

      if (computedTotal > subject.totalMax) {
        return { success: false, error: `Total marks (${computedTotal}) exceed subject maximum (${subject.totalMax})` };
      }

      validatedMarks.push({
        studentId: m.studentId,
        cq: isMultiComponent || subject.cqMax > 0 ? cq : computedTotal,
        mcq: isMultiComponent || subject.mcqMax > 0 ? mcq : 0,
        practical: isMultiComponent || subject.practicalMax > 0 ? practical : 0,
        total: computedTotal,
        isAbsent: false,
      });
    }

    await prisma.$transaction(
      validatedMarks.map((m) =>
        prisma.specialMark.upsert({
          where: {
            specialExamSubjectId_studentId: {
              specialExamSubjectId,
              studentId: m.studentId,
            },
          },
          update: {
            cq: m.cq,
            mcq: m.mcq,
            practical: m.practical,
            total: m.total,
            isAbsent: m.isAbsent,
          },
          create: {
            specialExamSubjectId,
            studentId: m.studentId,
            cq: m.cq,
            mcq: m.mcq,
            practical: m.practical,
            total: m.total,
            isAbsent: m.isAbsent,
          },
        })
      )
    );

    revalidatePath("/admin-route/marks");
    return { success: true };
  } catch (error: any) {
    console.error("Error saving special marks:", error);
    return { success: false, error: error.message || "Failed to save marks" };
  }
}

export async function getSpecialExamResultsAction(examId: number) {
  try {
    await requireRole(["ADMIN", "STAFF", "TEACHER", "STUDENT"]);
    const examDetails = await getSpecialExamDetailsAction(examId);
    if (!examDetails.success || !examDetails.data) {
      return { success: false, error: "Exam data not found" };
    }

    const exam = examDetails.data;
    let students = exam.batch?.students || [];

    // If exam has no specific batch, fetch active students across all batches in this program
    if (!exam.batchId) {
      students = await prisma.student.findMany({
        where: {
          active: true,
          batch: { programId: exam.programId },
        },
        orderBy: [{ batch: { code: "asc" } }, { roll: "asc" }],
        include: {
          studentSubjects: true,
          school: true,
          batch: true,
        },
      });
    }

    // Map subjects to subjectsConfig including creator-defined isCompulsory
    const subjectsConfig = exam.subjects.map((s) => ({
      id: s.id,
      name: s.programSubject.name,
      code: s.programSubject.code || undefined,
      combinedGroup: s.programSubject.combinedGroupId || undefined,
      isCompulsory: s.isCompulsory, // Defined by test creator (compulsory vs optional)
      maxMark: s.totalMax || 100,
      sortOrder: s.programSubject.sortOrder,
    }));

    // Map roster
    const roster: StudentRosterItem[] = students.map((stu) => {
      const optSubject = stu.studentSubjects.find((ss) => ss.isOptional);
      const matchingSpecialSub = optSubject
        ? exam.subjects.find((s) => s.programSubjectId === optSubject.subjectId)
        : null;

      const batchCode = (stu as any).batch?.code || exam.batch?.code || 0;
      const displayRoll = batchCode ? batchCode * 100 + stu.roll : stu.roll;

      return {
        id: stu.id,
        name: stu.name,
        roll: stu.roll,
        displayRoll,
        class: stu.class,
        batchName: (stu as any).batch?.name || exam.batch?.name,
        schoolName: stu.school?.name,
        optionalSubjectId: matchingSpecialSub?.id || null,
      };
    });

    // Map marksMap [studentId][subjectId]
    const marksMap: Record<number, Record<number, SubjectMarkEntry>> = {};
    students.forEach((stu) => {
      marksMap[stu.id] = {};
      exam.subjects.forEach((s) => {
        const mark = s.marks.find((m) => m.studentId === stu.id);
        const isOpt = roster.find((r) => r.id === stu.id)?.optionalSubjectId === s.id;

        marksMap[stu.id][s.id] = {
          subjectId: s.id,
          subjectName: s.programSubject.name,
          code: s.programSubject.code || undefined,
          combinedGroup: s.programSubject.combinedGroupId || undefined,
          isOptional: isOpt,
          isCompulsory: s.isCompulsory,
          maxMark: s.totalMax || 100,
          written: mark?.cq || 0,
          objective: mark?.mcq || 0,
          single: mark?.total || (mark ? mark.cq + mark.mcq + mark.practical : 0),
          absent: mark?.isAbsent ?? false,
        };
      });
    });

    const isGraded = exam.kind === "MODEL_TEST";
    const meritList = calculateBoardStandardResults(roster, marksMap, subjectsConfig);

    return {
      success: true,
      data: {
        exam,
        isGraded,
        meritList,
        subjectsConfig,
      },
    };
  } catch (error) {
    console.error("Error generating exam results:", error);
    return { success: false, error: "Failed to generate results" };
  }
}
