import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireApiAuth(["ADMIN", "STAFF", "TEACHER"]);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const { searchParams } = new URL(request.url);
    const examId = searchParams.get("examId");

    if (!examId) {
      return NextResponse.json({ error: "Exam ID required" }, { status: 400 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: parseInt(examId) },
      include: { subjects: { select: { id: true, subject: true } } },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const students = await prisma.student.findMany({
      where: { class: exam.class, active: true, batch: { programId: null } },
      include: {
        batch: { select: { id: true, name: true, code: true } },
        marks: {
          where: { examSubject: { examId: parseInt(examId, 10) } },
          select: { examSubjectId: true, written: true, objective: true },
        },
      },
      orderBy: [{ gender: "asc" }, { roll: "asc" }],
    });

    return NextResponse.json({
      subjects: exam.subjects,
      students: students.map(s => ({
        id: s.id,
        name: s.name,
        gender: s.gender,
        roll: s.roll,
        batch: s.batch,
        class: s.class,
        marks: s.marks,
      })),
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}
