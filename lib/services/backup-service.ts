import fs from "fs";
import path from "path";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export interface BackupMetadata {
  version: number;
  appName: string;
  createdAt: string;
  createdBy: string;
  environment: string;
  totalRecords: number;
  tableCounts: Record<string, number>;
  checksum: string;
}

export interface BackupPayload {
  metadata: BackupMetadata;
  data: Record<string, any[]>;
}

export interface StoredBackupInfo {
  filename: string;
  sizeBytes: number;
  formattedSize: string;
  createdAt: string;
  createdBy: string;
  totalRecords: number;
  tableCounts: Record<string, number>;
  isSafetyBackup: boolean;
}

export interface BackupValidationSummary {
  version: number;
  createdAt: string;
  createdBy: string;
  totalRecords: number;
  tableCounts: Record<string, number>;
  checksumMatch: boolean | null;
}

export interface BackupValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  summary: BackupValidationSummary | null;
}

export interface BackupModelDef {
  model: string;
  table: string;
  prismaKey: string;
  dateFields: string[];
}

// Models in topological order (dependencies first)
export const BACKUP_MODELS: BackupModelDef[] = [
  { model: "User", table: "users", prismaKey: "user", dateFields: [] },
  { model: "School", table: "schools", prismaKey: "school", dateFields: [] },
  { model: "Program", table: "programs", prismaKey: "program", dateFields: ["createdAt"] },
  { model: "Batch", table: "batches", prismaKey: "batch", dateFields: [] },
  { model: "Teacher", table: "teachers", prismaKey: "teacher", dateFields: [] },
  { model: "Student", table: "students", prismaKey: "student", dateFields: ["dob"] },
  { model: "Exam", table: "exams", prismaKey: "exam", dateFields: [] },
  { model: "ExamSubject", table: "exam_subjects", prismaKey: "examSubject", dateFields: ["examDate"] },
  { model: "Mark", table: "marks", prismaKey: "mark", dateFields: [] },
  { model: "Receipt", table: "receipts", prismaKey: "receipt", dateFields: ["date"] },
  { model: "Expense", table: "expenses", prismaKey: "expense", dateFields: ["date"] },
  { model: "TeacherClassLog", table: "teacher_class_logs", prismaKey: "teacherClassLog", dateFields: ["date"] },
  { model: "TeacherPayment", table: "teacher_payments", prismaKey: "teacherPayment", dateFields: ["date"] },
  { model: "TeacherRate", table: "teacher_rates", prismaKey: "teacherRate", dateFields: [] },
  { model: "ProgramSubject", table: "program_subjects", prismaKey: "programSubject", dateFields: [] },
  { model: "StudentSubject", table: "student_subjects", prismaKey: "studentSubject", dateFields: [] },
  { model: "StudentCourseFee", table: "student_course_fees", prismaKey: "studentCourseFee", dateFields: ["createdAt"] },
  { model: "CoursePayment", table: "course_payments", prismaKey: "coursePayment", dateFields: ["paymentDate"] },
  { model: "SpecialExam", table: "special_exams", prismaKey: "specialExam", dateFields: ["examDate", "createdAt"] },
  { model: "SpecialExamSubject", table: "special_exam_subjects", prismaKey: "specialExamSubject", dateFields: ["examDate"] },
  { model: "SpecialMark", table: "special_marks", prismaKey: "specialMark", dateFields: [] },
  { model: "CompiledMarksheet", table: "compiled_marksheets", prismaKey: "compiledMarksheet", dateFields: ["createdAt", "updatedAt"] },
  { model: "CompiledMarksheetExam", table: "compiled_marksheet_exams", prismaKey: "compiledMarksheetExam", dateFields: [] },
  { model: "RoutineSlot", table: "routine_slots", prismaKey: "routineSlot", dateFields: ["validFrom", "validTo", "createdAt", "updatedAt"] },
  { model: "ClassSession", table: "class_sessions", prismaKey: "classSession", dateFields: ["date", "countedAt", "createdAt", "updatedAt"] },
  { model: "SessionChangeLog", table: "session_change_logs", prismaKey: "sessionChangeLog", dateFields: ["createdAt"] },
  { model: "Notification", table: "notifications", prismaKey: "notification", dateFields: ["createdAt", "readAt"] },
  { model: "NotificationLog", table: "notification_logs", prismaKey: "notificationLog", dateFields: ["sentAt", "createdAt"] },
  { model: "JobRun", table: "job_runs", prismaKey: "jobRun", dateFields: ["startedAt", "finishedAt"] },
];

