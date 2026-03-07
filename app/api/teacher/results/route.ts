import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");

    const teacher = await prisma.teacher.findFirst({
      where: { mobile: session.user.username },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const whereClause: any = { teacherId: teacher.id };
    if (subjectId) {
      whereClause.id = parseInt(subjectId);
    }

    const examSubjects = await prisma.examSubject.findMany({
      where: whereClause,
      include: {
        exam: true,
        marks: { include: { student: true } },
      },
      orderBy: { examDate: "desc" },
    });

    return NextResponse.json(examSubjects);
  } catch (error) {
    console.error("Error fetching teacher results:", error);
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}
