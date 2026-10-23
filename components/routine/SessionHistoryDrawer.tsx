"use client";

import React, { useState, useEffect } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  History,
  Clock,
  Calendar,
  User,
  DoorOpen,
  DollarSign,
  ArrowRight,
  Layers,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { getSessionHistoryAction } from "@/app/actions/routine";
import { formatTime12h, formatDhakaDate, toDhakaDateString } from "@/lib/dhaka-time";

interface SessionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: number | null;
  onSelectSession?: (id: number) => void;
}

export function SessionHistoryDrawer({
  isOpen,
  onClose,
  sessionId,
  onSelectSession,
}: SessionHistoryDrawerProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !sessionId) {
      setData(null);
      setError(null);
      return;
    }

    let isMounted = true;
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await getSessionHistoryAction(sessionId);
        if (isMounted) {
          if (res.success && res.data) {
            setData(res.data);
          } else {
            setError(res.error || "Failed to load session history");
          }
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || "Failed to load session history");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [isOpen, sessionId]);

  if (!isOpen) return null;

  const session = data?.session;
  const changeLogs = data?.changeLogs || [];
  const originalSession = data?.originalSession;
  const rescheduledToSessions = data?.rescheduledToSessions || [];

  const getActionBadge = (action: string) => {
    switch (action) {
      case "CREATE":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">Created</Badge>;
      case "UPDATE":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Updated</Badge>;
      case "REASSIGN":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300">Reassigned</Badge>;
      case "RESCHEDULE":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-300">Rescheduled</Badge>;
      case "CANCEL":
        return <Badge className="bg-red-100 text-red-800 border-red-300">Cancelled</Badge>;
      case "ADJUST":
        return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300">Adjusted</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Scheduled</Badge>;
      case "CONDUCTED":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Conducted</Badge>;
      case "CANCELLED":
        return <Badge className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      case "RESCHEDULED":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Rescheduled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Session #${sessionId} — Change Audit History`}
      description="Full lifecycle, reschedule chain, and timestamped changes"
      width="lg"
    >
      <div className="space-y-6">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400 mb-2" />
            <p className="text-sm">Loading audit history...</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!isLoading && session && (
          <>
            {/* Session Overview Card */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-zinc-900">
                      {session.subjectName || session.kind}
                    </span>
                    <Badge variant="outline" className="text-[11px] font-mono">
                      {session.kind}
                    </Badge>
                  </div>
                  {session.lectureLabel && (
                    <p className="text-xs text-zinc-500 mt-0.5">Topic: {session.lectureLabel}</p>
                  )}
                </div>
                {getStatusBadge(session.status)}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-200 text-xs">
                <div>
                  <span className="text-zinc-500 block text-[11px]">Teacher</span>
                  <strong className="text-zinc-900">{session.teacher?.name}</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px]">Batch</span>
                  <strong className="text-zinc-900">{session.batch?.name || "General"}</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px]">Date & Time</span>
                  <strong className="text-zinc-900">
                    {formatDhakaDate(toDhakaDateString(session.date))} • {formatTime12h(session.startTime)}
                  </strong>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px]">Room / Pay</span>
                  <strong className="text-zinc-900">
                    {session.room || "—"} {session.payAmount ? `(৳${session.payAmount})` : ""}
                  </strong>
                </div>
              </div>
            </div>

            {/* Reschedule Lineage Banners */}
            {originalSession && (
              <div className="rounded-lg border border-purple-200 bg-purple-50/70 p-3 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-purple-600 rotate-180" />
                  <div>
                    <span className="font-semibold text-purple-900">Rescheduled from Session #{originalSession.id}:</span>
                    <div className="text-purple-700">
                      Originally on {formatDhakaDate(toDhakaDateString(originalSession.date))} at {formatTime12h(originalSession.startTime)} with {originalSession.teacher?.name}
                    </div>
                  </div>
                </div>
                {onSelectSession && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-purple-300 text-purple-900 hover:bg-purple-100"
                    onClick={() => onSelectSession(originalSession.id)}
                  >
                    View Original
                  </Button>
                )}
              </div>
            )}

            {rescheduledToSessions.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold text-amber-900">
                  <ArrowRight className="h-4 w-4 text-amber-600" />
                  <span>Rescheduled into New Session:</span>
                </div>
                {rescheduledToSessions.map((resSession: any) => (
                  <div key={resSession.id} className="flex items-center justify-between pl-6 text-amber-800">
                    <div>
                      Session #{resSession.id} • {formatDhakaDate(toDhakaDateString(resSession.date))} at {formatTime12h(resSession.startTime)} ({resSession.teacher?.name})
                    </div>
                    {onSelectSession && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[11px] border-amber-300 text-amber-900 hover:bg-amber-100"
                        onClick={() => onSelectSession(resSession.id)}
                      >
                        Jump to Session
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Audit Log Timeline */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                <History className="h-4 w-4 text-zinc-500" />
                Change Timeline ({changeLogs.length} events)
              </h3>

              {changeLogs.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-400">
                  No explicit audit logs recorded for this session.
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200">
                  {changeLogs.map((log: any, index: number) => {
                    const logDate = new Date(log.createdAt);
                    const formattedLogTime = logDate.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    });
                    const formattedLogDate = logDate.toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });

                    return (
                      <div key={log.id || index} className="relative group">
                        {/* Dot indicator */}
                        <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-white bg-indigo-600 shadow-xs" />

                        <div className="rounded-lg border border-zinc-200 bg-white p-3 space-y-1.5 shadow-2xs hover:border-zinc-300 transition-colors">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {getActionBadge(log.action)}
                              <span className="text-xs font-medium text-zinc-800">
                                by <strong>{log.byUsername || "system"}</strong>
                              </span>
                            </div>
                            <span className="text-[11px] text-zinc-500 font-mono">
                              {formattedLogDate} • {formattedLogTime}
                            </span>
                          </div>

                          {log.reason && (
                            <div className="rounded-md bg-zinc-50 border border-zinc-200/70 p-2 text-xs text-zinc-700 italic">
                              "{log.reason}"
                            </div>
                          )}

                          {/* Specific action diff snippets */}
                          {log.action === "REASSIGN" && log.before && log.after && (
                            <div className="text-[11px] text-zinc-600 pt-1 flex items-center gap-2">
                              <span className="text-zinc-500">Teacher:</span>
                              <span className="line-through text-red-500">
                                {log.before.teacher?.name || `ID: ${log.before.teacherId}`}
                              </span>
                              <ArrowRight className="h-3 w-3 text-zinc-400" />
                              <strong className="text-emerald-600">
                                {log.after.teacher?.name || `ID: ${log.after.teacherId}`}
                              </strong>
                            </div>
                          )}

                          {log.action === "RESCHEDULE" && log.before && log.after && (
                            <div className="text-[11px] text-zinc-600 pt-1">
                              Status changed from{" "}
                              <span className="font-semibold text-zinc-800">{log.before.status}</span> to{" "}
                              <span className="font-semibold text-amber-600">{log.after.status}</span>
                            </div>
                          )}

                          {log.action === "ADJUST" && (
                            <div className="text-[11px] text-zinc-600 pt-1">
                              Exam duty pay amount set to{" "}
                              <strong className="text-emerald-700">৳{session.payAmount}</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
}
