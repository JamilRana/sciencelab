//app/api/marks/[examId]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth-guard";
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
  const auth = await requireApiAuth(["ADMIN", "STAFF", "TEACHER"]);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }
  const session = { user: auth.user };

  try {
    const body = await request.json();
    const markData = markSchema.parse(body);

    if (session?.user?.role === "TEACHER") {
      let teacherId = session.user.teacherId;
      if (!teacherId) {
        const teacher = await prisma.teacher.findFirst({
          where: {
            OR: [
              { userId: parseInt(session.user.id, 10) },
              { mobile: session.user.username },
            ],
          },
          select: { id: true },
        });
        teacherId = teacher?.id;
      }
      const subject = await prisma.examSubject.findUnique({
        where: { id: markData.examSubjectId },
        select: { teacherId: true },
      });
      if (!teacherId || !subject || subject.teacherId !== teacherId) {
        return NextResponse.json({ error: "You can only enter marks for your assigned subjects." }, { status: 403 });
      }
      const existing = await prisma.mark.findUnique({
        where: {
          examSubjectId_studentId: {
            examSubjectId: markData.examSubjectId,
            studentId: markData.studentId,
          },
        },
      });
      if (existing) {
        return NextResponse.json({ error: "Teachers cannot edit existing marks." }, { status: 403 });
      }
    }

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
  { params }: { params: Promise<{ examId: string }> }
) {
  const auth = await requireApiAuth(["ADMIN", "STAFF", "TEACHER"]);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const { examId } = await params;
    const examIdNum = parseInt(examId);

    // Fetch exam details with subjects
    const exam = await prisma.exam.findUnique({
      where: { id: examIdNum },
      include: {
        subjects: {
          include: {
            teacher: true,
            marks: {
              where: {
                student: { active: true },
              },
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

    // Fetch all students in the class (regular batches only)
    const students = await prisma.student.findMany({
      where: { class: exam.class, active: true, batch: { programId: null } },
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