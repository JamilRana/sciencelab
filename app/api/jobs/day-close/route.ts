import { NextRequest, NextResponse } from "next/server";
import { requireJobSecret, getCurrentSession } from "@/lib/auth-guard";
import { runDayCloseJob } from "@/lib/day-close";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return handleJob(request);
}

export async function POST(request: NextRequest) {
  return handleJob(request);
}

async function handleJob(request: NextRequest) {
  const secretCheck = requireJobSecret(request);
  if (!secretCheck.authorized) {
    const session = await getCurrentSession();
    if (!session?.user?.role || !["ADMIN", "STAFF"].includes(session.user.role)) {
      return (
        secretCheck.errorResponse ||
        NextResponse.json({ error: "Unauthorized: Valid job secret or Admin session required" }, { status: 401 })
      );
    }
  }

  try {
    const { searchParams } = new URL(request.url);
    const cutoffDate = searchParams.get("cutoffDate") || searchParams.get("date") || undefined;
    const forceDate = searchParams.get("forceDate") || undefined;

    const result = await runDayCloseJob({ cutoffDate, forceDate });

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error: any) {
    console.error("[api/jobs/day-close] Job execution error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
