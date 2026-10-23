"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CalendarClock, Clock, DoorOpen, Users, ArrowRight, Loader2 } from "lucide-react";
import { getTeacherAgendaAction } from "@/app/actions/routine";
import { formatTime12h, formatDhakaDate, toDhakaDateString } from "@/lib/dhaka-time";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TeacherUpcomingWidget() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getTeacherAgendaAction("week");
        if (res.success && res.data) {
          // Filter to today and tomorrow only
          setSessions(res.data.sessions || []);
        }
      } catch (err) {
        console.error("Failed to load upcoming classes widget:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <Card className="border border-zinc-200 shadow-2xs overflow-hidden bg-white mb-6">
      <CardHeader className="py-3.5 px-5 bg-zinc-50/70 border-b border-zinc-100 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
            <CalendarClock className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-zinc-900">Upcoming Classes & Exam Duties</CardTitle>
            <p className="text-[11px] text-zinc-500">Your scheduled academic sessions for this week</p>
          </div>
        </div>

        <Link
          href="/teacher-route/routine"
          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1"
        >
          Full Routine
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        {loading ? (
          <div className="py-6 text-center text-zinc-400 text-xs flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
            Loading routine...
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-6 text-center text-zinc-500 text-xs">
            No classes or exam duties scheduled for this week.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sessions.slice(0, 6).map((session) => {
              const isDuty = session.kind === "EXAM_DUTY";
              const isExtra = session.kind === "EXTRA";
              const dateStr = toDhakaDateString(session.date);

              return (
                <div
                  key={session.id}
                  className={`p-3 rounded-lg border text-xs space-y-2 ${
                    isDuty
                      ? "border-indigo-200 bg-indigo-50/20"
                      : isExtra
                      ? "border-amber-200 bg-amber-50/20"
                      : "border-zinc-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="font-bold text-zinc-900 text-xs line-clamp-1">
                      {session.subjectName || (isDuty ? "Exam Duty" : "Class")}
                    </span>
                    <Badge variant="outline" className="text-[10px] shrink-0 font-mono">
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

                    <div className="flex items-center gap-1 text-zinc-500">
                      <Users className="h-3 w-3 text-zinc-400 shrink-0" />
                      <span className="truncate">
                        {session.batch?.name || session.specialExam?.title || "General"}
                      </span>
                    </div>
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