const BACKUPS_DIR = path.join(process.cwd(), "backups");

function ensureBackupsDir() {
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function computeChecksum(dataString: string): string {
  return crypto.createHash("sha256").update(dataString).digest("hex");
}

/**
 * Returns current live row counts for all database tables.
 */
export async function getLiveDatabaseStats(): Promise<{
  tableCounts: Record<string, number>;
  totalRecords: number;
  timestamp: string;
}> {
  const tableCounts: Record<string, number> = {};
  let totalRecords = 0;

  for (const item of BACKUP_MODELS) {
    const modelDelegate = (prisma as any)[item.prismaKey];
    if (modelDelegate && typeof modelDelegate.count === "function") {
      const count = await modelDelegate.count();
      tableCounts[item.model] = count;
      totalRecords += count;
    }
  }

  return {
    tableCounts,
    totalRecords,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Exports all database tables to structured JSON payload with metadata & checksum.
 */
export async function generateBackupData(username: string): Promise<BackupPayload> {
  const data: Record<string, any[]> = {};
  const tableCounts: Record<string, number> = {};
  let totalRecords = 0;

  for (const item of BACKUP_MODELS) {
    const modelDelegate = (prisma as any)[item.prismaKey];
    if (modelDelegate && typeof modelDelegate.findMany === "function") {
      const rows = await modelDelegate.findMany({
        orderBy: { id: "asc" },
      });
      data[item.model] = rows;
      tableCounts[item.model] = rows.length;
      totalRecords += rows.length;
    } else {
      data[item.model] = [];
      tableCounts[item.model] = 0;
    }
  }

  const dataString = JSON.stringify(data);
  const checksum = computeChecksum(dataString);

  const metadata: BackupMetadata = {
    version: 1,
    appName: "sciencelab",
    createdAt: new Date().toISOString(),
    createdBy: username || "system",
    environment: process.env.NODE_ENV || "production",
    totalRecords,
    tableCounts,
    checksum,
  };

  return {
    metadata,
    data,
  };
}

/**
 * Saves a backup payload to a file on server disk in the backups/ folder.
 */
export async function saveBackupToStorage(
  payload: BackupPayload,
  prefix = "backup"
): Promise<{ filename: string; sizeBytes: number; filepath: string }> {
  ensureBackupsDir();

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, 19);

  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `${cleanPrefix}_${timestamp}.json`;
  const filepath = path.join(BACKUPS_DIR, filename);

  const jsonContent = JSON.stringify(payload, null, 2);
  await fs.promises.writeFile(filepath, jsonContent, "utf8");
  const stats = await fs.promises.stat(filepath);

  return {
    filename,
    sizeBytes: stats.size,
    filepath,
  };
}

/**
 * Lists all stored backups in the backups/ folder with metadata.
 */
export async function listStoredBackups(): Promise<StoredBackupInfo[]> {
  ensureBackupsDir();

  const files = await fs.promises.readdir(BACKUPS_DIR);
  const backups: StoredBackupInfo[] = [];

  for (const file of files) {
    if (!file.endsWith(".json")) continue;

    const fullPath = path.join(BACKUPS_DIR, file);
    try {
      const stat = await fs.promises.stat(fullPath);
      // Read file and parse header/metadata
      const raw = await fs.promises.readFile(fullPath, "utf8");
      const parsed = JSON.parse(raw);

      const metadata: Partial<BackupMetadata> = parsed.metadata || {};
      const totalRecords =
        metadata.totalRecords ??
        (parsed.data
          ? Object.values(parsed.data).reduce(
              (acc: number, cur: any) => acc + (Array.isArray(cur) ? cur.length : 0),
              0
            )
          : 0);

      backups.push({
        filename: file,
        sizeBytes: stat.size,
        formattedSize: formatBytes(stat.size),
        createdAt: metadata.createdAt || stat.birthtime.toISOString(),
        createdBy: metadata.createdBy || "unknown",
        totalRecords,
        tableCounts: metadata.tableCounts || {},
        isSafetyBackup: file.startsWith("pre_restore_safety") || file.startsWith("safety"),
      });
    } catch (err) {
      console.warn(`Failed reading backup file ${file}:`, err);
    }
  }

  // Sort descending by creation date
  return backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Retrieves a stored backup by filename with security against path traversal.
 */
export async function getStoredBackup(filename: string): Promise<BackupPayload> {
  if (!/^[a-zA-Z0-9_\-\.]+\.json$/.test(filename)) {
    throw new Error("Invalid backup filename");
  }

  const filepath = path.join(BACKUPS_DIR, filename);
  if (!fs.existsSync(filepath)) {
    throw new Error(`Backup file ${filename} does not exist`);
  }

  const raw = await fs.promises.readFile(filepath, "utf8");
  return JSON.parse(raw);
}

/**
 * Deletes a stored backup by filename.
 */
export async function deleteStoredBackup(filename: string): Promise<void> {
  if (!/^[a-zA-Z0-9_\-\.]+\.json$/.test(filename)) {
    throw new Error("Invalid backup filename");
  }

  const filepath = path.join(BACKUPS_DIR, filename);
  if (fs.existsSync(filepath)) {
    await fs.promises.unlink(filepath);
  }
}

/**
 * Validates a backup payload structure, tables, and checksum.
 */
export function validateBackupData(payload: any): BackupValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!payload || typeof payload !== "object") {
    return {
      valid: false,
      errors: ["Invalid backup file format: Payload is not an object."],
      warnings,
      summary: null,
    };
  }

  if (!payload.data || typeof payload.data !== "object") {
    errors.push("Missing 'data' section in backup payload.");
  }

  const metadata: Partial<BackupMetadata> = payload.metadata || {};
  let totalRecords = 0;
  const tableCounts: Record<string, number> = {};

  if (payload.data && typeof payload.data === "object") {
    for (const item of BACKUP_MODELS) {
      const records = payload.data[item.model];
      if (records !== undefined) {
        if (!Array.isArray(records)) {
          errors.push(`Table '${item.model}' in data section must be an array.`);
        } else {
          tableCounts[item.model] = records.length;
          totalRecords += records.length;
        }
      } else {
        warnings.push(`Model '${item.model}' not present in backup file (will assume 0 records).`);
        tableCounts[item.model] = 0;
      }
    }

    // Check for critical tables
    if (!payload.data.User || payload.data.User.length === 0) {
      warnings.push("Backup contains no User accounts. Restoring will leave the system without users.");
    }
  }

  let checksumMatch: boolean | null = null;
  if (metadata.checksum && payload.data) {
    try {
      const calculatedChecksum = computeChecksum(JSON.stringify(payload.data));
      checksumMatch = calculatedChecksum === metadata.checksum;
      if (!checksumMatch) {
        warnings.push("Checksum mismatch: The data payload may have been modified or re-formatted.");
      }
    } catch {
      checksumMatch = false;
      warnings.push("Could not verify checksum.");
    }
  }

  const summary: BackupValidationSummary = {
    version: metadata.version || 1,
    createdAt: metadata.createdAt || new Date().toISOString(),
    createdBy: metadata.createdBy || "unknown",
    totalRecords,
    tableCounts,
    checksumMatch,
  };

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary,
  };
}

