"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CalendarDays,
  CalendarClock,
  Clock,
  Plus,
  Copy,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  User,
  Users,
  DoorOpen,
  DollarSign,
  Edit,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Layers,
  ArrowUpDown,
  BookOpen,
  Printer,
  UserCheck,
  XCircle,
  History,
  Bell,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import {
  getSessionsForDateAction,
  deleteSessionAction,
  copySessionsAction,
} from "@/app/actions/routine";
import {
  formatDhakaDate,
  formatTime12h,
  addDaysDhaka,
  todayDhaka,
  tomorrowDhaka,
} from "@/lib/dhaka-time";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SessionModal } from "./SessionModal";
import { RoutineTemplateManager } from "./RoutineTemplateManager";
import { ReassignModal } from "./ReassignModal";
import { RescheduleModal } from "./RescheduleModal";
import { CancelModal } from "./CancelModal";
import { SetDutyAmountModal } from "./SetDutyAmountModal";
import { SessionHistoryDrawer } from "./SessionHistoryDrawer";

interface DayPlannerProps {
  initialDate: string;
  initialSessions: any[];
  metadata: {
    teachers: Array<{ id: number; name: string; mobile: string; perClass: number }>;
    batches: Array<{ id: number; name: string; code: number; classId: string; programId?: number | null }>;
    programs: Array<{ id: number; name: string; code: string; subjects: Array<{ id: number; name: string; code?: string | null }> }>;
    exams: Array<{ id: number; class: string; type: string; month: string }>;
    specialExams: Array<{ id: number; title: string; kind: string; batchId?: number | null; programId?: number | null }>;
  };
}

