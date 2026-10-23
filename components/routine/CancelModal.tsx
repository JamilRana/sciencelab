"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cancelSessionAction } from "@/app/actions/routine";
import { formatTime12h, formatDhakaDate, toDhakaDateString } from "@/lib/dhaka-time";

interface CancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: any;
  onSuccess?: () => void;
}

export function CancelModal({
  isOpen,
  onClose,
  session,
  onSuccess,
}: CancelModalProps) {
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!session) return null;

  const dateStr = toDhakaDateString(session.date);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("Please provide the reason for cancellation.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await cancelSessionAction(session.id, reason.trim());
      if (res.success) {
        toast.success("Class session has been cancelled.");
        setReason("");
        onClose();
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.error || "Failed to cancel session");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel session");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[450px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-red-600">
              <XCircle className="h-5 w-5" />
              Cancel Class Session
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 text-sm">
            {/* Session Info */}
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 space-y-1 text-xs">
              <div className="font-semibold text-zinc-900 text-sm">
                {session.subjectName || session.kind}
              </div>
              <div className="text-zinc-600">
                {session.batch && <span>Batch: <strong>{session.batch.name}</strong> • </span>}
                Teacher: <strong>{session.teacher?.name}</strong>
              </div>
              <div className="text-zinc-500">
                {formatDhakaDate(dateStr)} at {formatTime12h(session.startTime)}
              </div>
            </div>

            {/* Warning Callout */}
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong>Notice:</strong> This session will be marked as <strong>CANCELLED</strong>. It will remain in the system for change audit history, but will be excluded from automatic class logs and teacher payments.
              </div>
            </div>

            {/* Cancellation Reason */}
            <div className="space-y-1.5">
              <label htmlFor="cancelReason" className="text-xs font-semibold text-zinc-700 block">
                Cancellation Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                id="cancelReason"
                placeholder="e.g. Center closed due to weather; Teacher illness with no substitute available."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={3}
                className="w-full rounded-md border border-zinc-300 bg-white p-2.5 text-xs shadow-xs focus:border-red-500 focus:outline-hidden focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Keep Session
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Confirm Cancel"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
