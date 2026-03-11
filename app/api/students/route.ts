import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classFilter = searchParams.get("class");
    const batchId = searchParams.get("batchId");
    const search = searchParams.get("search");

    const whereClause: any = {};
    
    if (classFilter) {
      whereClause.class = classFilter;
    }
    
    if (batchId) {
      whereClause.batchId = parseInt(batchId);
    }

    if (search) {
      const searchNum = parseInt(search);
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search } },
        ...(isNaN(searchNum) ? [] : [{ roll: { equals: searchNum } }]),
      ].filter(Boolean);
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        batch: { select: { id: true, name: true, code: true } },
        school: { select: { id: true, name: true } },
      },
      orderBy: [{ batch: { code: "asc" } }, { roll: "asc" }],
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}
