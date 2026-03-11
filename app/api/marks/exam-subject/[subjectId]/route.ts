// app/api/marks/exam-subject/[subjectId]/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ subjectId: string }> }
) {
  try {
    // 🔹 Authenticate
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "STAFF", "TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // 🔹 Fetch all students in the exam's class
    const students = await prisma.student.findMany({
      where: { class: subject.exam.class, active: true },
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
      where: { examSubjectId },
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