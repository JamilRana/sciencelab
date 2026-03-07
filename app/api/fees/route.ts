// app/api/fees/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const className = searchParams.get("class");
  const batchId = searchParams.get("batchId"); // ← FIX: Read "batchId" to match component
  const search = searchParams.get("search");

  try {
    const where: any = { active: true };
    
    if (className) where.class = className;
    if (batchId) where.batchId = parseInt(batchId); // Filter by batchId (Int)
    
    if (search) {
      // ✅ FIX: Add roll to search (handle numeric search)
      const searchNum = parseInt(search);
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search } },
        ...(isNaN(searchNum) ? [] : [{ roll: { equals: searchNum } }]), // Search by exact roll
      ].filter(Boolean);
    }

    const students = await prisma.student.findMany({
      where,
      select: {
        id: true,
        name: true,
        roll: true,
        class: true,
        batch: {
          select: {
            id: true,
            name: true,
            code: true, // ← Needed for generated roll display
          }
        },
        receipts: {
          select: { month: true, amount: true },
        },
      },
      orderBy: [{ batch: { code: "asc" } }, { roll: "asc" }],
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching fees data:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}