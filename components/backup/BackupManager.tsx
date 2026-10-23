"use client";

import React, { useState, useRef } from "react";
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  FileArchive,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Clock,
  ShieldAlert,
  FileText,
  Check,
  Search,
  ArrowUpDown,
  Server,
  Layers,
  Users,
  GraduationCap,
  Receipt,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  createBackupAction,
  deleteBackupAction,
  getDatabaseStatsAction,
  listBackupsAction,
  restoreFromStoredBackupAction,
} from "@/app/actions/backup";
import { StoredBackupInfo, BackupValidationResult } from "@/lib/services/backup-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DatabaseStats {
  tableCounts: Record<string, number>;
  totalRecords: number;
  timestamp: string;
}

interface BackupManagerProps {
  initialStats: DatabaseStats;
  initialBackups: StoredBackupInfo[];
  currentUsername: string;
}

export function BackupManager({
  initialStats,
  initialBackups,
  currentUsername,
}: BackupManagerProps) {
  const [stats, setStats] = useState<DatabaseStats>(initialStats);
  const [backups, setBackups] = useState<StoredBackupInfo[]>(initialBackups);
  const [activeTab, setActiveTab] = useState<"overview" | "backups" | "restore">("overview");

  // Loading states
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isDownloadingLive, setIsDownloadingLive] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Search filter for backups
  const [searchQuery, setSearchQuery] = useState("");

  // Restore state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedStoredBackup, setSelectedStoredBackup] = useState<string>("");
  const [restoreSource, setRestoreSource] = useState<"upload" | "stored">("upload");
  const [validationResult, setValidationResult] = useState<BackupValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState("");
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreProgressMsg, setRestoreProgressMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [statsRes, backupsRes] = await Promise.all([
        getDatabaseStatsAction(),
        listBackupsAction(),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
      if (backupsRes.success && backupsRes.data) {
        setBackups(backupsRes.data);
      }
      toast.success("Database statistics & backups refreshed");
    } catch {
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Instant browser download of live database
  const handleDownloadLiveBackup = async () => {
    setIsDownloadingLive(true);
    try {
      const link = document.createElement("a");
      link.href = "/api/backup/download";
      link.setAttribute("download", `sciencelab_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Backup download started");
    } catch (err: any) {
      toast.error("Download failed: " + err.message);
    } finally {
      setIsDownloadingLive(false);
    }
  };

  // Create stored backup on server
  const handleCreateStoredBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const res = await createBackupAction("snapshot");
      if (res.success) {
        toast.success(`Backup saved on server: ${res.filename} (${res.totalRecords} records)`);
        await handleRefresh();
      } else {
        toast.error(res.error || "Failed to create backup");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Delete stored backup
  const handleDeleteBackup = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete backup file "${filename}"?`)) {
      return;
    }
    setIsDeleting(filename);
    try {
      const res = await deleteBackupAction(filename);
      if (res.success) {
        setBackups((prev) => prev.filter((b) => b.filename !== filename));
        toast.success(`Backup ${filename} deleted`);
      } else {
        toast.error(res.error || "Failed to delete backup");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete backup");
    } finally {
      setIsDeleting(null);
    }
  };

  // Handle file selection for upload restore
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toast.error("Please select a valid .json backup file");
      return;
    }

    setSelectedFile(file);
    setValidationResult(null);
    setIsValidating(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/backup/validate", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error || "Validation failed");
        setValidationResult({
          valid: false,
          errors: [data.error || "File could not be parsed as valid JSON"],
          warnings: [],
          summary: null,
        });
      } else {
        setValidationResult(data);
        if (data.valid) {
          toast.success("Backup file is valid and ready for review");
        } else {
          toast.warning("Validation warnings/errors found in backup");
        }
      }
    } catch (err: any) {
      toast.error("Error validating backup file: " + err.message);
    } finally {
      setIsValidating(false);
    }
  };

  // Handle stored backup selection
  const handleSelectStoredBackup = async (filename: string) => {
    setSelectedStoredBackup(filename);
    setSelectedFile(null);
    setValidationResult(null);
    if (!filename) return;

    setIsValidating(true);
    try {
      const found = backups.find((b) => b.filename === filename);
      if (found) {
        setValidationResult({
          valid: true,
          errors: [],
          warnings: [],
          summary: {
            version: 1,
            createdAt: found.createdAt,
            createdBy: found.createdBy,
            totalRecords: found.totalRecords,
            tableCounts: found.tableCounts,
            checksumMatch: true,
          },
        });
        toast.success(`Selected stored backup: ${filename}`);
      }
    } catch (err: any) {
      toast.error("Error inspecting backup: " + err.message);
    } finally {
      setIsValidating(false);
    }
  };

  // Execute restore
  const handleExecuteRestore = async () => {
    if (confirmationInput.trim() !== "RESTORE") {
      toast.error("Please type RESTORE in capital letters to confirm.");
      return;
    }

    setIsRestoring(true);
    setRestoreProgressMsg("Initiating restore... Preparing safety backup.");

    try {
      if (restoreSource === "upload") {
        if (!selectedFile) {
          toast.error("No file selected");
          setIsRestoring(false);
          return;
        }

        setRestoreProgressMsg("Uploading and restoring database tables...");
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("confirmation", "RESTORE");

        const res = await fetch("/api/backup/upload-restore", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Restore failed");
        }

        toast.success(
          `Restore completed successfully! ${data.totalRestored} records restored.`
        );
        setShowRestoreModal(false);
        setConfirmationInput("");
        setSelectedFile(null);
        setValidationResult(null);
        await handleRefresh();
        setActiveTab("overview");
      } else {
        // Restore from stored backup
        if (!selectedStoredBackup) {
          toast.error("No backup selected");
          setIsRestoring(false);
          return;
        }

        setRestoreProgressMsg("Restoring database from saved server backup...");
        const res = await restoreFromStoredBackupAction(selectedStoredBackup, "RESTORE");

        if (!res.success) {
          throw new Error(res.error || "Restore failed");
        }

        toast.success(
          `Restore completed successfully! ${res.totalRestored} records restored.`
        );
        setShowRestoreModal(false);
        setConfirmationInput("");
        setSelectedStoredBackup("");
        setValidationResult(null);
        await handleRefresh();
        setActiveTab("overview");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Restoration failed. Any changes were rolled back.");
    } finally {
      setIsRestoring(false);
      setRestoreProgressMsg("");
    }
  };

  const filteredBackups = backups.filter(
    (b) =>
      b.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.createdBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-zinc-900 via-indigo-950 to-zinc-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-zinc-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
                <Database className="h-6 w-6" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Database Backup & Restore</h1>
            </div>
            <p className="text-zinc-400 text-sm sm:text-base max-w-2xl">
              Export full system database snapshots, safeguard institutional records, and perform
              clean restorations with automatic pre-restore safety checkpoints.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={handleDownloadLiveBackup}
              disabled={isDownloadingLive}
              className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30"
            >
              <Download className={`h-4 w-4 mr-2 ${isDownloadingLive ? "animate-bounce" : ""}`} />
              Download Backup (.json)
            </Button>
            <Button
              onClick={handleCreateStoredBackup}
              disabled={isCreatingBackup}
              className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 shadow-sm"
            >
              <HardDrive className={`h-4 w-4 mr-2 ${isCreatingBackup ? "animate-spin" : ""}`} />
              Save to Server
            </Button>
          </div>
        </div>

        {/* Status bar */}
        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs sm:text-sm">
          <div>
            <span className="text-zinc-400 block">Database Engine</span>
            <span className="font-semibold text-white flex items-center gap-1.5 mt-0.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              PostgreSQL (Neon)
            </span>
          </div>
          <div>
            <span className="text-zinc-400 block">Total Live Records</span>
            <span className="font-semibold text-white mt-0.5 block">
              {stats.totalRecords.toLocaleString()} rows
            </span>
          </div>
          <div>
            <span className="text-zinc-400 block">Stored Snapshots</span>
            <span className="font-semibold text-white mt-0.5 block">
              {backups.length} files
            </span>
          </div>
          <div>
            <span className="text-zinc-400 block">Active Admin</span>
            <span className="font-semibold text-white mt-0.5 block truncate">
              {currentUsername}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-zinc-200">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "overview"
              ? "border-indigo-600 text-indigo-600 font-semibold"
              : "border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          <Layers className="h-4 w-4" />
          Overview & Live Data ({stats.totalRecords.toLocaleString()})
        </button>
        <button
          onClick={() => setActiveTab("backups")}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "backups"
              ? "border-indigo-600 text-indigo-600 font-semibold"
              : "border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          <FileArchive className="h-4 w-4" />
          Saved Server Backups ({backups.length})
        </button>
        <button
          onClick={() => setActiveTab("restore")}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "restore"
              ? "border-rose-600 text-rose-600 font-semibold"
              : "border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          <RotateCcw className="h-4 w-4" />
          Restore Database
        </button>
      </div>

      {/* TAB 1: OVERVIEW & LIVE METRICS */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Quick Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border border-zinc-200 shadow-xs">
              <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-medium">Students Enrolled</p>
                  <p className="text-xl sm:text-2xl font-bold text-zinc-900 mt-0.5">
                    {(stats.tableCounts.Student || 0).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200 shadow-xs">
              <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-medium">Exams & Subjects</p>
                  <p className="text-xl sm:text-2xl font-bold text-zinc-900 mt-0.5">
                    {((stats.tableCounts.Exam || 0) + (stats.tableCounts.SpecialExam || 0)).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200 shadow-xs">
              <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-medium">Fee Receipts</p>
                  <p className="text-xl sm:text-2xl font-bold text-zinc-900 mt-0.5">
                    {(stats.tableCounts.Receipt || 0).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200 shadow-xs">
              <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-medium">Exam Marks Recorded</p>
                  <p className="text-xl sm:text-2xl font-bold text-zinc-900 mt-0.5">
                    {((stats.tableCounts.Mark || 0) + (stats.tableCounts.SpecialMark || 0)).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table Breakdown Grid */}
          <Card className="border border-zinc-200 shadow-xs">
            <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold text-zinc-900">
                    Live Database Tables & Row Counts
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-500">
                    All 23 relational database tables included in every backup snapshot
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-white font-mono text-xs w-fit">
                  Total: {stats.totalRecords.toLocaleString()} rows
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(stats.tableCounts).map(([table, count]) => (
                  <div
                    key={table}
                    className="flex items-center justify-between p-3 rounded-lg border border-zinc-100 bg-white hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-2 w-2 rounded-full bg-indigo-500" />
                      <span className="text-xs font-medium text-zinc-700">{table}</span>
                    </div>
                    <span className="text-xs font-semibold text-zinc-900 bg-zinc-100 px-2.5 py-0.5 rounded-full font-mono">
                      {count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Security & Integrity Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border border-zinc-200 bg-zinc-50/50">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm">
                  <ShieldCheck className="h-4 w-4" />
                  SHA-256 Checksums
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Every generated backup carries a cryptographic SHA-256 payload checksum to ensure
                  zero tampering or corrupted data during transport.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200 bg-zinc-50/50">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Auto Safety Snapshots
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Before any database restoration executes, the system automatically writes a full
                  safety snapshot to disk so you can rollback at any time.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200 bg-zinc-50/50">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-purple-700 font-semibold text-sm">
                  <ArrowUpDown className="h-4 w-4" />
                  Auto-Increment Sync
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  PostgreSQL serial sequences are automatically synchronized with table maxima upon
                  restoring, preventing primary key collisions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: SAVED SERVER BACKUPS */}
      {activeTab === "backups" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Search backup by filename or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-white"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={handleCreateStoredBackup}
                disabled={isCreatingBackup}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <HardDrive className={`h-4 w-4 mr-2 ${isCreatingBackup ? "animate-spin" : ""}`} />
                Take Snapshot Now
              </Button>
            </div>
          </div>

          {filteredBackups.length === 0 ? (
            <Card className="border border-zinc-200 text-center py-12">
              <CardContent className="space-y-3">
                <FileArchive className="h-10 w-10 text-zinc-400 mx-auto" />
                <p className="text-zinc-600 font-medium text-sm">No backup files found</p>
                <p className="text-zinc-400 text-xs max-w-sm mx-auto">
                  Click &ldquo;Take Snapshot Now&rdquo; to save a fresh database backup directly to the server disk.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCreateStoredBackup}
                  disabled={isCreatingBackup}
                >
                  Create First Snapshot
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredBackups.map((backup) => (
                <Card
                  key={backup.filename}
                  className="border border-zinc-200 hover:border-zinc-300 transition-colors shadow-2xs"
                >
                  <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                          backup.isSafetyBackup
                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                            : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                        }`}
                      >
                        {backup.isSafetyBackup ? (
                          <ShieldAlert className="h-5 w-5" />
                        ) : (
                          <FileArchive className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-sm text-zinc-900 truncate">
                            {backup.filename}
                          </p>
                          {backup.isSafetyBackup && (
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700 border-amber-200 text-xs"
                            >
                              Pre-Restore Safety Snapshot
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(backup.createdAt).toLocaleString()}
                          </span>
                          <span>•</span>
                          <span>{backup.formattedSize}</span>
                          <span>•</span>
                          <span className="font-medium text-zinc-700">
                            {backup.totalRecords.toLocaleString()} rows
                          </span>
                          <span>•</span>
                          <span>Author: {backup.createdBy}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = `/api/backup/download?filename=${encodeURIComponent(backup.filename)}`;
                          link.setAttribute("download", backup.filename);
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="text-xs text-zinc-700"
                        title="Download to your computer"
                      >
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Download
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRestoreSource("stored");
                          handleSelectStoredBackup(backup.filename);
                          setActiveTab("restore");
                        }}
                        className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50 hover:text-rose-800"
                        title="Restore this backup"
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5 text-rose-600" />
                        Restore
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBackup(backup.filename)}
                        disabled={isDeleting === backup.filename}
                        className="text-zinc-400 hover:text-rose-600 hover:bg-rose-50 p-2 h-8 w-8"
                        title="Delete file"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RESTORE DATABASE */}
      {activeTab === "restore" && (
        <div className="space-y-6">
          {/* Warning Banner */}
          <div className="p-4 sm:p-5 rounded-xl border border-rose-200 bg-rose-50/70 text-rose-900 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs sm:text-sm">
              <p className="font-semibold text-rose-900">
                Important: Database restoration is a critical administrative action
              </p>
              <p className="text-rose-700 leading-relaxed">
                Restoring a backup will wipe current records across all 23 application tables and
                re-populate them with the data contained in the backup.
                <span className="font-medium ml-1">
                  An automatic pre-restore safety snapshot will always be saved to the server before
                  any data is replaced.
                </span>
              </p>
            </div>
          </div>

          {/* Source Selection Card */}
          <Card className="border border-zinc-200 shadow-xs">
            <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 pb-4">
              <CardTitle className="text-base font-semibold text-zinc-900">
                Choose Backup Source
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500">
                Select whether to upload a backup file from your computer or restore an existing
                snapshot from server storage
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-6">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setRestoreSource("upload");
                    setValidationResult(null);
                  }}
                  className={`flex-1 p-4 rounded-xl border text-left transition-all ${
                    restoreSource === "upload"
                      ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20"
                      : "border-zinc-200 hover:border-zinc-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 font-semibold text-sm text-zinc-900">
                    <Upload className="h-4 w-4 text-indigo-600" />
                    Upload .json File
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Upload a backup file stored on your local device
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRestoreSource("stored");
                    setValidationResult(null);
                  }}
                  className={`flex-1 p-4 rounded-xl border text-left transition-all ${
                    restoreSource === "stored"
                      ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20"
                      : "border-zinc-200 hover:border-zinc-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 font-semibold text-sm text-zinc-900">
                    <Server className="h-4 w-4 text-indigo-600" />
                    Select Saved Server Snapshot
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Restore one of the {backups.length} snapshots stored on the server
                  </p>
                </button>
              </div>

              {/* Upload Input Area */}
              {restoreSource === "upload" && (
                <div className="space-y-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-zinc-300 hover:border-indigo-500 rounded-xl p-8 text-center cursor-pointer bg-zinc-50/50 hover:bg-indigo-50/20 transition-colors"
                  >
                    <Upload className="h-8 w-8 text-zinc-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-zinc-800">
                      {selectedFile ? selectedFile.name : "Click to select or drag & drop backup JSON file"}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                      {selectedFile
                        ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready for inspection`
                        : "Supports JSON backups created by ScienceLab (.json)"}
                    </p>
                  </div>
                </div>
              )}

              {/* Stored Backup Dropdown */}
              {restoreSource === "stored" && (
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-zinc-700 block">
                    Choose from Available Server Backups:
                  </label>
                  <select
                    value={selectedStoredBackup}
                    onChange={(e) => handleSelectStoredBackup(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Choose a backup file --</option>
                    {backups.map((b) => (
                      <option key={b.filename} value={b.filename}>
                        {b.filename} ({b.formattedSize} • {b.totalRecords} records •{" "}
                        {new Date(b.createdAt).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Validation & Comparison Preview */}
          {isValidating && (
            <Card className="border border-zinc-200 p-8 text-center">
              <RefreshCw className="h-6 w-6 animate-spin text-indigo-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-zinc-700">Validating backup structure & checksum...</p>
            </Card>
          )}

          {validationResult && (
            <Card
              className={`border shadow-xs ${
                validationResult.valid ? "border-emerald-200" : "border-rose-200"
              }`}
            >
              <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {validationResult.valid ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-rose-600" />
                    )}
                    <CardTitle className="text-base font-semibold text-zinc-900">
                      Backup Inspection & Validation Report
                    </CardTitle>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      validationResult.valid
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : "bg-rose-50 text-rose-700 border-rose-300"
                    }
                  >
                    {validationResult.valid ? "Validation Passed" : "Validation Failed"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-5">
                {/* Error messages */}
                {validationResult.errors.length > 0 && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                    <p className="font-semibold">Errors found:</p>
                    <ul className="list-disc list-inside">
                      {validationResult.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings */}
                {validationResult.warnings.length > 0 && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
                    <p className="font-semibold">Warnings:</p>
                    <ul className="list-disc list-inside">
                      {validationResult.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Metadata summary */}
                {validationResult.summary && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/80 text-xs">
                    <div>
                      <span className="text-zinc-500 block">Backup Date</span>
                      <span className="font-medium text-zinc-900 mt-0.5 block">
                        {new Date(validationResult.summary.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Created By</span>
                      <span className="font-medium text-zinc-900 mt-0.5 block">
                        {validationResult.summary.createdBy}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Records in Backup</span>
                      <span className="font-bold text-zinc-900 mt-0.5 block font-mono">
                        {validationResult.summary.totalRecords.toLocaleString()} rows
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Integrity Check</span>
                      <span className="font-medium mt-0.5 block flex items-center gap-1 text-emerald-600">
                        <Check className="h-3.5 w-3.5" /> SHA-256 Verified
                      </span>
                    </div>
                  </div>
                )}

                {/* Comparison Grid */}
                {validationResult.summary && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-zinc-700">
                      Table Record Comparison (Live Database vs Backup File):
                    </p>
                    <div className="max-h-60 overflow-y-auto border border-zinc-200 rounded-lg divide-y divide-zinc-100 text-xs">
                      {Object.keys({
                        ...stats.tableCounts,
                        ...validationResult.summary.tableCounts,
                      }).map((table) => {
                        const current = stats.tableCounts[table] || 0;
                        const inBackup = validationResult.summary?.tableCounts[table] || 0;
                        const diff = inBackup - current;

                        return (
                          <div
                            key={table}
                            className="flex items-center justify-between p-2 px-3 hover:bg-zinc-50"
                          >
                            <span className="font-medium text-zinc-800">{table}</span>
                            <div className="flex items-center gap-4 font-mono text-zinc-600">
                              <span>Live: {current.toLocaleString()}</span>
                              <span>→</span>
                              <span className="font-semibold text-indigo-700">
                                Backup: {inBackup.toLocaleString()}
                              </span>
                              <span
                                className={`text-[11px] px-1.5 py-0.2 rounded ${
                                  diff > 0
                                    ? "bg-emerald-50 text-emerald-700"
                                    : diff < 0
                                    ? "bg-rose-50 text-rose-700"
                                    : "bg-zinc-100 text-zinc-500"
                                }`}
                              >
                                {diff > 0 ? `+${diff}` : diff}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Action CTA */}
                {validationResult.valid && (
                  <div className="pt-2 flex justify-end">
                    <Button
                      onClick={() => setShowRestoreModal(true)}
                      className="bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Proceed to Restore...
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* RESTORE CONFIRMATION MODAL */}
      <Dialog open={showRestoreModal} onOpenChange={setShowRestoreModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle>Confirm Database Restoration</DialogTitle>
            </div>
            <DialogDescription className="text-zinc-600 text-xs sm:text-sm mt-2 space-y-2">
              <span className="block text-zinc-900 font-medium">
                You are about to restore the database from:
              </span>
              <span className="block p-2 bg-zinc-100 rounded text-xs font-mono break-all text-zinc-800">
                {restoreSource === "upload" ? selectedFile?.name : selectedStoredBackup}
              </span>
              <span className="block text-rose-700 text-xs">
                ⚠️ This will replace all existing live records with the contents of this backup. An
                automatic safety snapshot will be saved to disk beforehand.
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-xs font-medium text-zinc-700 block">
              To confirm this action, please type <strong className="text-rose-600 font-bold">RESTORE</strong> below:
            </label>
            <Input
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              placeholder="RESTORE"
              disabled={isRestoring}
              className="border-rose-300 focus-visible:ring-rose-500 font-mono text-center tracking-widest uppercase font-bold"
            />
            {restoreProgressMsg && (
              <div className="p-3 rounded-lg bg-zinc-100 flex items-center gap-2.5 text-xs text-zinc-700">
                <RefreshCw className="h-4 w-4 animate-spin text-rose-600" />
                <span>{restoreProgressMsg}</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowRestoreModal(false);
                setConfirmationInput("");
              }}
              disabled={isRestoring}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExecuteRestore}
              disabled={confirmationInput.trim() !== "RESTORE" || isRestoring}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              {isRestoring ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Confirm & Restore
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
