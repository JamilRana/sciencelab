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
      // Try to parse as number first
      const searchNum = parseInt(search);
      
      // Get all students and filter by display roll (batch code + roll)
      // This is done in memory since we need to access batch code
      const allStudents = await prisma.student.findMany({
        where,
        select: {
          id: true,
          name: true,
          roll: true,
          class: true,
          mobile: true,
          batch: { select: { code: true } },
          receipts: { select: { month: true, amount: true } },
        },
      });

      // Filter by search term
      const filtered = allStudents.filter(s => {
        const q = search.toLowerCase();
        // Name or mobile match
        if (s.name.toLowerCase().includes(q) || s.mobile.includes(search)) return true;
        // Exact roll match
        if (!isNaN(searchNum) && s.roll === searchNum) return true;
        // Display roll match (e.g., "6101" = batch 61, roll 1)
        const displayRoll = `${s.batch?.code || ''}${s.roll.toString().padStart(2, '0')}`;
        if (displayRoll.includes(search)) return true;
        return false;
      });

      return NextResponse.json(filtered);
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