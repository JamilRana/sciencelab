"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserCheck, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { reassignSessionAction, checkSessionConflictsAction } from "@/app/actions/routine";
import { formatTime12h, formatDhakaDate, toDhakaDateString } from "@/lib/dhaka-time";

interface ReassignModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: any;
  teachers: Array<{ id: number; name: string; mobile: string; perClass: number }>;
  onSuccess?: () => void;
}

export function ReassignModal({
  isOpen,
  onClose,
  session,
  teachers,
  onSuccess,
}: ReassignModalProps) {
  const [newTeacherId, setNewTeacherId] = useState<number | "">("");
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictWarnings, setConflictWarnings] = useState<string[]>([]);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);

  useEffect(() => {
    if (session) {
      setNewTeacherId("");
      setReason("");
      setConflictWarnings([]);
    }
  }, [session, isOpen]);

  // Check conflicts whenever newTeacherId changes
  useEffect(() => {
    if (!session || !newTeacherId || typeof newTeacherId !== "number") {
      setConflictWarnings([]);
      return;
    }

    let isCurrent = true;
    const checkConflicts = async () => {
      setIsCheckingConflicts(true);
      try {
        const dateStr = toDhakaDateString(session.date);
        const res = await checkSessionConflictsAction({
          teacherId: newTeacherId,
          batchId: session.batchId,
          date: dateStr,
          startTime: session.startTime,
          endTime: session.endTime,
          excludeSessionId: session.id,
        });

        if (isCurrent && res.success && res.data?.hasConflicts) {
          const warnings = res.data.warnings
            .filter((w) => w.type === "TEACHER_OVERLAP")
            .map((w) => w.message);
          setConflictWarnings(warnings);
        } else if (isCurrent) {
          setConflictWarnings([]);
        }
      } catch {
        // ignore conflict check error
      } finally {
        if (isCurrent) setIsCheckingConflicts(false);
      }
    };

    checkConflicts();
    return () => {
      isCurrent = false;
    };
  }, [newTeacherId, session]);

  if (!session) return null;

  const currentTeacherName = session.teacher?.name || `Teacher #${session.teacherId}`;
  const dateStr = toDhakaDateString(session.date);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherId || typeof newTeacherId !== "number") {
      toast.error("Please select a new teacher.");
      return;
    }

    if (newTeacherId === session.teacherId) {
      toast.error("Please select a different teacher to reassign.");
      return;
    }

    if (!reason.trim()) {
      toast.error("Please state the reason for reassigning this class.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await reassignSessionAction(session.id, newTeacherId, reason.trim());
      if (res.success) {
        toast.success(`Session reassigned successfully.`);
        onClose();
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.error || "Failed to reassign session");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to reassign session");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <UserCheck className="h-5 w-5 text-indigo-600" />
              Reassign Class Session
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 text-sm">
            {/* Session Summary Box */}
            <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-900">
                  {session.subjectName || session.kind}
                </span>
                <span className="text-xs font-medium text-zinc-500">
                  {formatDhakaDate(dateStr)} • {formatTime12h(session.startTime)}
                </span>
              </div>
              <div className="text-xs text-zinc-600">
                {session.batch && <span>Batch: <strong>{session.batch.name}</strong> • </span>}
                Current Teacher: <strong className="text-zinc-800">{currentTeacherName}</strong>
              </div>
            </div>

            {/* New Teacher Select */}
            <div className="space-y-1.5">
              <label htmlFor="newTeacher" className="text-xs font-semibold text-zinc-700 block">
                New Teacher <span className="text-red-500">*</span>
              </label>
              <select
                id="newTeacher"
                value={newTeacherId}
                onChange={(e) => setNewTeacherId(e.target.value ? Number(e.target.value) : "")}
                required
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-xs focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">-- Choose New Teacher --</option>
                {teachers
                  .filter((t) => t.id !== session.teacherId)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.mobile})
                    </option>
                  ))}
              </select>
            </div>

            {/* Live Conflict Warning */}
            {conflictWarnings.length > 0 && (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold">Schedule Warning:</span>
                  {conflictWarnings.map((w, idx) => (
                    <p key={idx}>{w}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Reason */}
            <div className="space-y-1.5">
              <label htmlFor="reason" className="text-xs font-semibold text-zinc-700 block">
                Reason for Reassignment <span className="text-red-500">*</span>
              </label>
              <textarea
                id="reason"
                placeholder="e.g. Teacher requested leave due to family emergency; Teacher B agreed to substitute."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={3}
                className="w-full rounded-md border border-zinc-300 bg-white p-2.5 text-xs shadow-xs focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-zinc-500">
                This reason will be recorded in the change audit log and included in notices to both teachers.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !newTeacherId || !reason.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Reassigning...
                </>
              ) : (
                "Confirm Reassign"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
