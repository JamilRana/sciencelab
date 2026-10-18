import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiAuth(["ADMIN", "STAFF", "TEACHER"]);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const exams = await prisma.exam.findMany({
      orderBy: { id: "desc" },
      include: {
        subjects: {
          include: {
            teacher: { select: { id: true, name: true } },
            _count: { select: { marks: true } },
          },
          orderBy: { subject: "asc" },
        },
      },
    });
    return NextResponse.json(exams);
  } catch (error) {
    console.error("Error fetching exams:", error);
    return NextResponse.json({ error: "Failed to fetch exams" }, { status: 500 });
  }
}
