"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

/* ----------------------------------------
   Types: Exam Summary (Card View)
---------------------------------------- */

export type ExamSummary = {
  id: number;
  type: string;
  month: string;
  class: string;
  subjectCount: number;
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  position: number | null;
  totalStudents: number;
};

export type ExamSummariesResponse = {
  student: {
    id: number;
    name: string;
    class: string;
    roll: number;
    batch: { name: string };
    school: { name: string };
  };
  exams: ExamSummary[];
};

/* ----------------------------------------
   Types: Detailed Exam Result (Modal View)
---------------------------------------- */

export type SubjectDetail = {
  id: number;
  subject: string;
  teacher: string;
  totalMark: number;
  written: number;
  objective: number;
  total: number;
  position: number | null;
  totalStudents: number;
};

export type ExamDetailResponse = {
  student: {
    id: number;
    name: string;
    class: string;
    roll: number;
    batch: { name: string };
    school: { name: string };
  };
  exam: {
    id: number;
    type: string;
    month: string;
    class: string;
  };
  subjects: SubjectDetail[];
  overallTotal: number;
  overallMax: number;
  overallPercentage: string;
};

/* ----------------------------------------
   Helper: Get studentId from session
---------------------------------------- */

async function getStudentIdFromSession(): Promise<number> {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "STUDENT") {
    throw new Error("Unauthorized: Student session required");
  }
  
  const studentId = session.user.studentId;
  
  if (!studentId) {
    throw new Error("Student ID not found in session");
  }
  
  return studentId;
}

/* ----------------------------------------
   Action 1: Get Exam Summaries (Card View)
   Returns list of exams with basic stats
---------------------------------------- */

export async function getStudentExamSummariesAction(): Promise<ExamSummariesResponse> {
  const studentId = await getStudentIdFromSession();

  // 🔹 Fetch student
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { batch: true, school: true },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  // 🔹 Fetch exams for this class
  const exams = await prisma.exam.findMany({
    where: { class: student.class },
    include: {
      subjects: {
        include: {
          marks: {
            where: { studentId: studentId },
            select: { written: true, objective: true, examSubjectId: true },
          },
        },
      },
    },
    orderBy: [{ month: "desc" }, { type: "desc" }],
  });

  // 🔹 Pre-fetch active classmates for position calculation
  const classmates = await prisma.student.findMany({
    where: { class: student.class, active: true },
    select: { id: true, name: true },
  });
  const classmateIds = classmates.map((c) => c.id);

  // 🔹 Build exam summaries
  const examSummaries: ExamSummary[] = [];

  for (const exam of exams) {
    const subjects = exam.subjects;

    // Calculate my total marks
    const myTotalMarks = subjects.reduce((sum, sub) => {
      const mark = sub.marks[0];
      return sum + (mark ? mark.written + mark.objective : 0);
    }, 0);

    const maxMarks = subjects.reduce((sum, sub) => sum + sub.totalMark, 0);
    const percentage = maxMarks > 0 ? (myTotalMarks / maxMarks) * 100 : 0;

    // 🔹 Calculate competition-style position
    let position: number | null = null;
    let totalStudents = 0;

    if (subjects.length > 0 && classmateIds.length > 0) {
      const allMarks = await prisma.mark.findMany({
        where: {
          examSubjectId: { in: subjects.map((s) => s.id) },
          studentId: { in: classmateIds },
        },
        select: { studentId: true, written: true, objective: true },
      });

      // Aggregate totals per student
      const studentTotals = new Map<number, number>();
      for (const mark of allMarks) {
        const prev = studentTotals.get(mark.studentId) || 0;
        studentTotals.set(
          mark.studentId,
          prev + mark.written + mark.objective
        );
      }

      // Sort descending and calculate position
      const sorted = Array.from(studentTotals.entries())
        .map(([id, total]) => ({ id, total }))
        .sort((a, b) => b.total - a.total);

      totalStudents = sorted.length;
      
      if (totalStudents > 0) {
        position = getCompetitionPosition(
          sorted.map((s) => ({ studentId: s.id, total: s.total })),
          studentId,
          myTotalMarks
        );
      }
    }

    examSummaries.push({
      id: exam.id,
      type: exam.type,
      month: exam.month,
      class: exam.class,
      subjectCount: subjects.length,
      totalMarks: myTotalMarks,
      maxMarks,
      percentage: parseFloat(percentage.toFixed(1)),
      position,
      totalStudents,
    });
  }

  return {
    student: {
      id: student.id,
      name: student.name,
      class: student.class,
      roll: student.roll,
      batch: student.batch,
      school: student.school,
    },
    exams: examSummaries,
  };
}

