"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CalendarClock, Clock, DoorOpen, ArrowRight, Loader2, Calendar } from "lucide-react";
import { getStudentScheduleAction } from "@/app/actions/routine";
import { formatTime12h, formatDhakaDate, toDhakaDateString } from "@/lib/dhaka-time";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StudentScheduleWidget() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getStudentScheduleAction("week");
        if (res.success && res.data) {
          setSessions(res.data.sessions || []);
          setBatch(res.data.batch);
        }
      } catch (err) {
        console.error("Failed to load student schedule widget:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (!batch && !loading) {
    return null;
  }

  return (
    <Card className="border border-zinc-200 shadow-2xs overflow-hidden bg-white mb-6">
      <CardHeader className="py-3.5 px-5 bg-zinc-50/70 border-b border-zinc-100 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
            <CalendarClock className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-zinc-900">
              My Class Schedule {batch && `— Batch ${batch.name}`}
            </CardTitle>
            <p className="text-[11px] text-zinc-500">Upcoming classes and timetable announcements</p>
          </div>
        </div>

        <Link
          href="/student-route/schedule"
          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1"
        >
          Full Schedule
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        {loading ? (
          <div className="py-6 text-center text-zinc-400 text-xs flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
            Loading schedule...
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-6 text-center text-zinc-500 text-xs">
            No classes scheduled for your batch this week.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sessions.slice(0, 6).map((session) => {
              const isCancelled = session.status === "CANCELLED";
              const isRescheduled = session.status === "RESCHEDULED";
              const dateStr = session.dateString || toDhakaDateString(session.date);

              return (
                <div
                  key={session.id}
                  className={`p-3 rounded-lg border text-xs space-y-2 ${
                    isCancelled
                      ? "border-rose-200 bg-rose-50/20"
                      : isRescheduled
                      ? "border-amber-200 bg-amber-50/20"
                      : "border-zinc-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="font-bold text-zinc-900 text-xs line-clamp-1">
                      {session.subjectName || "Academic Class"}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] shrink-0 font-mono ${
                        isCancelled
                          ? "text-rose-700 border-rose-300 bg-rose-50"
                          : isRescheduled
                          ? "text-amber-700 border-amber-300 bg-amber-50"
                          : "text-zinc-600 bg-zinc-50"
                      }`}
                    >
                      {formatDhakaDate(dateStr, "short")}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-zinc-600">
                    <div className="flex items-center justify-between font-medium text-zinc-800">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-indigo-600" />
                        {formatTime12h(session.startTime)}
                      </span>
                      <span>{session.room || "Room TBA"}</span>
                    </div>

                    <div className="text-[11px] text-zinc-500">
                      Teacher: <strong className="text-zinc-700">{session.teacher?.name || "Faculty Member"}</strong>
                    </div>

                    {isRescheduled && session.rescheduledTo && (
                      <div className="text-[11px] font-medium text-amber-800 pt-1 border-t border-amber-200">
                        Moved to: {formatDhakaDate(session.rescheduledTo.date, "short")} at {formatTime12h(session.rescheduledTo.startTime)}
                      </div>
                    )}

                    {isCancelled && (
                      <div className="text-[11px] text-rose-700 pt-1 border-t border-rose-200">
                        Class Cancelled
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
