import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const exams = await prisma.exam.findMany({
      orderBy: { id: "desc" },
      select: {
        id: true,
        type: true,
        month: true,
        class: true,
      },
    });
    return NextResponse.json(exams);
  } catch (error) {
    console.error("Error fetching exams:", error);
    return NextResponse.json({ error: "Failed to fetch exams" }, { status: 500 });
  }
}
