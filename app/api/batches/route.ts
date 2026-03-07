// app/api/batches/route.ts
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
  const className = searchParams.get("class"); // e.g., "Seven"

  try {
    const where: any = {};
    
    // ✅ FIX: classId is String in Prisma schema, use className directly
    if (className) {
      where.classId = className; // "Six", "Seven", etc. (NOT 6, 7)
    }

const batches = await prisma.batch.findMany({
  where, // className is String like "Seven"
  select: {
    id: true,
    name: true,
    code: true, // ← Must include code for roll generation
  },
  orderBy: { code: "asc" },
});

    return NextResponse.json(batches);
  } catch (error) {
    console.error("Error fetching batches:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}