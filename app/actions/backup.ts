"use server";

import { requireRole } from "@/lib/auth-guard";
import {
  generateBackupData,
  saveBackupToStorage,
  listStoredBackups,
  getStoredBackup,
  deleteStoredBackup,
  validateBackupData,
  restoreFromBackup,
  getLiveDatabaseStats,
  StoredBackupInfo,
  BackupValidationResult,
  BackupPayload,
} from "@/lib/services/backup-service";
import { revalidatePath } from "next/cache";

/**
 * Gets live record counts and health statistics of the database.
 */
export async function getDatabaseStatsAction() {
  await requireRole("ADMIN");
  try {
    const stats = await getLiveDatabaseStats();
    return { success: true, data: stats };
  } catch (error: any) {
    console.error("Failed to fetch database stats:", error);
    return { success: false, error: error.message || "Failed to fetch database statistics." };
  }
}

/**
 * Lists all stored backup files on the server.
 */
export async function listBackupsAction(): Promise<{
  success: boolean;
  data?: StoredBackupInfo[];
  error?: string;
}> {
  await requireRole("ADMIN");
  try {
    const backups = await listStoredBackups();
    return { success: true, data: backups };
  } catch (error: any) {
    console.error("Failed to list backups:", error);
    return { success: false, error: error.message || "Failed to list backups." };
  }
}

/**
 * Creates a new full database backup and saves it to server storage.
 */
export async function createBackupAction(customPrefix?: string): Promise<{
  success: boolean;
  filename?: string;
  sizeBytes?: number;
  totalRecords?: number;
  error?: string;
}> {
  const session = await requireRole("ADMIN");
  try {
    const prefix = customPrefix ? customPrefix.trim().replace(/[^a-zA-Z0-9_-]/g, "_") : "backup";
    const backupPayload = await generateBackupData(session.username || "admin");
    const saved = await saveBackupToStorage(backupPayload, prefix);

    revalidatePath("/admin-route/backup");
    return {
      success: true,
      filename: saved.filename,
      sizeBytes: saved.sizeBytes,
      totalRecords: backupPayload.metadata.totalRecords,
    };
  } catch (error: any) {
    console.error("Failed to create backup:", error);
    return { success: false, error: error.message || "Failed to generate backup." };
  }
}

/**
 * Deletes a stored backup file from the server.
 */
export async function deleteBackupAction(filename: string): Promise<{
  success: boolean;
  error?: string;
}> {
  await requireRole("ADMIN");
  try {
    await deleteStoredBackup(filename);
    revalidatePath("/admin-route/backup");
    return { success: true };
  } catch (error: any) {
    console.error(`Failed to delete backup ${filename}:`, error);
    return { success: false, error: error.message || "Failed to delete backup file." };
  }
}

/**
 * Validates a backup JSON string or payload.
 */
export async function validateBackupContentAction(
  jsonContent: string
): Promise<BackupValidationResult> {
  await requireRole("ADMIN");
  try {
    const parsed = JSON.parse(jsonContent);
    return validateBackupData(parsed);
  } catch (err: any) {
    return {
      valid: false,
      errors: [`JSON parse error: ${err.message}`],
      warnings: [],
      summary: null,
    };
  }
}

/**
 * Restores the database from a stored backup file.
 */
export async function restoreFromStoredBackupAction(
  filename: string,
  confirmation: string
): Promise<{
  success: boolean;
  message?: string;
  restoredCounts?: Record<string, number>;
  totalRestored?: number;
  safetyBackupFilename?: string;
  error?: string;
}> {
  const session = await requireRole("ADMIN");

  if (confirmation.trim() !== "RESTORE") {
    return {
      success: false,
      error: "Confirmation failed. You must type 'RESTORE' exactly to confirm restoration.",
    };
  }

  try {
    const payload = await getStoredBackup(filename);
    const result = await restoreFromBackup(payload, session.username || "admin");

    revalidatePath("/admin-route");
    revalidatePath("/admin-route/backup");
    revalidatePath("/admin-route/dashboard");
    revalidatePath("/admin-route/students");
    revalidatePath("/admin-route/teachers");
    revalidatePath("/admin-route/exams");
    revalidatePath("/admin-route/marks");
    revalidatePath("/admin-route/users");
    revalidatePath("/admin-route/receipts");

    return {
      success: true,
      message: result.message,
      restoredCounts: result.restoredCounts,
      totalRestored: result.totalRestored,
      safetyBackupFilename: result.safetyBackupFilename,
    };
  } catch (error: any) {
    console.error("Failed to restore from stored backup:", error);
    return { success: false, error: error.message || "Restoration failed." };
  }
}

/**
 * Restores the database from a parsed or uploaded backup payload.
 */
export async function restoreFromPayloadAction(
  payload: BackupPayload,
  confirmation: string
): Promise<{
  success: boolean;
  message?: string;
  restoredCounts?: Record<string, number>;
  totalRestored?: number;
  safetyBackupFilename?: string;
  error?: string;
}> {
  const session = await requireRole("ADMIN");

  if (confirmation.trim() !== "RESTORE") {
    return {
      success: false,
      error: "Confirmation failed. You must type 'RESTORE' exactly to confirm restoration.",
    };
  }

  try {
    const result = await restoreFromBackup(payload, session.username || "admin");

    revalidatePath("/admin-route");
    revalidatePath("/admin-route/backup");
    revalidatePath("/admin-route/dashboard");
    revalidatePath("/admin-route/students");
    revalidatePath("/admin-route/teachers");
    revalidatePath("/admin-route/exams");
    revalidatePath("/admin-route/marks");
    revalidatePath("/admin-route/users");
    revalidatePath("/admin-route/receipts");

    return {
      success: true,
      message: result.message,
      restoredCounts: result.restoredCounts,
      totalRestored: result.totalRestored,
      safetyBackupFilename: result.safetyBackupFilename,
    };
  } catch (error: any) {
    console.error("Failed to restore from payload:", error);
    return { success: false, error: error.message || "Restoration failed." };
  }
}
