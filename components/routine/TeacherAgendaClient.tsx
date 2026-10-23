"use client";

import React, { useState } from "react";
import {
  CalendarDays,
  CalendarClock,
  Clock,
  User,
  Users,
  DoorOpen,
  DollarSign,
  Layers,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Calendar,
  XCircle,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { formatTime12h, formatDhakaDate, toDhakaDateString, todayDhaka, tomorrowDhaka } from "@/lib/dhaka-time";
import { getTeacherAgendaAction, getBatchRoutineAction } from "@/app/actions/routine";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface TeacherAgendaClientProps {
  initialData: {
    teacher: any;
    range: string;
    dates: string[];
    sessions: any[];
  };
  batches: Array<{ id: number; name: string; code: number; classId: string }>;
}

export function TeacherAgendaClient({ initialData, batches }: TeacherAgendaClientProps) {
  const [activeTab, setActiveTab] = useState<"agenda" | "batch_routine">("agenda");
  const [agendaRange, setAgendaRange] = useState<"today" | "tomorrow" | "week">("today");
  const [sessions, setSessions] = useState<any[]>(initialData.sessions || []);
  const [dates, setDates] = useState<string[]>(initialData.dates || []);
  const [isLoading, setIsLoading] = useState(false);

  // Batch routine state
  const [selectedBatchId, setSelectedBatchId] = useState<number>(batches[0]?.id || 0);
  const [batchSessions, setBatchSessions] = useState<any[]>([]);
  const [batchDates, setBatchDates] = useState<string[]>([]);
  const [batchInfo, setBatchInfo] = useState<any>(null);
  const [isLoadingBatch, setIsLoadingBatch] = useState(false);

  const teacher = initialData.teacher;

  const handleAgendaRangeChange = async (range: "today" | "tomorrow" | "week") => {
    setAgendaRange(range);
    setIsLoading(true);
    try {
      const res = await getTeacherAgendaAction(range);
      if (res.success && res.data) {
        setSessions(res.data.sessions || []);
        setDates(res.data.dates || []);
      } else {
        toast.error(res.error || "Failed to load agenda");
      }
    } catch {
      toast.error("Failed to load agenda");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadBatchRoutine = async (batchId: number) => {
    setSelectedBatchId(batchId);
    setIsLoadingBatch(true);
    try {
      const res = await getBatchRoutineAction(batchId, "week");
      if (res.success && res.data) {
        setBatchSessions(res.data.sessions || []);
        setBatchDates(res.data.dates || []);
        setBatchInfo(res.data.batch);
      } else {
        toast.error(res.error || "Failed to load batch routine");
      }
    } catch {
      toast.error("Failed to load batch routine");
    } finally {
      setIsLoadingBatch(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">Scheduled</Badge>;
      case "CONDUCTED":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">Conducted</Badge>;
      case "CANCELLED":
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px]">Cancelled</Badge>;
      case "RESCHEDULED":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">Rescheduled</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <CalendarClock className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Faculty Routine & Agenda</h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500">
            Welcome, <strong>{teacher?.name || "Teacher"}</strong>. Review your scheduled classes, exam duties, and batch routines.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-zinc-100/80 p-1 rounded-xl self-start sm:self-center">
          <Button
            size="sm"
            variant={activeTab === "agenda" ? "default" : "ghost"}
            onClick={() => setActiveTab("agenda")}
            className={`text-xs h-8 ${activeTab === "agenda" ? "bg-white text-zinc-900 shadow-xs hover:bg-white" : "text-zinc-600"}`}
          >
            <Calendar className="h-3.5 w-3.5 mr-1.5 text-indigo-600" />
            My Agenda
          </Button>
          <Button
            size="sm"
            variant={activeTab === "batch_routine" ? "default" : "ghost"}
            onClick={() => {
              setActiveTab("batch_routine");
              if (batchSessions.length === 0 && selectedBatchId) {
                handleLoadBatchRoutine(selectedBatchId);
              }
            }}
            className={`text-xs h-8 ${activeTab === "batch_routine" ? "bg-white text-zinc-900 shadow-xs hover:bg-white" : "text-zinc-600"}`}
          >
            <Layers className="h-3.5 w-3.5 mr-1.5 text-indigo-600" />
            Batch Routine
          </Button>
        </div>
      </div>

      {/* TAB 1: MY AGENDA */}
      {activeTab === "agenda" && (
        <div className="space-y-5">
          {/* Range Sub-tabs */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg">
              <button
                onClick={() => handleAgendaRangeChange("today")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  agendaRange === "today" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Today
              </button>
              <button
                onClick={() => handleAgendaRangeChange("tomorrow")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  agendaRange === "tomorrow" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Tomorrow
              </button>
              <button
                onClick={() => handleAgendaRangeChange("week")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  agendaRange === "week" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                This Week (7 Days)
              </button>
            </div>

            <span className="text-xs text-zinc-500 font-medium">
              {sessions.length} session{sessions.length === 1 ? "" : "s"} scheduled
            </span>
          </div>

          {/* Sessions List */}
          {isLoading ? (
            <div className="py-16 text-center text-zinc-400 text-sm">Loading your schedule...</div>
          ) : sessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-12 text-center space-y-2">
              <CalendarDays className="h-10 w-10 text-zinc-300 mx-auto" />
              <h3 className="text-base font-semibold text-zinc-800">No sessions scheduled for this period</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                You have no classes or exam duties assigned for{" "}
                {agendaRange === "today" ? "today" : agendaRange === "tomorrow" ? "tomorrow" : "this week"}.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((session) => {
                const isDuty = session.kind === "EXAM_DUTY";
                const isExtra = session.kind === "EXTRA";
                const dateStr = toDhakaDateString(session.date);

                return (
                  <Card
                    key={session.id}
                    className={`overflow-hidden border transition-all ${
                      session.status === "CANCELLED"
                        ? "border-rose-200 bg-rose-50/20 opacity-75"
                        : session.status === "RESCHEDULED"
                        ? "border-amber-200 bg-amber-50/20 opacity-75"
                        : isDuty
                        ? "border-indigo-200 bg-white hover:border-indigo-300 shadow-2xs"
                        : "border-zinc-200 bg-white hover:border-zinc-300 shadow-2xs"
                    }`}
                  >
                    <CardHeader className="p-4 pb-2 border-b border-zinc-100 flex flex-row items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-zinc-900">
                            {session.subjectName || (isDuty ? "Exam Duty" : "Class")}
                          </span>
                          {isDuty && (
                            <Badge className="bg-indigo-100 text-indigo-800 text-[10px] px-1.5 py-0">Duty</Badge>
                          )}
                          {isExtra && (
                            <Badge className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0">Extra</Badge>
                          )}
                        </div>
                        {session.lectureLabel && (
                          <p className="text-xs text-zinc-500 line-clamp-1">Topic: {session.lectureLabel}</p>
                        )}
                      </div>
                      {renderStatusBadge(session.status)}
                    </CardHeader>

                    <CardContent className="p-4 space-y-3 text-xs">
                      {/* Date, Time & Room */}
                      <div className="flex items-center justify-between text-zinc-700 bg-zinc-50 p-2 rounded-md">
                        <span className="font-semibold text-zinc-900 flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-indigo-600" />
                          {formatTime12h(session.startTime)}
                          {session.endTime ? ` - ${formatTime12h(session.endTime)}` : ""}
                        </span>
                        <span className="flex items-center gap-1 text-zinc-500">
                          <DoorOpen className="h-3.5 w-3.5" />
                          {session.room || "Room TBA"}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-zinc-600">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500 flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                            Date:
                          </span>
                          <strong className="text-zinc-800 font-medium">
                            {formatDhakaDate(dateStr, "medium")}
                          </strong>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500 flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-zinc-400" />
                            Batch / Exam:
                          </span>
                          <strong className="text-zinc-900">
                            {session.batch?.name || session.specialExam?.title || session.exam?.type || "General"}
                          </strong>
                        </div>

                        {/* Duty Pay indicator */}
                        {isDuty && (
                          <div className="flex items-center justify-between pt-1 border-t border-zinc-100">
                            <span className="text-zinc-500 flex items-center gap-1.5">
                              <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                              Duty Remuneration:
                            </span>
                            <span className="font-bold text-emerald-700">
                              {session.payAmount ? `৳${session.payAmount}` : "Pending amount"}
                            </span>
                          </div>
                        )}
                      </div>

                      {session.changeReason && (
                        <div className="rounded bg-zinc-50 border border-zinc-200 p-2 text-[11px] text-zinc-600 italic">
                          Notice: "{session.changeReason}"
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BATCH ROUTINE (READ-ONLY) */}
      {activeTab === "batch_routine" && (
        <div className="space-y-5">
          <Card className="border border-zinc-200 shadow-2xs">
            <CardHeader className="p-4 bg-zinc-50/70 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold text-zinc-900">Batch Routine Viewer</CardTitle>
                <p className="text-xs text-zinc-500">
                  Select a batch to inspect its full weekly routine and faculty assignments.
                </p>
              </div>

              {/* Batch Selector */}
              <div className="flex items-center gap-2">
                <label htmlFor="batchSelect" className="text-xs font-semibold text-zinc-600 shrink-0">
                  Select Batch:
                </label>
                <select
                  id="batchSelect"
                  value={selectedBatchId}
                  onChange={(e) => handleLoadBatchRoutine(Number(e.target.value))}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs shadow-xs focus:border-indigo-500 focus:outline-hidden"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} (Class {b.classId})
                    </option>
                  ))}
                </select>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6">
              {isLoadingBatch ? (
                <div className="py-12 text-center text-zinc-400 text-sm">Loading batch routine...</div>
              ) : batchSessions.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 text-sm">
                  No classes currently scheduled for this batch for this week.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {batchSessions.map((s) => {
                      const dateStr = toDhakaDateString(s.date);
                      const isOwnClass = s.teacher?.id === teacher?.id;

                      return (
                        <div
                          key={s.id}
                          className={`p-3 rounded-lg border text-xs space-y-2 ${
                            isOwnClass
                              ? "border-indigo-300 bg-indigo-50/30 ring-1 ring-indigo-200"
                              : "border-zinc-200 bg-white shadow-2xs"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-bold text-sm text-zinc-900 block">
                                {s.subjectName || s.kind}
                              </span>
                              {s.lectureLabel && (
                                <span className="text-[11px] text-zinc-500 block">{s.lectureLabel}</span>
                              )}
                            </div>
                            {renderStatusBadge(s.status)}
                          </div>

                          <div className="space-y-1 text-zinc-600">
                            <div className="flex items-center justify-between font-medium text-zinc-800">
                              <span className="flex items-center gap-1.5">
                                <Clock className="h-3 w-3 text-indigo-600" />
                                {formatTime12h(s.startTime)}
                                {s.endTime ? ` - ${formatTime12h(s.endTime)}` : ""}
                              </span>
                              <span>{s.room || "Room TBA"}</span>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-zinc-100">
                              <span className="text-zinc-500">Date:</span>
                              <strong>{formatDhakaDate(dateStr, "short")}</strong>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-zinc-500">Instructor:</span>
                              <strong className={isOwnClass ? "text-indigo-600 font-bold" : "text-zinc-800"}>
                                {s.teacher?.name || "Unassigned"} {isOwnClass && "(You)"}
                              </strong>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
