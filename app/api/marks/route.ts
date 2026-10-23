// app/api/marks/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiAuth(["ADMIN", "STAFF", "TEACHER"]);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  const marks = await prisma.mark.findMany({
    include: { student: true, examSubject: { include: { exam: true, teacher: true } } },
  });

  return NextResponse.json(marks);
}

export async function POST(request: Request) {
  const auth = await requireApiAuth(["ADMIN", "STAFF", "TEACHER"]);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }
  const session = { user: auth.user };

  const body = await request.json();
  const { examSubjectId, studentId, written, objective } = body;

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
      where: { id: parseInt(examSubjectId, 10) },
      select: { teacherId: true },
    });
    if (!teacherId || !subject || subject.teacherId !== teacherId) {
      return NextResponse.json({ error: "You can only enter marks for your assigned subjects." }, { status: 403 });
    }
    const existing = await prisma.mark.findUnique({
      where: {
        examSubjectId_studentId: {
          examSubjectId: parseInt(examSubjectId, 10),
          studentId: parseInt(studentId, 10),
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
        examSubjectId: parseInt(examSubjectId),
        studentId: parseInt(studentId),
      },
    },
    update: {
      written: parseFloat(written),
      objective: parseFloat(objective),
    },
    create: {
      examSubjectId: parseInt(examSubjectId),
      studentId: parseInt(studentId),
      written: parseFloat(written),
      objective: parseFloat(objective),
    },
  });

  return NextResponse.json(mark);
}


