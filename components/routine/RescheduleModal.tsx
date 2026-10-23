"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarClock, AlertTriangle, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { rescheduleSessionAction, checkSessionConflictsAction } from "@/app/actions/routine";
import {
  formatTime12h,
  formatDhakaDate,
  toDhakaDateString,
  tomorrowDhaka,
} from "@/lib/dhaka-time";

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: any;
  onSuccess?: () => void;
}

export function RescheduleModal({
  isOpen,
  onClose,
  session,
  onSuccess,
}: RescheduleModalProps) {
  const [newDate, setNewDate] = useState<string>("");
  const [newStartTime, setNewStartTime] = useState<string>("");
  const [newEndTime, setNewEndTime] = useState<string>("");
  const [room, setRoom] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictWarnings, setConflictWarnings] = useState<string[]>([]);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);

  useEffect(() => {
    if (session) {
      setNewDate(tomorrowDhaka());
      setNewStartTime(session.startTime || "16:00");
      setNewEndTime(session.endTime || "");
      setRoom(session.room || "");
      setReason("");
      setConflictWarnings([]);
    }
  }, [session, isOpen]);

  // Real-time conflict checking when date or time changes
  useEffect(() => {
    if (!session || !newDate || !newStartTime) {
      setConflictWarnings([]);
      return;
    }

    let isCurrent = true;
    const checkConflicts = async () => {
      setIsCheckingConflicts(true);
      try {
        const res = await checkSessionConflictsAction({
          teacherId: session.teacherId,
          batchId: session.batchId,
          room: room.trim() || null,
          date: newDate,
          startTime: newStartTime,
          endTime: newEndTime || null,
          excludeSessionId: session.id,
        });

        if (isCurrent && res.success && res.data?.hasConflicts) {
          setConflictWarnings(res.data.warnings.map((w) => w.message));
        } else if (isCurrent) {
          setConflictWarnings([]);
        }
      } catch {
        // ignore conflict check error
      } finally {
        if (isCurrent) setIsCheckingConflicts(false);
      }
    };

    const timer = setTimeout(checkConflicts, 250);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [newDate, newStartTime, newEndTime, room, session]);

  if (!session) return null;

  const originalDateStr = toDhakaDateString(session.date);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) {
      toast.error("Please pick a new date.");
      return;
    }
    if (!newStartTime) {
      toast.error("Please provide a new start time.");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please provide the reason for rescheduling.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await rescheduleSessionAction(
        session.id,
        {
          newDate,
          newStartTime,
          newEndTime: newEndTime || null,
          room: room.trim() || null,
        },
        reason.trim()
      );

      if (res.success) {
        toast.success(
          `Class rescheduled to ${formatDhakaDate(newDate)} at ${formatTime12h(newStartTime)}.`
        );
        onClose();
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.error || "Failed to reschedule session");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to reschedule session");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <CalendarClock className="h-5 w-5 text-amber-600" />
              Reschedule Class Session
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 text-sm">
            {/* Original Session Info */}
            <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-3 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-zinc-900 font-semibold text-sm">
                <span>{session.subjectName || session.kind}</span>
                <span className="text-zinc-500 font-normal text-xs">
                  {session.batch?.name || "General"}
                </span>
              </div>
              <div className="text-zinc-600">
                Teacher: <strong className="text-zinc-800">{session.teacher?.name}</strong> • Currently:{" "}
                <span className="font-medium text-red-600">
                  {formatDhakaDate(originalDateStr)} at {formatTime12h(session.startTime)}
                </span>
              </div>
            </div>

            {/* Explanatory Banner */}
            <div className="rounded-md border border-blue-200 bg-blue-50/70 p-2.5 text-xs text-blue-900 flex items-start gap-2">
              <ArrowRight className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <p>
                The original session will be kept as <strong>RESCHEDULED</strong> for audit history, and a new active session will be created on the new date.
              </p>
            </div>

            {/* Date and Time Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="reschedDate" className="text-xs font-semibold text-zinc-700 block">
                  New Date <span className="text-red-500">*</span>
                </label>
                <Input
                  id="reschedDate"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="reschedRoom" className="text-xs font-semibold text-zinc-700 block">
                  Room
                </label>
                <Input
                  id="reschedRoom"
                  placeholder="e.g. Room 101"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="reschedStart" className="text-xs font-semibold text-zinc-700 block">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <Input
                  id="reschedStart"
                  type="time"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="reschedEnd" className="text-xs font-semibold text-zinc-700 block">
                  End Time (Optional)
                </label>
                <Input
                  id="reschedEnd"
                  type="time"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            {/* Conflicts Alert */}
            {conflictWarnings.length > 0 && (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold">Schedule Conflicts on New Date/Time:</span>
                  {conflictWarnings.map((w, idx) => (
                    <p key={idx}>{w}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Reason */}
            <div className="space-y-1.5">
              <label htmlFor="reschedReason" className="text-xs font-semibold text-zinc-700 block">
                Reason for Rescheduling <span className="text-red-500">*</span>
              </label>
              <textarea
                id="reschedReason"
                placeholder="e.g. Teacher requested time change; exam clash with school terminal exam."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={3}
                className="w-full rounded-md border border-zinc-300 bg-white p-2.5 text-xs shadow-xs focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !newDate || !newStartTime || !reason.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Rescheduling...
                </>
              ) : (
                "Confirm Reschedule"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
