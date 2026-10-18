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
    const classFilter = searchParams.get("class");
    const batchId = searchParams.get("batchId");
    const search = searchParams.get("search");

    const includeInactive = searchParams.get("includeInactive") === "true";
    const whereClause: any = {};
    
    if (!includeInactive) {
      whereClause.active = true;
    }

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
