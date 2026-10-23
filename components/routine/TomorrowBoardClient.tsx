"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CalendarClock,
  Clock,
  Plus,
  Sparkles,
  User,
  Users,
  DoorOpen,
  DollarSign,
  Edit,
  Trash2,
  RefreshCw,
  AlertTriangle,
  History,
  UserCheck,
  XCircle,
  ArrowRight,
  Search,
  CheckCircle2,
  Layers,
  ArrowLeft,
  Calendar,
  Printer,
  MessageSquare,
  Bell,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import {
  getSessionsForDateAction,
  deleteSessionAction,
} from "@/app/actions/routine";
import {
  formatDhakaDate,
  formatTime12h,
  tomorrowDhaka,
  toDhakaDateString,
  todayDhaka,
} from "@/lib/dhaka-time";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SessionModal } from "./SessionModal";
import { ReassignModal } from "./ReassignModal";
import { RescheduleModal } from "./RescheduleModal";
import { CancelModal } from "./CancelModal";
import { SetDutyAmountModal } from "./SetDutyAmountModal";
import { SessionHistoryDrawer } from "./SessionHistoryDrawer";
import { RoutineTemplateManager } from "./RoutineTemplateManager";
import { WhatsAppDigestModal } from "./WhatsAppDigestModal";
import { NeedsAmountDutiesModal } from "./NeedsAmountDutiesModal";

interface TomorrowBoardClientProps {
  initialSessions: any[];
  tomorrowDate: string;
  metadata: {
    teachers: Array<{ id: number; name: string; mobile: string; perClass: number }>;
    batches: Array<{ id: number; name: string; code: number; classId: string; programId?: number | null }>;
    programs: Array<{ id: number; name: string; code: string; subjects: Array<{ id: number; name: string; code?: string | null }> }>;
    exams: Array<{ id: number; class: string; type: string; month: string }>;
    specialExams: Array<{ id: number; title: string; kind: string; batchId?: number | null; programId?: number | null }>;
  };
}