/* ----------------------------------------
   Action 2: Get Detailed Exam Result (Modal)
   Returns full result sheet for one exam
---------------------------------------- */

export async function getStudentExamDetailAction(
  examId: number
): Promise<ExamDetailResponse> {
  const studentId = await getStudentIdFromSession();

  // 🔹 Fetch student
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { batch: true, school: true },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  // 🔹 Fetch exam with subjects and marks
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      subjects: {
        include: {
          teacher: { select: { name: true } },
          marks: {
            include: {
              student: { select: { id: true, name: true, class: true } },
            },
          },
        },
      },
    },
  });

  if (!exam) {
    throw new Error("Exam not found");
  }

  // 🔹 Calculate subject-wise results with positions
  const subjectsWithPosition: SubjectDetail[] = exam.subjects.map((subject) => {
    // Filter to same class only
    const classMarks = subject.marks.filter(
      (m) => m.student.class === student.class
    );

    // Rank students by total score
    const ranked = classMarks
      .map((m) => ({
        studentId: m.studentId,
        total: m.written + m.objective,
      }))
      .sort((a, b) => b.total - a.total);

    // Find my mark and position
    const myMark = subject.marks.find((m) => m.studentId === studentId);
    const myTotal = myMark ? myMark.written + myMark.objective : 0;
    const position = getCompetitionPosition(ranked, studentId, myTotal);

    return {
      id: subject.id,
      subject: subject.subject,
      teacher: subject.teacher.name,
      totalMark: subject.totalMark,
      written: myMark?.written ?? 0,
      objective: myMark?.objective ?? 0,
      total: myTotal,
      position,
      totalStudents: ranked.length,
    };
  });

  // 🔹 Calculate overall stats
  const overallTotal = subjectsWithPosition.reduce(
    (sum, s) => sum + s.total,
    0
  );
  const overallMax = subjectsWithPosition.reduce(
    (sum, s) => sum + s.totalMark,
    0
  );

  return {
    student: {
      id: student.id,
      name: student.name,
      class: student.class,
      roll: student.roll,
      batch: student.batch,
      school: student.school,
    },
    exam: {
      id: exam.id,
      type: exam.type,
      month: exam.month,
      class: exam.class,
    },
    subjects: subjectsWithPosition,
    overallTotal,
    overallMax,
    overallPercentage:
      overallMax > 0
        ? ((overallTotal / overallMax) * 100).toFixed(2)
        : "0.00",
  };
}

/* ----------------------------------------
   Helper: Competition Ranking (1,1,3,4...)
   Ties get same position, next rank skips
---------------------------------------- */

function getCompetitionPosition(
  ranked: Array<{ studentId: number; total: number }>,
  targetStudentId: number,
  targetTotal: number
): number | null {
  if (ranked.length === 0) return null;

  let position = 1;
  
  for (let i = 0; i < ranked.length; i++) {
    const entry = ranked[i];
    
    if (entry.studentId === targetStudentId) {
      return position;
    }
    
    // Update position only when score drops (handles ties)
    if (i < ranked.length - 1 && ranked[i + 1].total < entry.total) {
      position = i + 2;
    }
  }
  
  return position;
}

/* ----------------------------------------
   Optional: Get Filter Options for Student
---------------------------------------- */

export async function getStudentResultFiltersAction() {
  const studentId = await getStudentIdFromSession();

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { class: true },
  });

  if (!student) throw new Error("Student not found");

  const [months, types] = await Promise.all([
    prisma.exam
      .findMany({
        where: { class: student.class },
        select: { month: true },
        distinct: ["month"],
        orderBy: { month: "asc" },
      })
      .then((r) => r.map((x) => x.month)),
    prisma.exam
      .findMany({
        where: { class: student.class },
        select: { type: true },
        distinct: ["type"],
      })
      .then((r) => r.map((x) => x.type)),
  ]);

  return { months: ["All", ...months], types: ["All", ...types] };
}