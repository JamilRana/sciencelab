import { NextRequest, NextResponse } from "next/server";
import { requireJobSecret, getCurrentSession } from "@/lib/auth-guard";
import { generateBackupData } from "@/lib/services/backup-service";
import { put, list, del } from "@vercel/blob";

export const dynamic = "force-dynamic";

const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || "30", 10);

export async function GET(request: NextRequest) {
  return handleBackupCron(request);
}

export async function POST(request: NextRequest) {
  return handleBackupCron(request);
}

async function handleBackupCron(request: NextRequest) {
  // 1. Authorization: either valid CRON_SECRET or Admin user session
  const secretCheck = requireJobSecret(request);
  if (!secretCheck.authorized) {
    const session = await getCurrentSession();
    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return (
        secretCheck.errorResponse ||
        NextResponse.json({ error: "Unauthorized: Valid CRON_SECRET or Admin session required" }, { status: 401 })
      );
    }
  }

  const startTime = Date.now();
  console.log(`[Backup Cron] Starting automated backup at ${new Date().toISOString()}...`);

  try {
    // 2. Generate complete data payload across all tables
    const payload = await generateBackupData("system-scheduled-cron");
    const jsonContent = JSON.stringify(payload, null, 2);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `sciencelab_backup_${timestamp}.json`;

    let blobUrl = "";
    const sizeBytes = Buffer.byteLength(jsonContent, "utf8");

    // 3. Upload to Vercel Blob
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`backups/${filename}`, jsonContent, {
        access: "public",
        addRandomSuffix: false,
        contentType: "application/json",
      });
      blobUrl = blob.url;
      console.log(`[Backup Cron] Successfully uploaded to Vercel Blob: ${blob.url} (${(sizeBytes / 1024).toFixed(1)} KB)`);

      // 4. Prune old backups older than RETENTION_DAYS (30 days)
      const { blobs } = await list({ prefix: "backups/" });
      const maxAgeMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;
      const now = Date.now();
      let prunedCount = 0;

      for (const b of blobs) {
        const fileAge = now - new Date(b.uploadedAt).getTime();
        if (fileAge > maxAgeMs) {
          await del(b.url);
          console.log(`[Backup Cron] Pruned expired backup from Blob: ${b.pathname}`);
          prunedCount++;
        }
      }

      const durationMs = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        message: `Backup created and uploaded to Vercel Blob successfully.`,
        filename,
        blobUrl,
        sizeBytes,
        totalRecords: payload.metadata.totalRecords,
        tableCounts: payload.metadata.tableCounts,
        prunedCount,
        durationMs,
      });
    } else {
      console.warn("[Backup Cron] BLOB_READ_WRITE_TOKEN not configured in environment.");
      return NextResponse.json({
        success: false,
        error: "BLOB_READ_WRITE_TOKEN is not configured on Vercel.",
        totalRecords: payload.metadata.totalRecords,
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("[Backup Cron] Error executing backup:", error);
    return NextResponse.json({
      success: false,
      error: error?.message || "Internal server error during backup",
    }, { status: 500 });
  }
}