export function DayPlannerClient({
  initialDate,
  initialSessions,
  metadata,
}: DayPlannerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentDate, setCurrentDate] = useState<string>(
    searchParams.get("date") || initialDate
  );
  const [sessions, setSessions] = useState<any[]>(initialSessions);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"batch" | "teacher" | "timeline">("batch");

  // Modals state
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [sessionModalMode, setSessionModalMode] = useState<"create" | "edit">("create");
  const [activeSession, setActiveSession] = useState<any>(null);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);

  // Phase 3 Change Modals & Drawer
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isSetDutyOpen, setIsSetDutyOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Copy dropdown
  const [isCopying, setIsCopying] = useState(false);

  const loadSessions = async (dateStr: string) => {
    setIsLoading(true);
    try {
      const res = await getSessionsForDateAction(dateStr);
      if (res.success && res.data) {
        setSessions(res.data);
      } else {
        toast.error(res.error || "Failed to load sessions");
      }
    } catch {
      toast.error("Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (newDate: string) => {
    setCurrentDate(newDate);
    router.replace(`/admin-route/routine?date=${newDate}`, { scroll: false });
    loadSessions(newDate);
  };

  const handlePrevDay = () => handleDateChange(addDaysDhaka(currentDate, -1));
  const handleNextDay = () => handleDateChange(addDaysDhaka(currentDate, 1));
  const handleToday = () => handleDateChange(todayDhaka());
  const handleTomorrow = () => handleDateChange(tomorrowDhaka());

  const handleOpenAddSession = (kind: "CLASS" | "EXAM_DUTY") => {
    setActiveSession(kind === "EXAM_DUTY" ? { kind: "EXAM_DUTY" } : { kind: "CLASS" });
    setSessionModalMode("create");
    setIsSessionModalOpen(true);
  };

  const handleOpenEditSession = (session: any) => {
    setActiveSession(session);
    setSessionModalMode("edit");
    setIsSessionModalOpen(true);
  };

  const handleDeleteSession = async (id: number) => {
    if (!confirm("Are you sure you want to remove this session?")) return;
    try {
      const res = await deleteSessionAction(id);
      if (res.success) {
        setSessions((prev) => prev.filter((s) => s.id !== id));
        toast.success("Session deleted");
      } else {
        toast.error(res.error || "Failed to delete session");
      }
    } catch {
      toast.error("Failed to delete session");
    }
  };

  const handleCopyYesterday = async () => {
    const yesterday = addDaysDhaka(currentDate, -1);
    setIsCopying(true);
    try {
      const res = await copySessionsAction({
        sourceDate: yesterday,
        targetDate: currentDate,
      });

      if (res.success && res.data) {
        toast.success(
          `Copied ${res.data.createdCount} sessions from yesterday (${res.data.skippedCount} duplicates skipped).`
        );
        await loadSessions(currentDate);
      } else {
        toast.error(res.error || "Failed to copy yesterday's sessions");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to copy sessions");
    } finally {
      setIsCopying(false);
    }
  };

  const handleCopyLastWeek = async () => {
    const lastWeekSameDay = addDaysDhaka(currentDate, -7);
    setIsCopying(true);
    try {
      const res = await copySessionsAction({
        sourceDate: lastWeekSameDay,
        targetDate: currentDate,
      });

      if (res.success && res.data) {
        toast.success(
          `Copied ${res.data.createdCount} sessions from ${formatDhakaDate(lastWeekSameDay, "short")} (${res.data.skippedCount} duplicates skipped).`
        );
        await loadSessions(currentDate);
      } else {
        toast.error(res.error || "Failed to copy sessions");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to copy sessions");
    } finally {
      setIsCopying(false);
    }
  };

  // Groupings
  const batchesList = metadata.batches;
  const teachersList = metadata.teachers;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <CalendarClock className="h-5 w-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
                Class Routine & Day Planner
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500">
              Manage daily class schedules, assign faculty, schedule exam duties, and coordinate batch routines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin-route/routine/tomorrow">
              <Button
                variant="outline"
                size="sm"
                className="text-xs bg-indigo-50/80 text-indigo-700 border-indigo-200 hover:bg-indigo-100 hover:text-indigo-800"
              >
                <CalendarClock className="h-4 w-4 mr-1.5 text-indigo-600" />
                Tomorrow Board
              </Button>
            </Link>

            <Link href={`/admin-route/routine/print?mode=day&date=${currentDate}`}>
              <Button variant="outline" size="sm" className="text-xs">
                <Printer className="h-3.5 w-3.5 mr-1.5 text-zinc-600" />
                Print A4
              </Button>
            </Link>

            <Link href="/admin-route/routine/notifications">
              <Button variant="outline" size="sm" className="text-xs">
                <Bell className="h-3.5 w-3.5 mr-1.5 text-zinc-600" />
                Notification Log
              </Button>
            </Link>

            <Link href="/admin-route/routine/reports">
              <Button variant="outline" size="sm" className="text-xs">
                <BarChart3 className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                Reports
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTemplateManagerOpen(true)}
              className="text-xs"
            >
              <CalendarDays className="h-4 w-4 mr-1.5 text-indigo-600" />
              Weekly Templates
            </Button>

            <div className="relative inline-block text-left">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyYesterday}
                disabled={isCopying}
                className="text-xs"
                title="Copy all active classes from yesterday into today"
              >
                <Copy className={`h-3.5 w-3.5 mr-1.5 ${isCopying ? "animate-spin" : ""}`} />
                Copy Yesterday
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenAddSession("EXAM_DUTY")}
              className="text-xs bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100"
            >
              <Plus className="h-4 w-4 mr-1" />
              + Exam Duty
            </Button>

            <Button
              size="sm"
              onClick={() => handleOpenAddSession("CLASS")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs shadow-xs"
            >
              <Plus className="h-4 w-4 mr-1" />
              + Add Class
            </Button>
          </div>
        </div>

        {/* Date Navigator Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-100">
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevDay}
              className="h-8 w-8 p-0"
              title="Previous Day"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Input
              type="date"
              value={currentDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-36 h-8 text-xs font-medium"
            />

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextDay}
              className="h-8 w-8 p-0"
              title="Next Day"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToday}
                className={`text-xs h-8 px-2.5 ${
                  currentDate === todayDhaka() ? "bg-indigo-50 text-indigo-700 font-semibold" : ""
                }`}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTomorrow}
                className={`text-xs h-8 px-2.5 ${
                  currentDate === tomorrowDhaka() ? "bg-indigo-50 text-indigo-700 font-semibold" : ""
                }`}
              >
                Tomorrow
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            <div className="text-xs font-medium text-zinc-700">
              <span>{formatDhakaDate(currentDate, "full")}</span>
              <span className="mx-2 text-zinc-300">•</span>
              <span className="font-bold text-indigo-600">{sessions.length} Sessions</span>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setViewMode("batch")}
                className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                  viewMode === "batch"
                    ? "bg-white text-zinc-900 shadow-2xs font-semibold"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                By Batch
              </button>
              <button
                type="button"
                onClick={() => setViewMode("teacher")}
                className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                  viewMode === "teacher"
                    ? "bg-white text-zinc-900 shadow-2xs font-semibold"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                By Faculty
              </button>
              <button
                type="button"
                onClick={() => setViewMode("timeline")}
                className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                  viewMode === "timeline"
                    ? "bg-white text-zinc-900 shadow-2xs font-semibold"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Timeline
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Sessions Container */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-zinc-500">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-600" />
          Loading class routine...
        </div>
      ) : sessions.length === 0 ? (
        /* Empty State */
        <Card className="border border-zinc-200 text-center py-16">
          <CardContent className="space-y-4">
            <div className="p-3 bg-zinc-50 text-zinc-400 rounded-2xl w-fit mx-auto border border-zinc-200/80">
              <CalendarDays className="h-10 w-10" />
            </div>
            <div>
              <p className="text-zinc-800 font-semibold text-base">
                No classes scheduled for {formatDhakaDate(currentDate, "medium")}
              </p>
              <p className="text-zinc-400 text-xs mt-1 max-w-sm mx-auto">
                Plan this day quickly by adding a new class session, scheduling exam duties, or copying from yesterday.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyYesterday}
                disabled={isCopying}
                className="text-xs"
              >
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copy Yesterday&apos;s Routine
              </Button>
              <Button
                size="sm"
                onClick={() => handleOpenAddSession("CLASS")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add First Class
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* SESSIONS DISPLAY */
        <div className="space-y-6">
          {/* VIEW MODE 1: BY BATCH */}
          {viewMode === "batch" && (
            <div className="space-y-5">
              {batchesList.map((batch) => {
                const batchSessions = sessions.filter((s) => s.batchId === batch.id);
                if (batchSessions.length === 0) return null;

                return (
                  <Card key={batch.id} className="border border-zinc-200 shadow-2xs overflow-hidden">
                    <CardHeader className="py-3 px-4 bg-zinc-50/80 border-b border-zinc-100 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-zinc-900">
                          Batch {batch.name}
                        </span>
                        <Badge variant="outline" className="text-[10px] bg-white">
                          Class {batch.classId}
                        </Badge>
                      </div>
                      <span className="text-xs text-zinc-500 font-medium">
                        {batchSessions.length} session{batchSessions.length === 1 ? "" : "s"}
                      </span>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {batchSessions.map((session) => (
                          <SessionCard
                            key={session.id}
                            session={session}
                            onEdit={() => handleOpenEditSession(session)}
                            onDelete={() => handleDeleteSession(session.id)}
                            onReassign={() => {
                              setActiveSession(session);
                              setIsReassignOpen(true);
                            }}
                            onReschedule={() => {
                              setActiveSession(session);
                              setIsRescheduleOpen(true);
                            }}
                            onCancel={() => {
                              setActiveSession(session);
                              setIsCancelOpen(true);
                            }}
                            onSetDuty={() => {
                              setActiveSession(session);
                              setIsSetDutyOpen(true);
                            }}
                            onHistory={() => {
                              setActiveSession(session);
                              setIsHistoryOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Unassigned or General Exam Duties with no batch */}
              {sessions.filter((s) => !s.batchId).length > 0 && (
                <Card className="border border-amber-200 bg-amber-50/30 shadow-2xs overflow-hidden">
                  <CardHeader className="py-3 px-4 bg-amber-50/80 border-b border-amber-200 flex flex-row items-center justify-between">
                    <span className="font-bold text-sm text-amber-950">
                      General Exam Duties (No Batch Assigned)
                    </span>
                    <span className="text-xs text-amber-800 font-medium">
                      {sessions.filter((s) => !s.batchId).length} sessions
                    </span>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {sessions
                        .filter((s) => !s.batchId)
                        .map((session) => (
                          <SessionCard
                            key={session.id}
                            session={session}
                            onEdit={() => handleOpenEditSession(session)}
                            onDelete={() => handleDeleteSession(session.id)}
                            onReassign={() => {
                              setActiveSession(session);
                              setIsReassignOpen(true);
                            }}
                            onReschedule={() => {
                              setActiveSession(session);
                              setIsRescheduleOpen(true);
                            }}
                            onCancel={() => {
                              setActiveSession(session);
                              setIsCancelOpen(true);
                            }}
                            onSetDuty={() => {
                              setActiveSession(session);
                              setIsSetDutyOpen(true);
                            }}
                            onHistory={() => {
                              setActiveSession(session);
                              setIsHistoryOpen(true);
                            }}
                          />
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* VIEW MODE 2: BY TEACHER */}
          {viewMode === "teacher" && (
            <div className="space-y-5">
              {teachersList.map((teacher) => {
                const teacherSessions = sessions.filter((s) => s.teacherId === teacher.id);
                if (teacherSessions.length === 0) return null;

                return (
                  <Card key={teacher.id} className="border border-zinc-200 shadow-2xs overflow-hidden">
                    <CardHeader className="py-3 px-4 bg-zinc-50/80 border-b border-zinc-100 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-bold text-sm text-zinc-900">{teacher.name}</span>
                          <span className="text-xs text-zinc-400 ml-2 font-mono">
                            {teacher.mobile}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs bg-white">
                        {teacherSessions.length} session{teacherSessions.length === 1 ? "" : "s"}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {teacherSessions.map((session) => (
                          <SessionCard
                            key={session.id}
                            session={session}
                            onEdit={() => handleOpenEditSession(session)}
                            onDelete={() => handleDeleteSession(session.id)}
                            onReassign={() => {
                              setActiveSession(session);
                              setIsReassignOpen(true);
                            }}
                            onReschedule={() => {
                              setActiveSession(session);
                              setIsRescheduleOpen(true);
                            }}
                            onCancel={() => {
                              setActiveSession(session);
                              setIsCancelOpen(true);
                            }}
                            onSetDuty={() => {
                              setActiveSession(session);
                              setIsSetDutyOpen(true);
                            }}
                            onHistory={() => {
                              setActiveSession(session);
                              setIsHistoryOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* VIEW MODE 3: TIMELINE (CHRONOLOGICAL) */}
          {viewMode === "timeline" && (
            <Card className="border border-zinc-200 shadow-2xs">
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      onEdit={() => handleOpenEditSession(session)}
                      onDelete={() => handleDeleteSession(session.id)}
                      onReassign={() => {
                        setActiveSession(session);
                        setIsReassignOpen(true);
                      }}
                      onReschedule={() => {
                        setActiveSession(session);
                        setIsRescheduleOpen(true);
                      }}
                      onCancel={() => {
                        setActiveSession(session);
                        setIsCancelOpen(true);
                      }}
                      onSetDuty={() => {
                        setActiveSession(session);
                        setIsSetDutyOpen(true);
                      }}
                      onHistory={() => {
                        setActiveSession(session);
                        setIsHistoryOpen(true);
                      }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* SESSION CREATE/EDIT MODAL */}
      {isSessionModalOpen && (
        <SessionModal
          isOpen={isSessionModalOpen}
          onClose={() => setIsSessionModalOpen(false)}
          onSuccess={() => loadSessions(currentDate)}
          initialDate={currentDate}
          mode={sessionModalMode}
          sessionData={activeSession}
          metadata={metadata}
        />
      )}

      {/* ROUTINE TEMPLATE MANAGER MODAL */}
      {isTemplateManagerOpen && (
        <RoutineTemplateManager
          isOpen={isTemplateManagerOpen}
          onClose={() => setIsTemplateManagerOpen(false)}
          metadata={{
            teachers: metadata.teachers,
            batches: metadata.batches,
          }}
          onSessionsGenerated={() => loadSessions(currentDate)}
        />
      )}

      {/* REASSIGN MODAL */}
      {isReassignOpen && activeSession && (
        <ReassignModal
          isOpen={isReassignOpen}
          onClose={() => {
            setIsReassignOpen(false);
            setActiveSession(null);
          }}
          session={activeSession}
          teachers={metadata.teachers}
          onSuccess={() => loadSessions(currentDate)}
        />
      )}

      {/* RESCHEDULE MODAL */}
      {isRescheduleOpen && activeSession && (
        <RescheduleModal
          isOpen={isRescheduleOpen}
          onClose={() => {
            setIsRescheduleOpen(false);
            setActiveSession(null);
          }}
          session={activeSession}
          onSuccess={() => loadSessions(currentDate)}
        />
      )}

      {/* CANCEL MODAL */}
      {isCancelOpen && activeSession && (
        <CancelModal
          isOpen={isCancelOpen}
          onClose={() => {
            setIsCancelOpen(false);
            setActiveSession(null);
          }}
          session={activeSession}
          onSuccess={() => loadSessions(currentDate)}
        />
      )}

      {/* SET DUTY AMOUNT MODAL */}
      {isSetDutyOpen && activeSession && (
        <SetDutyAmountModal
          isOpen={isSetDutyOpen}
          onClose={() => {
            setIsSetDutyOpen(false);
            setActiveSession(null);
          }}
          session={activeSession}
          onSuccess={() => loadSessions(currentDate)}
        />
      )}

      {/* SESSION HISTORY DRAWER */}
      {isHistoryOpen && activeSession && (
        <SessionHistoryDrawer
          isOpen={isHistoryOpen}
          onClose={() => {
            setIsHistoryOpen(false);
            setActiveSession(null);
          }}
          sessionId={activeSession.id}
          onSelectSession={(id) => {
            const s = sessions.find((item) => item.id === id);
            if (s) setActiveSession(s);
          }}
        />
      )}
    </div>
  );
}

// Single Session Card Component
function SessionCard({
  session,
  onEdit,
  onDelete,
  onReassign,
  onReschedule,
  onCancel,
  onSetDuty,
  onHistory,
}: {
  session: any;
  onEdit: () => void;
  onDelete: () => void;
  onReassign?: () => void;
  onReschedule?: () => void;
  onCancel?: () => void;
  onSetDuty?: () => void;
  onHistory?: () => void;
}) {
  const isDuty = session.kind === "EXAM_DUTY";
  const isExtra = session.kind === "EXTRA";
  const isCancelled = session.status === "CANCELLED";
  const isRescheduled = session.status === "RESCHEDULED";
  const isConducted = session.status === "CONDUCTED";

  return (
    <div
      className={`p-3.5 rounded-xl border transition-all text-xs space-y-2.5 relative group ${
        isCancelled
          ? "bg-rose-50/50 border-rose-200 opacity-75"
          : isRescheduled
          ? "bg-zinc-50 border-zinc-200 opacity-60"
          : isDuty
          ? "bg-amber-50/40 border-amber-200/80 hover:border-amber-300"
          : isExtra
          ? "bg-purple-50/30 border-purple-200/80 hover:border-purple-300"
          : "bg-white border-zinc-200 hover:border-zinc-300 shadow-2xs"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-bold text-sm text-zinc-900 truncate">
            {session.subjectName || session.kind}
          </span>
          {session.lectureLabel && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-zinc-50 font-mono">
              {session.lectureLabel}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isDuty && (
            <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] hover:bg-amber-100">
              Exam Duty
            </Badge>
          )}
          {isExtra && (
            <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-[10px] hover:bg-purple-100">
              Extra Class
            </Badge>
          )}
          {isCancelled && (
            <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-[10px] hover:bg-rose-100">
              Cancelled
            </Badge>
          )}
          {isRescheduled && (
            <Badge className="bg-zinc-200 text-zinc-700 border-zinc-300 text-[10px] hover:bg-zinc-200">
              Rescheduled
            </Badge>
          )}
          {isConducted && (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] hover:bg-emerald-100">
              Conducted
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-1 text-zinc-600">
        <div className="flex items-center gap-1.5 text-zinc-900 font-medium">
          <Clock className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
          <span>
            {formatTime12h(session.startTime)}
            {session.endTime ? ` - ${formatTime12h(session.endTime)}` : ""}
          </span>
        </div>

        <div className="flex items-center gap-1.5 truncate">
          <User className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
          <span className="truncate">{session.teacher?.name || "Unassigned"}</span>
        </div>

        {session.batch && (
          <div className="flex items-center gap-1.5 text-zinc-500">
            <Users className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span>
              Batch {session.batch.name} (Class {session.batch.classId})
            </span>
          </div>
        )}

        {session.room && (
          <div className="flex items-center gap-1.5 text-zinc-500">
            <DoorOpen className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span>Room: {session.room}</span>
          </div>
        )}

        {isDuty && session.payAmount && (
          <div className="flex items-center gap-1 text-emerald-700 font-semibold">
            <DollarSign className="h-3 w-3" />
            <span>Duty Pay: ৳{session.payAmount}</span>
          </div>
        )}

        {session.changeReason && (
          <p className="text-[11px] text-zinc-500 italic pt-1 border-t border-zinc-100 line-clamp-1">
            Note: {session.changeReason}
          </p>
        )}
      </div>

      {/* Operational Actions */}
      <div className="flex items-center justify-between gap-1 pt-2 border-t border-zinc-100">
        <div className="flex items-center gap-0.5">
          {onReassign && !isCancelled && !isRescheduled && (
            <button
              onClick={onReassign}
              className="p-1 text-zinc-400 hover:text-indigo-600 rounded hover:bg-indigo-50 transition-colors"
              title="Reassign Teacher"
            >
              <UserCheck className="h-3.5 w-3.5" />
            </button>
          )}

          {onReschedule && !isCancelled && !isRescheduled && (
            <button
              onClick={onReschedule}
              className="p-1 text-zinc-400 hover:text-amber-600 rounded hover:bg-amber-50 transition-colors"
              title="Reschedule Class"
            >
              <CalendarClock className="h-3.5 w-3.5" />
            </button>
          )}

          {onCancel && !isCancelled && !isRescheduled && (
            <button
              onClick={onCancel}
              className="p-1 text-zinc-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
              title="Cancel Session"
            >
              <XCircle className="h-3.5 w-3.5" />
            </button>
          )}

          {isDuty && onSetDuty && (
            <button
              onClick={onSetDuty}
              className="p-1 text-zinc-400 hover:text-emerald-600 rounded hover:bg-emerald-50 transition-colors"
              title="Set Duty Pay Amount"
            >
              <DollarSign className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-0.5">
          {onHistory && (
            <button
              onClick={onHistory}
              className="p-1 text-zinc-400 hover:text-zinc-700 rounded hover:bg-zinc-100 transition-colors"
              title="View Change Audit History"
            >
              <History className="h-3.5 w-3.5" />
            </button>
          )}

          {!isConducted && (
            <>
              <button
                onClick={onEdit}
                className="p-1 text-zinc-400 hover:text-indigo-600 rounded hover:bg-indigo-50 transition-colors"
                title="Edit session details"
              >
                <Edit className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={onDelete}
                className="p-1 text-zinc-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                title="Delete session"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