/**
 * Restores the entire database from a backup payload.
 *
 * 1. Validates the backup payload.
 * 2. Creates an automatic pre-restore safety snapshot on disk.
 * 3. In a transaction:
 *    - TRUNCATE all 23 application tables CASCADE.
 *    - Inserts data in topological order in batches of 500 rows.
 *    - Resets PostgreSQL auto-increment sequences for all tables.
 */
export async function restoreFromBackup(
  payload: BackupPayload,
  adminUsername: string
): Promise<{
  success: boolean;
  message: string;
  safetyBackupFilename: string;
  restoredCounts: Record<string, number>;
  totalRestored: number;
  durationMs: number;
}> {
  const startTime = Date.now();

  // 1. Validation
  const validation = validateBackupData(payload);
  if (!validation.valid) {
    throw new Error(`Cannot restore backup: ${validation.errors.join("; ")}`);
  }

  // 2. Automatic safety snapshot before destructive changes
  let safetyBackupFilename = "";
  try {
    const safetyPayload = await generateBackupData(`system-safety-before-restore-by-${adminUsername}`);
    const savedSafety = await saveBackupToStorage(safetyPayload, "pre_restore_safety");
    safetyBackupFilename = savedSafety.filename;
  } catch (safetyErr) {
    console.error("Failed to generate pre-restore safety backup:", safetyErr);
    throw new Error("Aborting restore: Failed to create safety backup of current database.");
  }

  // 3. Database Restoration in Transaction
  const restoredCounts: Record<string, number> = {};
  let totalRestored = 0;

  // Topological truncate list
  const truncateTableList = BACKUP_MODELS.map((m) => `"${m.table}"`).join(", ");

  await prisma.$transaction(
    async (tx) => {
      // Step A: Truncate all tables
      await tx.$executeRawUnsafe(`TRUNCATE TABLE ${truncateTableList} CASCADE;`);

      // Step B: Insert records in forward topological order
      for (const item of BACKUP_MODELS) {
        const rows = payload.data[item.model];
        if (!Array.isArray(rows) || rows.length === 0) {
          restoredCounts[item.model] = 0;
          continue;
        }

        const modelDelegate = (tx as any)[item.prismaKey];
        if (!modelDelegate || typeof modelDelegate.createMany !== "function") {
          throw new Error(`Prisma delegate for ${item.model} (${item.prismaKey}) not found.`);
        }

        // Clean & parse dates
        const dateFieldsSet = new Set(item.dateFields);
        const preparedRows = rows.map((row) => {
          const cleanRow: Record<string, any> = { ...row };
          for (const key of Object.keys(cleanRow)) {
            if (dateFieldsSet.has(key) && cleanRow[key]) {
              cleanRow[key] = new Date(cleanRow[key]);
            }
          }
          return cleanRow;
        });

        // Batch in chunks of 500
        const CHUNK_SIZE = 500;
        for (let i = 0; i < preparedRows.length; i += CHUNK_SIZE) {
          const chunk = preparedRows.slice(i, i + CHUNK_SIZE);
          await modelDelegate.createMany({
            data: chunk,
          });
        }

        restoredCounts[item.model] = preparedRows.length;
        totalRestored += preparedRows.length;
      }

      // Step C: Reset PostgreSQL sequences for all tables
      for (const item of BACKUP_MODELS) {
        await tx.$queryRawUnsafe(`
          SELECT setval(
            pg_get_serial_sequence('${item.table}', 'id'),
            COALESCE((SELECT MAX(id) FROM "${item.table}"), 1)
          );
        `);
      }
    },
    {
      maxWait: 20000,
      timeout: 120000, // 2 minutes timeout for large datasets
    }
  );

  const durationMs = Date.now() - startTime;

  return {
    success: true,
    message: `Database restored successfully (${totalRestored} records across ${BACKUP_MODELS.length} tables in ${(durationMs / 1000).toFixed(1)}s).`,
    safetyBackupFilename,
    restoredCounts,
    totalRestored,
    durationMs,
  };
}
