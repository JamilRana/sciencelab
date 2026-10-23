import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth-guard";
import { validateBackupData, getLiveDatabaseStats } from "@/lib/services/backup-service";

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
    }

    const contentType = request.headers.get("content-type") || "";
    let payload: any;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }
      const text = await file.text();
      try {
        payload = JSON.parse(text);
      } catch (err: any) {
        return NextResponse.json(
          {
            valid: false,
            errors: [`Invalid JSON file: ${err.message}`],
            warnings: [],
            summary: null,
          },
          { status: 200 }
        );
      }
    } else {
      payload = await request.json();
    }

    const validation = validateBackupData(payload);
    const liveStats = await getLiveDatabaseStats();

    return NextResponse.json({
      ...validation,
      liveDatabase: liveStats,
    });
  } catch (error: any) {
    console.error("Backup validation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to validate backup" },
      { status: 500 }
    );
  }
}
