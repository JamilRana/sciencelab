import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { hasPermission, type UserRole } from "@/lib/rbac";
import { z } from "zod";

// Validation schema
const markSchema = z.object({
  examSubjectId: z.number(),
  studentId: z.number(),
  written: z.number().min(0).max(100, "Marks must be between 0 and 100"),
  objective: z.number().min(0).max(100, "Marks must be between 0 and 100"),
});

type MarkData = z.infer<typeof markSchema>;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role as UserRole, "marks:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const markData = markSchema.parse(body);

    const mark = await prisma.mark.upsert({
      where: {
        examSubjectId_studentId: {
          examSubjectId: markData.examSubjectId,
          studentId: markData.studentId,
        },
      },
      update: {
        written: markData.written,
        objective: markData.objective,
      },
      create: {
        examSubjectId: markData.examSubjectId,
        studentId: markData.studentId,
        written: markData.written,
        objective: markData.objective,
      },
    });

    return NextResponse.json({ success: true, mark });
  } catch (error) {
    console.error("Error saving mark:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to save mark" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { examId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role as UserRole, "marks:read")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const examId = parseInt(params.examId);

    // Fetch exam details with subjects
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        subjects: {
          include: {
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

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Fetch all students in the class
    const students = await prisma.student.findMany({
      where: { class: exam.class, active: true },
      orderBy: [
        { batch: { code: "asc" } },
        { roll: "asc" },
      ],
    });

    // Organize marks by subject and student for quick lookup
    const marksBySubjectStudent = new Map();
    exam.subjects.forEach((subject) => {
      const subjectMarks = new Map();
      subject.marks.forEach((mark) => {
        subjectMarks.set(mark.studentId, mark);
      });
      marksBySubjectStudent.set(subject.id, subjectMarks);
    });

    return NextResponse.json({
      success: true,
      exam,
      students,
      marksBySubjectStudent,
    });
  } catch (error) {
    console.error("Error fetching marks data:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch data" },
      { status: 500 }
    );
  }
}