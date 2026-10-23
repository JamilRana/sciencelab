// app/api/teacher/results/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await requireApiAuth(["ADMIN", "STAFF", "TEACHER"]);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }
    const session = { user: auth.user };

    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");

    const teacher = await prisma.teacher.findFirst({
      where: {
        OR: [
          { userId: parseInt(session.user.id, 10) },
          { mobile: session.user.username },
        ],
      },
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
        marks: {
          where: { student: { active: true } },
          include: { student: true },
        },
      },
      orderBy: { examDate: "desc" },
    });

    return NextResponse.json(examSubjects);
  } catch (error) {
    console.error("Error fetching teacher results:", error);
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}
