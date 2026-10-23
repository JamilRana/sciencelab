"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AlertCircle, CalendarClock, ArrowRight, X } from "lucide-react";
import { getTomorrowPlanningStatusAction } from "@/app/actions/routine";
import { formatDhakaDate } from "@/lib/dhaka-time";

export function PlanningBanner() {
  const [status, setStatus] = useState<{
    tomorrowDate: string;
    sessionCount: number;
    needsPlanning: boolean;
  } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const res = await getTomorrowPlanningStatusAction();
        if (res.success && res.data) {
          setStatus(res.data);
        }
      } catch {
        // Fail silently on dashboard
      }
    }
    check();
  }, []);

  if (!status || !status.needsPlanning || dismissed) {
    return null;
  }

  const formattedDate = formatDhakaDate(status.tomorrowDate, "medium");

  return (
    <div className="mb-6 rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 via-amber-100/60 to-amber-50 p-4 text-amber-900 shadow-xs relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 bg-amber-500/20 text-amber-800 rounded-lg shrink-0">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-amber-950">
                Tomorrow&apos;s Class Routine Pending
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-200/80 text-amber-900">
                0 Sessions Planned
              </span>
            </div>
            <p className="text-xs text-amber-800/90">
              No classes or exam duties have been scheduled for tomorrow ({formattedDate}). The daily
              7:00 PM teacher digest will be empty unless sessions are added.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <Link
            href="/admin-route/routine/tomorrow"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            Open Tomorrow Board
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-200/60 rounded-md transition-colors"
            title="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