export function TomorrowBoardClient({
  initialSessions,
  tomorrowDate,
  metadata,
}: TomorrowBoardClientProps) {
  const [sessions, setSessions] = useState<any[]>(initialSessions);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("ALL");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("ALL");

  // Operational Modals
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [sessionModalMode, setSessionModalMode] = useState<"create" | "edit">("create");
  const [sessionModalKind, setSessionModalKind] = useState<"CLASS" | "EXAM_DUTY" | "EXTRA">("CLASS");
  const [activeSession, setActiveSession] = useState<any>(null);

  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isSetDutyOpen, setIsSetDutyOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isNeedsAmountModalOpen, setIsNeedsAmountModalOpen] = useState(false);

  const refreshSessions = async () => {
    setIsLoading(true);
    try {
      const res = await getSessionsForDateAction(tomorrowDate);
      if (res.success && res.data) {
        setSessions(res.data);
      } else {
        toast.error(res.error || "Failed to load tomorrow's schedule");
      }
    } catch {
      toast.error("Failed to refresh schedule");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (id: number) => {
    if (!confirm("Are you sure you want to permanently delete this unconducted session?")) return;
    try {
      const res = await deleteSessionAction(id);
      if (res.success) {
        toast.success("Session deleted");
        refreshSessions();
      } else {
        toast.error(res.error || "Failed to delete session");
      }
    } catch {
      toast.error("Failed to delete session");
    }
  };

  // Filtered sessions
  const filteredSessions = sessions.filter((s) => {
    if (selectedBatchId !== "ALL" && String(s.batchId) !== selectedBatchId) return false;
    if (selectedTeacherId !== "ALL" && String(s.teacherId) !== selectedTeacherId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSubject = s.subjectName?.toLowerCase().includes(q);
      const matchTeacher = s.teacher?.name?.toLowerCase().includes(q);
      const matchBatch = s.batch?.name?.toLowerCase().includes(q);
      const matchRoom = s.room?.toLowerCase().includes(q);
      const matchKind = s.kind?.toLowerCase().includes(q);
      if (!matchSubject && !matchTeacher && !matchBatch && !matchRoom && !matchKind) {
        return false;
      }
    }
    return true;
  });

  // Calculate stats
  const activeSessions = sessions.filter((s) => s.status !== "CANCELLED" && s.status !== "RESCHEDULED");
  const uniqueTeachers = new Set(activeSessions.map((s) => s.teacherId)).size;
  const uniqueBatches = new Set(activeSessions.map((s) => s.batchId).filter(Boolean)).size;
  const examDuties = activeSessions.filter((s) => s.kind === "EXAM_DUTY").length;
  const dutiesNeedingPay = activeSessions.filter(
    (s) => s.kind === "EXAM_DUTY" && (!s.payAmount || s.payAmount === 0)
  ).length;

  const teachersWithSessions = React.useMemo(() => {
    const map = new Map<number, { id: number; name: string; mobile?: string | null; whatsappNumber?: string | null; sessionCount: number }>();
    for (const s of activeSessions) {
      if (!s.teacherId || !s.teacher) continue;
      if (!map.has(s.teacherId)) {
        map.set(s.teacherId, {
          id: s.teacherId,
          name: s.teacher.name,
          mobile: s.teacher.mobile,
          whatsappNumber: (s.teacher as any).whatsappNumber,
          sessionCount: 0,
        });
      }
      map.get(s.teacherId)!.sessionCount++;
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [activeSessions]);

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
            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
              Next-Day Coordination
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2.5">
            <CalendarClock className="h-6 w-6 text-indigo-600" />
            Tomorrow Board
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Operational dashboard for <strong className="text-zinc-800">{formatDhakaDate(tomorrowDate)}</strong> (Dhaka BST). Review, reassign, reschedule, or cancel next-day sessions.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={refreshSessions}
            disabled={isLoading}
            className="text-xs h-9 gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Link href={`/admin-route/routine/print?mode=day&date=${tomorrowDate}`}>
            <Button size="sm" variant="outline" className="text-xs h-9 gap-1.5">
              <Printer className="h-3.5 w-3.5 text-zinc-600" />
              Print A4
            </Button>
          </Link>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsWhatsAppModalOpen(true)}
            disabled={teachersWithSessions.length === 0}
            className="text-xs h-9 gap-1.5 border-emerald-300 text-emerald-800 hover:bg-emerald-50"
          >
            <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
            WhatsApp All ({teachersWithSessions.length})
          </Button>

          <Link href="/admin-route/routine/notifications">
            <Button size="sm" variant="outline" className="text-xs h-9 gap-1.5">
              <Bell className="h-3.5 w-3.5 text-zinc-600" />
              Logs
            </Button>
          </Link>

          <Link href="/admin-route/routine/reports">
            <Button size="sm" variant="outline" className="text-xs h-9 gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-emerald-600" />
              Reports
            </Button>
          </Link>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsTemplateManagerOpen(true)}
            className="text-xs h-9 gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Templates
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setActiveSession(null);
              setSessionModalMode("create");
              setSessionModalKind("EXTRA");
              setIsSessionModalOpen(true);
            }}
            className="text-xs h-9 gap-1.5 border-amber-300 text-amber-900 hover:bg-amber-50"
          >
            <Plus className="h-3.5 w-3.5 text-amber-600" />
            Add Extra Class
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setActiveSession(null);
              setSessionModalMode("create");
              setSessionModalKind("CLASS");
              setIsSessionModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 gap-1.5 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Session
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="p-3.5 border-zinc-200 bg-white">
          <span className="text-[11px] font-medium text-zinc-500 block">Total Sessions</span>
          <div className="text-2xl font-bold text-zinc-900 mt-0.5">{activeSessions.length}</div>
        </Card>

        <Card className="p-3.5 border-zinc-200 bg-white">
          <span className="text-[11px] font-medium text-zinc-500 block">Teachers on Duty</span>
          <div className="text-2xl font-bold text-zinc-900 mt-0.5">{uniqueTeachers}</div>
        </Card>

        <Card className="p-3.5 border-zinc-200 bg-white">
          <span className="text-[11px] font-medium text-zinc-500 block">Batches Covered</span>
          <div className="text-2xl font-bold text-zinc-900 mt-0.5">{uniqueBatches}</div>
        </Card>

        <Card className="p-3.5 border-zinc-200 bg-white">
          <span className="text-[11px] font-medium text-zinc-500 block">Exam Duties</span>
          <div className="text-2xl font-bold text-indigo-600 mt-0.5">{examDuties}</div>
        </Card>

        <Card className={`p-3.5 border ${dutiesNeedingPay > 0 ? "border-amber-300 bg-amber-50/50" : "border-zinc-200 bg-white"}`}>
          <span className="text-[11px] font-medium text-zinc-500 block">Needs Pay Amount</span>
          <div className={`text-2xl font-bold mt-0.5 ${dutiesNeedingPay > 0 ? "text-amber-700" : "text-zinc-900"}`}>
            {dutiesNeedingPay}
          </div>
        </Card>
      </div>

      {/* Needs Pay Amount Alert */}
      {dutiesNeedingPay > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <div>
              <strong className="font-semibold">{dutiesNeedingPay} Exam Duty session(s) have no pay amount set.</strong>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Set duty pay amounts before day-close runs so teachers receive their correct remuneration.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsNeedsAmountModalOpen(true)}
            className="border-amber-400 bg-white text-amber-900 hover:bg-amber-100 text-xs shrink-0"
          >
            Review & Set Pay Now
          </Button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-zinc-200 bg-zinc-50/70">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-zinc-400" />
            <Input
              placeholder="Search subject, teacher, room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-8 bg-white"
            />
          </div>

          {/* Batch Filter */}
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs h-8 shadow-xs focus:border-indigo-500 focus:outline-hidden"
          >
            <option value="ALL">All Batches ({metadata.batches.length})</option>
            {metadata.batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} (Class {b.classId})
              </option>
            ))}
          </select>

          {/* Teacher Filter */}
          <select
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs h-8 shadow-xs focus:border-indigo-500 focus:outline-hidden"
          >
            <option value="ALL">All Teachers ({metadata.teachers.length})</option>
            {metadata.teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-zinc-500 font-medium">
          Showing <strong>{filteredSessions.length}</strong> of {sessions.length} sessions
        </span>
      </div>

      {/* Sessions Grid */}
      {filteredSessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center bg-white space-y-3">
          <CalendarDays className="h-10 w-10 text-zinc-300 mx-auto" />
          <h3 className="text-base font-semibold text-zinc-800">
            {sessions.length === 0 ? "No sessions planned for tomorrow yet" : "No matching sessions found"}
          </h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            {sessions.length === 0
              ? "Generate sessions from weekly repeat templates or add tomorrow's classes manually to prepare the schedule before the 19:00 digest."
              : "Try adjusting your search query or filters to find what you are looking for."}
          </p>
          {sessions.length === 0 && (
            <div className="flex justify-center gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsTemplateManagerOpen(true)}
                className="text-xs gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Generate from Templates
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setActiveSession(null);
                  setSessionModalMode("create");
                  setSessionModalKind("CLASS");
                  setIsSessionModalOpen(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Add First Class
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSessions.map((session) => {
            const isCancelled = session.status === "CANCELLED";
            const isRescheduled = session.status === "RESCHEDULED";
            const isConducted = session.status === "CONDUCTED";
            const isExtra = session.kind === "EXTRA";
            const isDuty = session.kind === "EXAM_DUTY";

            return (
              <Card
                key={session.id}
                className={`overflow-hidden transition-all border ${
                  isCancelled
                    ? "border-red-200 bg-red-50/20 opacity-75"
                    : isRescheduled
                    ? "border-amber-200 bg-amber-50/20 opacity-80"
                    : isDuty
                    ? "border-indigo-200 bg-white hover:border-indigo-300"
                    : isExtra
                    ? "border-amber-300 bg-white hover:border-amber-400"
                    : "border-zinc-200 bg-white hover:border-zinc-300 shadow-2xs"
                }`}
              >
                <CardHeader className="p-4 pb-2 space-y-1.5 border-b border-zinc-100">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-zinc-900">
                          {session.subjectName || (isDuty ? "Exam Duty" : "Class")}
                        </span>
                        {isDuty && (
                          <Badge className="bg-indigo-100 text-indigo-800 text-[10px] px-1.5 py-0">
                            Duty
                          </Badge>
                        )}
                        {isExtra && (
                          <Badge className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0">
                            Extra
                          </Badge>
                        )}
                      </div>
                      {session.lectureLabel && (
                        <p className="text-xs text-zinc-500 line-clamp-1">Topic: {session.lectureLabel}</p>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isCancelled ? (
                        <Badge className="bg-red-100 text-red-700 text-[10px]">Cancelled</Badge>
                      ) : isRescheduled ? (
                        <Badge className="bg-amber-100 text-amber-700 text-[10px]">Rescheduled</Badge>
                      ) : isConducted ? (
                        <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Conducted</Badge>
                      ) : (
                        <Badge className="bg-blue-50 text-blue-700 text-[10px]">Scheduled</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-3 text-xs">
                  {/* Time and Room */}
                  <div className="flex items-center justify-between text-zinc-600 bg-zinc-50/80 p-2 rounded-md">
                    <span className="font-medium flex items-center gap-1.5 text-zinc-900">
                      <Clock className="h-3.5 w-3.5 text-indigo-500" />
                      {formatTime12h(session.startTime)}
                      {session.endTime ? ` - ${formatTime12h(session.endTime)}` : ""}
                    </span>
                    <span className="flex items-center gap-1 text-zinc-500">
                      <DoorOpen className="h-3.5 w-3.5" />
                      {session.room || "Room TBA"}
                    </span>
                  </div>

                  {/* Teacher & Batch */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-zinc-400" />
                        Teacher:
                      </span>
                      <strong className="text-zinc-900 font-semibold">{session.teacher?.name}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-zinc-400" />
                        Batch / Exam:
                      </span>
                      <strong className="text-zinc-800">
                        {session.batch?.name || session.specialExam?.title || session.exam?.type || "General"}
                      </strong>
                    </div>

                    {/* Duty Pay Amount indicator */}
                    {isDuty && (
                      <div className="flex items-center justify-between pt-1 border-t border-zinc-100">
                        <span className="text-zinc-500 flex items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                          Duty Pay:
                        </span>
                        {session.payAmount ? (
                          <span className="font-bold text-emerald-700">৳{session.payAmount}</span>
                        ) : (
                          <Badge variant="outline" className="text-amber-700 border-amber-300 text-[10px] bg-amber-50">
                            Needs Amount
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Reason banner if present */}
                  {session.changeReason && (
                    <div className="rounded bg-zinc-50 border border-zinc-200 p-2 text-[11px] text-zinc-600 italic">
                      Note: "{session.changeReason}"
                    </div>
                  )}

                  {/* Operational Action Buttons */}
                  <div className="pt-2 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-1">
                    <div className="flex items-center gap-1">
                      {/* Reassign */}
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isCancelled || isRescheduled}
                        onClick={() => {
                          setActiveSession(session);
                          setIsReassignOpen(true);
                        }}
                        className="h-7 px-2 text-[11px] text-indigo-700 hover:bg-indigo-50 gap-1"
                        title="Reassign Teacher"
                      >
                        <UserCheck className="h-3 w-3" />
                        Reassign
                      </Button>

                      {/* Reschedule */}
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isCancelled || isRescheduled}
                        onClick={() => {
                          setActiveSession(session);
                          setIsRescheduleOpen(true);
                        }}
                        className="h-7 px-2 text-[11px] text-amber-700 hover:bg-amber-50 gap-1"
                        title="Reschedule Class"
                      >
                        <CalendarClock className="h-3 w-3" />
                        Reschedule
                      </Button>

                      {/* Cancel */}
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isCancelled || isRescheduled}
                        onClick={() => {
                          setActiveSession(session);
                          setIsCancelOpen(true);
                        }}
                        className="h-7 px-2 text-[11px] text-red-600 hover:bg-red-50 gap-1"
                        title="Cancel Session"
                      >
                        <XCircle className="h-3 w-3" />
                        Cancel
                      </Button>

                      {/* Set Duty Pay (for duties) */}
                      {isDuty && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setActiveSession(session);
                            setIsSetDutyOpen(true);
                          }}
                          className="h-7 px-2 text-[11px] text-emerald-700 hover:bg-emerald-50 gap-1"
                          title="Set Duty Pay Amount"
                        >
                          <DollarSign className="h-3 w-3" />
                          Pay
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {/* History */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setActiveSession(session);
                          setIsHistoryOpen(true);
                        }}
                        className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
                        title="View Change History"
                      >
                        <History className="h-3.5 w-3.5" />
                      </Button>

                      {/* Edit */}
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isCancelled || isRescheduled}
                        onClick={() => {
                          setActiveSession(session);
                          setSessionModalMode("edit");
                          setIsSessionModalOpen(true);
                        }}
                        className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
                        title="Edit Session Details"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>

                      {/* Delete */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteSession(session.id)}
                        className="h-7 w-7 p-0 text-zinc-400 hover:text-red-600 hover:bg-red-50"
                        title="Delete Session"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Operational Dialogs */}
      {isSessionModalOpen && (
        <SessionModal
          isOpen={isSessionModalOpen}
          onClose={() => {
            setIsSessionModalOpen(false);
            setActiveSession(null);
          }}
          mode={sessionModalMode}
          sessionData={activeSession}
          initialDate={tomorrowDate}
          metadata={metadata}
          onSuccess={refreshSessions}
        />
      )}

      {isReassignOpen && activeSession && (
        <ReassignModal
          isOpen={isReassignOpen}
          onClose={() => {
            setIsReassignOpen(false);
            setActiveSession(null);
          }}
          session={activeSession}
          teachers={metadata.teachers}
          onSuccess={refreshSessions}
        />
      )}

      {isRescheduleOpen && activeSession && (
        <RescheduleModal
          isOpen={isRescheduleOpen}
          onClose={() => {
            setIsRescheduleOpen(false);
            setActiveSession(null);
          }}
          session={activeSession}
          onSuccess={refreshSessions}
        />
      )}

      {isCancelOpen && activeSession && (
        <CancelModal
          isOpen={isCancelOpen}
          onClose={() => {
            setIsCancelOpen(false);
            setActiveSession(null);
          }}
          session={activeSession}
          onSuccess={refreshSessions}
        />
      )}

      {isSetDutyOpen && activeSession && (
        <SetDutyAmountModal
          isOpen={isSetDutyOpen}
          onClose={() => {
            setIsSetDutyOpen(false);
            setActiveSession(null);
          }}
          session={activeSession}
          onSuccess={refreshSessions}
        />
      )}

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
            if (s) {
              setActiveSession(s);
            }
          }}
        />
      )}

      {isTemplateManagerOpen && (
        <RoutineTemplateManager
          isOpen={isTemplateManagerOpen}
          onClose={() => setIsTemplateManagerOpen(false)}
          metadata={{
            teachers: metadata.teachers,
            batches: metadata.batches,
          }}
          onSessionsGenerated={refreshSessions}
        />
      )}

      {isWhatsAppModalOpen && (
        <WhatsAppDigestModal
          isOpen={isWhatsAppModalOpen}
          onClose={() => setIsWhatsAppModalOpen(false)}
          tomorrowDate={tomorrowDate}
          teachersWithSessions={teachersWithSessions}
          onSuccess={refreshSessions}
        />
      )}

      {isNeedsAmountModalOpen && (
        <NeedsAmountDutiesModal
          isOpen={isNeedsAmountModalOpen}
          onClose={() => setIsNeedsAmountModalOpen(false)}
          onSuccess={refreshSessions}
        />
      )}
    </div>
  );
}
