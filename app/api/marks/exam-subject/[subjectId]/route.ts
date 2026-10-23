// app/api/marks/exam-subject/[subjectId]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  try {
    const auth = await requireApiAuth(["ADMIN", "STAFF", "TEACHER"]);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }
    const session = { user: auth.user };

    const { subjectId } = await params;
    const examSubjectId = parseInt(subjectId, 10);

    if (isNaN(examSubjectId) || examSubjectId <= 0) {
      return NextResponse.json({ error: "Invalid subject ID" }, { status: 400 });
    }

    // 🔹 Fetch exam subject details
    const subject = await prisma.examSubject.findUnique({
      where: { id: examSubjectId },
      include: {
        exam: { select: { id: true, class: true, type: true, month: true } },
        teacher: { select: { id: true, name: true } },
      },
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    if (session.user.role === "TEACHER") {
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
      if (!teacherId || subject.teacherId !== teacherId) {
        return NextResponse.json({ error: "Unauthorized: not assigned to this subject" }, { status: 403 });
      }
    }

    // 🔹 Fetch all students in the exam's class (regular batches only)
    const students = await prisma.student.findMany({
      where: { class: subject.exam.class, active: true, batch: { programId: null } },
      include: {
        batch: { select: { id: true, name: true, code: true } },
      },
      orderBy: [
        { batch: { code: "asc" } },
        { roll: "asc" },
      ],
    });

    // 🔹 Fetch existing marks for this subject
    const marks = await prisma.mark.findMany({
      where: {
        examSubjectId,
        student: { active: true },
      },
      select: {
        studentId: true,
        written: true,
        objective: true,
      },
    });

    // 🔹 Convert to map for quick lookup
    const marksMap = new Map<number, { written: number; objective: number }>();
    marks.forEach((mark) => {
      marksMap.set(mark.studentId, {
        written: mark.written,
        objective: mark.objective,
      });
    });

    return NextResponse.json({
      success: true,
      subject: {
        id: subject.id,
        subjectName: subject.subject,
        totalMark: subject.totalMark,
        exam: subject.exam,
        teacher: subject.teacher,
      },
      students,
      marksMap: Object.fromEntries(marksMap),
    });
  } catch (error) {
    console.error("Error fetching marks data:", error);
    return NextResponse.json(
      { error: "Failed to fetch marks data" },
      { status: 500 }
    );
  }
}