"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Mail,
  MessageSquare,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Play,
  ArrowLeft,
  Calendar,
  Layers,
  Search,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getNotificationLogsAction,
  retryNotificationAction,
  triggerDailyDigestAction,
  getJobRunsAction,
} from "@/app/actions/notifications";
import { formatDhakaDate, todayDhaka, tomorrowDhaka } from "@/lib/dhaka-time";

interface NotificationLogClientProps {
  initialLogs: any[];
  initialTotal: number;
  initialJobRuns: any[];
  teachers: Array<{ id: number; name: string }>;
}

export function NotificationLogClient({
  initialLogs,
  initialTotal,
  initialJobRuns,
  teachers,
}: NotificationLogClientProps) {
  const [logs, setLogs] = useState<any[]>(initialLogs);
  const [total, setTotal] = useState(initialTotal);
  const [jobRuns, setJobRuns] = useState<any[]>(initialJobRuns);
  const [activeTab, setActiveTab] = useState<"logs" | "jobs">("logs");

  // Filters
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterTeacherId, setFilterTeacherId] = useState<string>("ALL");
  const [filterChannel, setFilterChannel] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [isRetryingId, setIsRetryingId] = useState<number | null>(null);
  const [isTriggeringDigest, setIsTriggeringDigest] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await getNotificationLogsAction({
        date: filterDate || undefined,
        teacherId: filterTeacherId !== "ALL" ? parseInt(filterTeacherId, 10) : undefined,
        channel: filterChannel,
        status: filterStatus,
      });

      if (res.success && res.data) {
        setLogs(res.data);
        setTotal(res.total);
      } else {
        toast.error(res.error || "Failed to load notification logs");
      }
    } catch {
      toast.error("Failed to load logs");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchJobRuns = async () => {
    try {
      const res = await getJobRunsAction(25);
      if (res.success && res.data) {
        setJobRuns(res.data);
      }
    } catch (err) {
      console.warn("Failed to fetch job runs:", err);
    }
  };

  const handleRetry = async (logId: number) => {
    setIsRetryingId(logId);
    try {
      const res = await retryNotificationAction(logId);
      if (res.success) {
        toast.success("Notification resent successfully!");
        fetchLogs();
      } else {
        toast.error(res.error || "Retry delivery failed");
      }
    } catch {
      toast.error("Failed to retry notification");
    } finally {
      setIsRetryingId(null);
    }
  };

  const handleTriggerDailyDigest = async () => {
    if (!confirm("Trigger tomorrow's 19:00 Daily Schedule Digest now for all faculty?")) {
      return;
    }

    setIsTriggeringDigest(true);
    try {
      const res = await triggerDailyDigestAction(tomorrowDhaka(), true);
      if (res.success && res.data) {
        toast.success(
          `Digest completed! Processed ${res.data.processedTeachers} teachers (${res.data.sentEmails} emails sent, ${res.data.sentInApp} in-app)`
        );
        fetchLogs();
        fetchJobRuns();
      } else {
        toast.error(res.error || "Digest job encountered errors");
      }
    } catch {
      toast.error("Failed to execute digest job");
    } finally {
      setIsTriggeringDigest(false);
    }
  };

  const getChannelBadge = (channel: string) => {
    switch (channel) {
      case "EMAIL":
        return (
          <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 gap-1">
            <Mail className="h-3 w-3" />
            Email
          </Badge>
        );
      case "WHATSAPP_LINK":
        return (
          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
            <MessageSquare className="h-3 w-3" />
            WhatsApp
          </Badge>
        );
      case "IN_APP":
        return (
          <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 gap-1">
            <Bell className="h-3 w-3" />
            In-App
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-[10px]">{channel}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SENT":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Sent
          </Badge>
        );
      case "FAILED":
        return (
          <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-[10px] gap-1">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
      case "SKIPPED":
        return (
          <Badge variant="outline" className="bg-zinc-100 text-zinc-600 border-zinc-200 text-[10px]">
            Skipped
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin-route/routine"
              className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Day Planner
            </Link>
            <span className="text-zinc-300">•</span>
            <Link
              href="/admin-route/routine/tomorrow"
              className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              Tomorrow Board
            </Link>
            <span className="text-zinc-300">•</span>
            <Link
              href="/admin-route/routine/reports"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors"
            >
              <BarChart3 className="h-3 w-3" />
              Routine Reports
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2.5">
            <Bell className="h-6 w-6 text-indigo-600" />
            Notification Center & Audit Logs
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Audit trail of all routine dispatch messages, daily digests, WhatsApp communications, and cron job runs.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              fetchLogs();
              fetchJobRuns();
            }}
            disabled={isLoading}
            className="text-xs h-9 gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={handleTriggerDailyDigest}
            disabled={isTriggeringDigest}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 gap-1.5 shadow-xs"
          >
            <Play className={`h-3.5 w-3.5 ${isTriggeringDigest ? "animate-spin" : ""}`} />
            Send 19:00 Digest Now
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200">
        <button
          onClick={() => setActiveTab("logs")}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "logs"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          Notification Logs ({total})
        </button>
        <button
          onClick={() => setActiveTab("jobs")}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "jobs"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          Job Executions ({jobRuns.length})
        </button>
      </div>

      {activeTab === "logs" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/70 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* Date Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-zinc-500">Date:</span>
                <Input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="text-xs h-8 w-36 bg-white"
                />
              </div>

              {/* Teacher Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-zinc-500">Teacher:</span>
                <select
                  value={filterTeacherId}
                  onChange={(e) => setFilterTeacherId(e.target.value)}
                  className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs h-8 shadow-xs focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="ALL">All Teachers</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Channel Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-zinc-500">Channel:</span>
                <select
                  value={filterChannel}
                  onChange={(e) => setFilterChannel(e.target.value)}
                  className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs h-8 shadow-xs focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="ALL">All Channels</option>
                  <option value="EMAIL">Email</option>
                  <option value="WHATSAPP_LINK">WhatsApp Link</option>
                  <option value="IN_APP">In-App</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-zinc-500">Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs h-8 shadow-xs focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SENT">Sent</option>
                  <option value="FAILED">Failed</option>
                  <option value="SKIPPED">Skipped</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>

              <Button size="sm" variant="secondary" onClick={fetchLogs} className="text-xs h-8">
                Apply Filters
              </Button>
            </div>
          </div>

          {/* Logs Table */}
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/80 font-medium text-zinc-600">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Teacher</th>
                    <th className="py-2.5 px-3">Channel</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Recipient</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Attempts</th>
                    <th className="py-2.5 px-3">Sent At / Error</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-zinc-500">
                        No notification records found matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-50/60 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-700">
                          {log.forDate}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-zinc-900">
                          {log.teacher?.name || `Teacher #${log.teacherId}`}
                        </td>
                        <td className="py-2.5 px-3">{getChannelBadge(log.channel)}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-[11px] text-zinc-600">{log.kind}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-600">
                          {log.recipient || "—"}
                        </td>
                        <td className="py-2.5 px-3">{getStatusBadge(log.status)}</td>
                        <td className="py-2.5 px-3 text-center">{log.attempts}</td>
                        <td className="py-2.5 px-3 max-w-xs">
                          {log.status === "SENT" ? (
                            <span className="text-[11px] text-emerald-700">
                              {log.sentAt ? new Date(log.sentAt).toLocaleTimeString() : "Delivered"}
                            </span>
                          ) : log.error ? (
                            <span className="text-[11px] text-rose-600 truncate block" title={log.error}>
                              {log.error}
                            </span>
                          ) : (
                            <span className="text-zinc-400">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {log.status === "FAILED" && log.channel === "EMAIL" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRetry(log.id)}
                              disabled={isRetryingId === log.id}
                              className="text-[11px] h-7 px-2 border-rose-300 text-rose-700 hover:bg-rose-50"
                            >
                              <RefreshCw
                                className={`h-3 w-3 mr-1 ${isRetryingId === log.id ? "animate-spin" : ""}`}
                              />
                              Retry
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "jobs" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/80 font-medium text-zinc-600">
                    <th className="py-2.5 px-3">Job Name</th>
                    <th className="py-2.5 px-3">Target Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Started</th>
                    <th className="py-2.5 px-3">Finished</th>
                    <th className="py-2.5 px-3">Summary / Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {jobRuns.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-500">
                        No background job executions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    jobRuns.map((job) => (
                      <tr key={job.id} className="hover:bg-zinc-50/60 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-zinc-900 font-mono text-[11px]">
                          {job.job}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-700">
                          {job.forDate}
                        </td>
                        <td className="py-2.5 px-3">{getStatusBadge(job.status)}</td>
                        <td className="py-2.5 px-3 text-zinc-600">
                          {new Date(job.startedAt).toLocaleTimeString()}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-600">
                          {job.finishedAt ? new Date(job.finishedAt).toLocaleTimeString() : "Running..."}
                        </td>
                        <td className="py-2.5 px-3 max-w-sm">
                          {job.summary ? (
                            <pre className="font-mono text-[10px] text-zinc-600 bg-zinc-50 p-1.5 rounded border border-zinc-100 whitespace-pre-wrap">
                              {JSON.stringify(job.summary, null, 2)}
                            </pre>
                          ) : job.error ? (
                            <span className="text-rose-600 text-[11px]">{job.error}</span>
                          ) : (
                            <span className="text-zinc-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
