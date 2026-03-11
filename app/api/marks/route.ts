// app/api/marks/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { hasPermission, type UserRole } from "@/lib/rbac";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role as UserRole, "marks:read")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const marks = await prisma.mark.findMany({
    include: { student: true, examSubject: { include: { exam: true, teacher: true } } },
  });

  return NextResponse.json(marks);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role as UserRole, "marks:write")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { examSubjectId, studentId, written, objective } = body;

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


