"use client";

import React, { useState } from "react";
import {
  CalendarDays,
  CalendarClock,
  Clock,
  User,
  DoorOpen,
  ArrowRight,
  AlertTriangle,
  XCircle,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import { formatTime12h, formatDhakaDate, toDhakaDateString } from "@/lib/dhaka-time";
import { getStudentScheduleAction } from "@/app/actions/routine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface StudentScheduleClientProps {
  initialData: {
    student: any;
    batch: any;
    range: string;
    dates: string[];
    sessions: any[];
    message?: string;
  };
}

export function StudentScheduleClient({ initialData }: StudentScheduleClientProps) {
  const [range, setRange] = useState<"today" | "tomorrow" | "week">("week");
  const [sessions, setSessions] = useState<any[]>(initialData.sessions || []);
  const [dates, setDates] = useState<string[]>(initialData.dates || []);
  const [isLoading, setIsLoading] = useState(false);

  const student = initialData.student;
  const batch = initialData.batch;

  const handleRangeChange = async (newRange: "today" | "tomorrow" | "week") => {
    setRange(newRange);
    setIsLoading(true);
    try {
      const res = await getStudentScheduleAction(newRange);
      if (res.success && res.data) {
        setSessions(res.data.sessions);
        setDates(res.data.dates);
      } else {
        toast.error(res.error || "Failed to load schedule");
      }
    } catch {
      toast.error("Failed to load schedule");
    } finally {
      setIsLoading(false);
    }
  };

  if (!batch) {
    return (
      <div className="max-w-4xl mx-auto p-8 rounded-xl border border-zinc-200 bg-white text-center space-y-2">
        <Layers className="h-10 w-10 text-zinc-300 mx-auto" />
        <h2 className="text-base font-semibold text-zinc-800">No Active Batch Enrollment</h2>
        <p className="text-xs text-zinc-500">
          You are not currently enrolled in a batch routine. Please contact the coaching office.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <CalendarClock className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">My Class Schedule</h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500">
            Batch: <strong className="text-zinc-800">{batch.name}</strong> (Class {batch.classId}) • Academic routine and class announcements.
          </p>
        </div>

        {/* Range Tabs */}
        <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl self-start sm:self-center">
          <button
            onClick={() => handleRangeChange("today")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              range === "today" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => handleRangeChange("tomorrow")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              range === "tomorrow" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Tomorrow
          </button>
          <button
            onClick={() => handleRangeChange("week")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              range === "week" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            This Week
          </button>
        </div>
      </div>

      {/* Sessions Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-zinc-400 text-sm">Loading your schedule...</div>
      ) : sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-12 text-center space-y-2">
          <CalendarDays className="h-10 w-10 text-zinc-300 mx-auto" />
          <h3 className="text-base font-semibold text-zinc-800">No classes scheduled for this period</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Enjoy your time off! Any new classes or reschedule updates will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((session) => {
            const isCancelled = session.status === "CANCELLED";
            const isRescheduled = session.status === "RESCHEDULED";
            const isConducted = session.status === "CONDUCTED";
            const isExtra = session.kind === "EXTRA";
            const dateStr = session.dateString || toDhakaDateString(session.date);

            return (
              <Card
                key={session.id}
                className={`overflow-hidden border transition-all ${
                  isCancelled
                    ? "border-rose-200 bg-rose-50/20"
                    : isRescheduled
                    ? "border-amber-200 bg-amber-50/20"
                    : isExtra
                    ? "border-purple-200 bg-purple-50/20"
                    : "border-zinc-200 bg-white shadow-2xs hover:border-zinc-300"
                }`}
              >
                <CardHeader className="p-4 pb-2 border-b border-zinc-100 flex flex-row items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-zinc-900">
                        {session.subjectName || "Academic Class"}
                      </span>
                      {isExtra && (
                        <Badge className="bg-purple-100 text-purple-800 text-[10px] px-1.5 py-0">Extra</Badge>
                      )}
                    </div>
                    {session.lectureLabel && (
                      <p className="text-xs text-zinc-500 line-clamp-1">Topic: {session.lectureLabel}</p>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isCancelled ? (
                      <Badge className="bg-rose-100 text-rose-800 text-[10px]">Cancelled</Badge>
                    ) : isRescheduled ? (
                      <Badge className="bg-amber-100 text-amber-800 text-[10px]">Rescheduled</Badge>
                    ) : isConducted ? (
                      <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Conducted</Badge>
                    ) : (
                      <Badge className="bg-blue-50 text-blue-700 text-[10px]">Scheduled</Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-3 text-xs">
                  {/* Time and Room */}
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
                        <User className="h-3.5 w-3.5 text-zinc-400" />
                        Teacher:
                      </span>
                      <strong className="text-zinc-900">{session.teacher?.name || "Faculty Member"}</strong>
                    </div>
                  </div>

                  {/* Reschedule Successor Callout */}
                  {isRescheduled && session.rescheduledTo && (
                    <div className="rounded-md border border-amber-300 bg-amber-50 p-2.5 text-[11px] text-amber-900 space-y-1">
                      <div className="font-semibold flex items-center gap-1">
                        <ArrowRight className="h-3.5 w-3.5 text-amber-700" />
                        Moved to New Time:
                      </div>
                      <p className="pl-4 font-medium text-amber-800">
                        {formatDhakaDate(session.rescheduledTo.date, "short")} at {formatTime12h(session.rescheduledTo.startTime)}
                        {session.rescheduledTo.room ? ` (${session.rescheduledTo.room})` : ""}
                      </p>
                    </div>
                  )}

                  {/* Cancellation Reason Callout */}
                  {isCancelled && session.changeReason && (
                    <div className="rounded-md border border-rose-200 bg-rose-50 p-2 text-[11px] text-rose-800 italic">
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
  );
}
