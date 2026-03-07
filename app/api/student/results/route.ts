import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const student = await prisma.student.findFirst({
      where: { mobile: session.user.username },
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
