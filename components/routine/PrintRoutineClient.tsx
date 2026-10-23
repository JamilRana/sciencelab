"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Calendar, Layers, Clock, DoorOpen, User, BarChart3 } from "lucide-react";
import { formatTime12h, formatDhakaDate, toDhakaDateString, WEEKDAY_NAMES_FULL } from "@/lib/dhaka-time";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";

interface PrintRoutineClientProps {
  initialMode: "day" | "batch_week";
  initialDate: string;
  initialBatchId?: number;
  batches: Array<{ id: number; name: string; code: number; classId: string }>;
  dailyData?: {
    dateStr: string;
    sessions: any[];
  };
  weeklyData?: {
    batch: any;
    slots: any[];
    sessions: any[];
  };
}

export function PrintRoutineClient({
  initialMode,
  initialDate,
  initialBatchId,
  batches,
  dailyData,
  weeklyData,
}: PrintRoutineClientProps) {
  const [mode, setMode] = useState<"day" | "batch_week">(initialMode);
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [selectedBatchId, setSelectedBatchId] = useState<number>(initialBatchId || batches[0]?.id || 0);

  const activeBatch = batches.find((b) => b.id === selectedBatchId) || batches[0];
  const sessions = dailyData?.sessions || [];
  const weeklySlots = weeklyData?.slots || [];

  return (
    <div className="min-h-screen bg-zinc-100 p-4 sm:p-8 print:p-0 print:bg-white text-zinc-900 font-sans">
      {/* NO-PRINT TOOLBAR */}
      <div className="max-w-4xl mx-auto mb-6 bg-white p-4 rounded-xl border border-zinc-200 shadow-xs no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin-route/routine"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Day Planner
          </Link>
          <span className="text-zinc-300">|</span>
          <Link
            href="/admin-route/routine/reports"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Routine Reports
          </Link>
          <span className="text-zinc-300">|</span>
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg">
            <button
              onClick={() => {
                setMode("day");
                window.location.href = `/admin-route/routine/print?mode=day&date=${selectedDate}`;
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
                mode === "day" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Daily Routine
            </button>
            <button
              onClick={() => {
                setMode("batch_week");
                window.location.href = `/admin-route/routine/print?mode=batch_week&batchId=${selectedBatchId}`;
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
                mode === "batch_week" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Weekly Batch Timetable
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {mode === "day" ? (
            <div className="flex items-center gap-2">
              <label htmlFor="datePicker" className="text-xs font-semibold text-zinc-600">
                Date:
              </label>
              <input
                id="datePicker"
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  window.location.href = `/admin-route/routine/print?mode=day&date=${e.target.value}`;
                }}
                className="text-xs border border-zinc-300 rounded-md px-2.5 py-1.5 bg-white"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <label htmlFor="batchSelect" className="text-xs font-semibold text-zinc-600">
                Batch:
              </label>
              <select
                id="batchSelect"
                value={selectedBatchId}
                onChange={(e) => {
                  setSelectedBatchId(Number(e.target.value));
                  window.location.href = `/admin-route/routine/print?mode=batch_week&batchId=${e.target.value}`;
                }}
                className="text-xs border border-zinc-300 rounded-md px-2.5 py-1.5 bg-white"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} (Class {b.classId})
                  </option>
                ))}
              </select>
            </div>
          )}

          <PrintButton label="Print A4 Routine" />
        </div>
      </div>

      {/* PRINTABLE A4 CONTAINER */}
      <div className="max-w-[210mm] mx-auto bg-white p-8 sm:p-10 border border-zinc-300 shadow-md print:border-none print:shadow-none print:p-0 print:m-0 min-h-[280mm] flex flex-col justify-between">
        <div className="space-y-6">
          {/* Official Header */}
          <div className="text-center border-b-2 border-zinc-800 pb-4 space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 uppercase">
              Science Lab Coaching Center
            </h1>
            <p className="text-xs font-medium text-zinc-600">
              বিজ্ঞান গবেষণাগার কোচিং সেন্টার • Academic Excellence & Concept Building
            </p>
            <div className="pt-2 flex items-center justify-between text-xs font-semibold text-zinc-800 px-2">
              {mode === "day" ? (
                <>
                  <span>
                    Daily Class Routine: <strong>{formatDhakaDate(selectedDate, "full")}</strong>
                  </span>
                  <span>Total Classes: <strong>{sessions.length}</strong></span>
                </>
              ) : (
                <>
                  <span>
                    Weekly Timetable: <strong>Batch {activeBatch?.name}</strong> (Class {activeBatch?.classId})
                  </span>
                  <span>Academic Year: <strong>2026</strong></span>
                </>
              )}
            </div>
          </div>

          {/* MODE 1: DAILY ROUTINE TABLE */}
          {mode === "day" && (
            <div className="space-y-4">
              {sessions.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 text-xs italic">
                  No classes or exam duties scheduled on this date.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse border border-zinc-300">
                  <thead>
                    <tr className="bg-zinc-100 text-zinc-900 uppercase text-[10px] tracking-wider border-b border-zinc-300">
                      <th className="py-2.5 px-3 border-r border-zinc-300 w-12 text-center">#</th>
                      <th className="py-2.5 px-3 border-r border-zinc-300 w-32">Time (BST)</th>
                      <th className="py-2.5 px-3 border-r border-zinc-300 w-32">Batch / Level</th>
                      <th className="py-2.5 px-3 border-r border-zinc-300">Subject / Topic</th>
                      <th className="py-2.5 px-3 border-r border-zinc-300 w-44">Instructor / Faculty</th>
                      <th className="py-2.5 px-3 border-r border-zinc-300 w-24">Room</th>
                      <th className="py-2.5 px-3 w-24 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session, index) => {
                      const isCancelled = session.status === "CANCELLED";
                      const isRescheduled = session.status === "RESCHEDULED";
                      const isDuty = session.kind === "EXAM_DUTY";
                      const isExtra = session.kind === "EXTRA";

                      return (
                        <tr
                          key={session.id}
                          className={`border-b border-zinc-200 text-zinc-800 ${
                            isCancelled
                              ? "bg-rose-50/50 line-through text-zinc-400"
                              : isRescheduled
                              ? "bg-amber-50/40 text-zinc-500"
                              : index % 2 === 1
                              ? "bg-zinc-50/60"
                              : "bg-white"
                          }`}
                        >
                          <td className="py-2 px-3 border-r border-zinc-200 text-center font-mono font-medium">
                            {index + 1}
                          </td>
                          <td className="py-2 px-3 border-r border-zinc-200 font-semibold text-zinc-900 whitespace-nowrap">
                            {formatTime12h(session.startTime)}
                            {session.endTime ? ` - ${formatTime12h(session.endTime)}` : ""}
                          </td>
                          <td className="py-2 px-3 border-r border-zinc-200 font-medium">
                            {session.batch?.name ? `Batch ${session.batch.name}` : session.specialExam?.title || "Special Exam"}
                            {session.batch?.classId && ` (Cl. ${session.batch.classId})`}
                          </td>
                          <td className="py-2 px-3 border-r border-zinc-200">
                            <span className="font-semibold text-zinc-900">
                              {session.subjectName || (isDuty ? "Exam Duty" : "Class")}
                            </span>
                            {session.lectureLabel && (
                              <span className="block text-[10px] text-zinc-500 font-mono">
                                {session.lectureLabel}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 border-r border-zinc-200 font-medium text-zinc-900">
                            {session.teacher?.name || "Unassigned"}
                          </td>
                          <td className="py-2 px-3 border-r border-zinc-200 font-mono">
                            {session.room || "TBA"}
                          </td>
                          <td className="py-2 px-3 text-center text-[10px] font-semibold uppercase">
                            {isCancelled
                              ? "Cancelled"
                              : isRescheduled
                              ? "Rescheduled"
                              : isDuty
                              ? "Exam Duty"
                              : isExtra
                              ? "Extra"
                              : "Regular"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* MODE 2: WEEKLY BATCH TIMETABLE */}
          {mode === "batch_week" && (
            <div className="space-y-4">
              <table className="w-full text-left text-xs border-collapse border border-zinc-300">
                <thead>
                  <tr className="bg-zinc-100 text-zinc-900 uppercase text-[10px] tracking-wider border-b border-zinc-300">
                    <th className="py-2.5 px-3 border-r border-zinc-300 w-28 text-center">Day</th>
                    <th className="py-2.5 px-3 border-r border-zinc-300 w-32">Time</th>
                    <th className="py-2.5 px-3 border-r border-zinc-300">Subject</th>
                    <th className="py-2.5 px-3 border-r border-zinc-300 w-44">Faculty</th>
                    <th className="py-2.5 px-3 w-28 text-center">Room</th>
                  </tr>
                </thead>
                <tbody>
                  {[6, 0, 1, 2, 3, 4, 5].map((weekdayNum) => {
                    const daySlots = weeklySlots.filter((slot) => slot.weekday === weekdayNum);
                    const dayName = WEEKDAY_NAMES_FULL[weekdayNum];

                    if (daySlots.length === 0) {
                      return (
                        <tr key={weekdayNum} className="border-b border-zinc-200 text-zinc-400 bg-zinc-50/30">
                          <td className="py-2 px-3 border-r border-zinc-200 font-bold text-zinc-700 text-center">
                            {dayName}
                          </td>
                          <td colSpan={4} className="py-2 px-3 text-center italic text-[11px]">
                            No regular classes scheduled (Off Day / Practice)
                          </td>
                        </tr>
                      );
                    }

                    return daySlots.map((slot, sIdx) => (
                      <tr key={slot.id} className="border-b border-zinc-200 text-zinc-800">
                        {sIdx === 0 && (
                          <td
                            rowSpan={daySlots.length}
                            className="py-2 px-3 border-r border-zinc-200 font-bold text-zinc-900 text-center bg-zinc-50/50 align-top"
                          >
                            {dayName}
                          </td>
                        )}
                        <td className="py-2 px-3 border-r border-zinc-200 font-semibold text-zinc-900 whitespace-nowrap">
                          {formatTime12h(slot.startTime)}
                          {slot.endTime ? ` - ${formatTime12h(slot.endTime)}` : ""}
                        </td>
                        <td className="py-2 px-3 border-r border-zinc-200 font-bold text-zinc-900">
                          {slot.subjectName}
                        </td>
                        <td className="py-2 px-3 border-r border-zinc-200 font-medium">
                          {slot.teacher?.name || "Faculty Member"}
                        </td>
                        <td className="py-2 px-3 text-center font-mono">
                          {slot.room || "TBA"}
                        </td>
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Signatures & Verification Footer */}
        <div className="pt-8 border-t border-zinc-300 mt-12 text-xs">
          <div className="grid grid-cols-3 gap-6 text-center text-zinc-700">
            <div>
              <div className="border-t border-zinc-400 pt-1.5 font-semibold">Prepared By</div>
              <span className="text-[10px] text-zinc-500">Academic Staff</span>
            </div>
            <div>
              <div className="border-t border-zinc-400 pt-1.5 font-semibold">Verified By</div>
              <span className="text-[10px] text-zinc-500">Routine Coordinator</span>
            </div>
            <div>
              <div className="border-t border-zinc-400 pt-1.5 font-semibold">Approved By</div>
              <span className="text-[10px] text-zinc-500">Director / Principal</span>
            </div>
          </div>
          <p className="text-[9px] text-zinc-400 text-center pt-4">
            Notice: Routine is subject to administrative updates. ScienceLab Coaching Center, All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
