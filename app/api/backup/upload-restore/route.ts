import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth-guard";
import { restoreFromBackup, validateBackupData } from "@/lib/services/backup-service";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const confirmation = (formData.get("confirmation") as string) || "";

    if (confirmation.trim() !== "RESTORE") {
      return NextResponse.json(
        { error: "Confirmation failed. You must provide confirmation text 'RESTORE'." },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json({ error: "No backup file uploaded." }, { status: 400 });
    }

    const text = await file.text();
    let payload: any;
    try {
      payload = JSON.parse(text);
    } catch (err: any) {
      return NextResponse.json({ error: `Invalid JSON format: ${err.message}` }, { status: 400 });
    }

    const validation = validateBackupData(payload);
    if (!validation.valid) {
      return NextResponse.json(
        { error: `Backup validation failed: ${validation.errors.join("; ")}`, validation },
        { status: 400 }
      );
    }

    const result = await restoreFromBackup(payload, session.user.username || "admin");

    revalidatePath("/admin-route");
    revalidatePath("/admin-route/backup");
    revalidatePath("/admin-route/dashboard");
    revalidatePath("/admin-route/students");
    revalidatePath("/admin-route/teachers");
    revalidatePath("/admin-route/exams");
    revalidatePath("/admin-route/marks");
    revalidatePath("/admin-route/users");
    revalidatePath("/admin-route/receipts");

    return NextResponse.json({
      success: true,
      message: result.message,
      safetyBackupFilename: result.safetyBackupFilename,
      restoredCounts: result.restoredCounts,
      totalRestored: result.totalRestored,
      durationMs: result.durationMs,
    });
  } catch (error: any) {
    console.error("Upload & restore error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to restore backup from file." },
      { status: 500 }
    );
  }
}
