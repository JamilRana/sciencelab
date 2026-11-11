import fs from "fs";
import path from "path";
import { generateBackupData, saveBackupToStorage } from "../lib/services/backup-service";
import { prisma } from "../lib/prisma";

// Default retention: Keep backups for 30 days
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || "30", 10);
const BACKUPS_DIR = path.join(process.cwd(), "backups");

async function runScheduledBackup() {
  console.log(`[${new Date().toISOString()}] Starting scheduled daily backup for sciencelab...`);

  try {
    // 1. Generate full snapshot
    const payload = await generateBackupData("system-scheduled-daily-cron");
    const result = await saveBackupToStorage(payload, "daily_auto_backup");

    console.log(`✓ Backup created successfully: ${result.filename}`);
    console.log(`✓ Total records backed up: ${payload.metadata.totalRecords} across ${Object.keys(payload.metadata.tableCounts).length} tables`);
    console.log(`✓ File size: ${(result.sizeBytes / 1024 / 1024).toFixed(2)} MB`);

    // 2. Cleanup backups older than RETENTION_DAYS
    cleanupOldBackups(RETENTION_DAYS);

    console.log(`[${new Date().toISOString()}] Scheduled daily backup completed.\n`);
  } catch (error) {
    console.error(`❌ Scheduled daily backup failed:`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

function cleanupOldBackups(retentionDays: number) {
  if (!fs.existsSync(BACKUPS_DIR)) return;

  const now = Date.now();
  const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;
  const files = fs.readdirSync(BACKUPS_DIR);

  let deletedCount = 0;

  for (const file of files) {
    if (!file.endsWith(".json")) continue;

    const filePath = path.join(BACKUPS_DIR, file);
    try {
      const stats = fs.statSync(filePath);
      const fileAge = now - stats.mtimeMs;

      if (fileAge > maxAgeMs) {
        fs.unlinkSync(filePath);
        console.log(`- Pruned expired backup older than ${retentionDays} days: ${file}`);
        deletedCount++;
      }
    } catch (e) {
      console.warn(`Could not check/prune backup file ${file}:`, e);
    }
  }

  if (deletedCount > 0) {
    console.log(`Cleaned up ${deletedCount} backup(s) older than ${retentionDays} days.`);
  } else {
    console.log(`No backups older than ${retentionDays} days found.`);
  }
}

runScheduledBackup();
