import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth-guard";
import { generateBackupData, getStoredBackup } from "@/lib/services/backup-service";

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filenameParam = searchParams.get("filename");

    let payload: any;
    let downloadFilename: string;

    if (filenameParam) {
      // Validate filename to prevent path traversal
      if (!/^[a-zA-Z0-9_\-\.]+\.json$/.test(filenameParam)) {
        return NextResponse.json({ error: "Invalid filename format." }, { status: 400 });
      }
      payload = await getStoredBackup(filenameParam);
      downloadFilename = filenameParam;
    } else {
      // Generate live backup on demand
      payload = await generateBackupData(session.user.username || "admin");
      const dateStr = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19);
      downloadFilename = `sciencelab_backup_${dateStr}.json`;
    }

    const jsonString = JSON.stringify(payload, null, 2);

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${downloadFilename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Download backup error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to download backup." },
      { status: 500 }
    );
  }
}
