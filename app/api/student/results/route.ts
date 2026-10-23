import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await requireApiAuth(["ADMIN", "STAFF", "STUDENT"]);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }
    const session = { user: auth.user };

    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { userId: parseInt(session.user.id, 10) },
          { mobile: session.user.username },
          { email: session.user.username },
        ],
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const marks = await prisma.mark.findMany({
      where: { studentId: student.id },
      include: {
        examSubject: {
          include: { exam: true },
        },
      },
    });

    const exams = await prisma.exam.findMany({
      where: { class: student.class },
      include: { subjects: true },
    });

    return NextResponse.json({ student, marks, exams });
  } catch (error) {
    console.error("Error fetching student results:", error);
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}
