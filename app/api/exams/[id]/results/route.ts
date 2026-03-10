// app/api/student-route/exams/[examId]/results/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    // 🔹 Authenticate
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { examId } = await params;
    const { searchParams } = new URL(request.url);
    const studentClass = searchParams.get("class");

    if (!studentClass) {
      return NextResponse.json({ error: "Class required" }, { status: 400 });
    }

    const examIdNum = parseInt(examId, 10);

    // 🔹 Fetch exam with all subjects and marks
    const exam = await prisma.exam.findUnique({
      where: { id: examIdNum },
      include: {
        subjects: {
          include: {
            marks: {
              include: {
                student: {
                  select: {
                    id: true,
                    name: true,
                    batch: { select: { name: true, code: true } },
                    class: true,
                  },
                },
              },
            },
          },
          orderBy: { subject: "asc" },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // 🔹 Verify user's class matches exam class
    if (exam.class !== studentClass) {
      return NextResponse.json({ error: "Unauthorized: Class mismatch" }, { status: 403 });
    }

    // 🔹 Calculate each student's total across all subjects
    const studentMarksMap = new Map<number, any>();

    for (const subject of exam.subjects) {
      for (const mark of subject.marks) {
        // Only include students from same class
        if (mark.student.class !== studentClass) continue;

        const existing = studentMarksMap.get(mark.studentId) || {
          student: mark.student,
          subjectMarks: [],
          total: 0,
        };

        const subjectTotal = mark.written + mark.objective;
        existing.subjectMarks.push({
          subject: subject.subject,
          written: mark.written,
          objective: mark.objective,
          total: subjectTotal,
          totalMark: subject.totalMark,
        });
        existing.total += subjectTotal;

        studentMarksMap.set(mark.studentId, existing);
      }
    }

    // 🔹 Convert to array
    const results = Array.from(studentMarksMap.values()).map((item) => ({
      student: {
        id: item.student.id,
        name: item.student.name,
        batch: item.student.batch,
      },
      subjectMarks: item.subjectMarks,
      total: item.total,
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching exam results:", error);
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}