"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { setDutyAmountAction } from "@/app/actions/routine";
import { formatTime12h, formatDhakaDate, toDhakaDateString } from "@/lib/dhaka-time";

interface SetDutyAmountModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: any;
  onSuccess?: () => void;
}

export function SetDutyAmountModal({
  isOpen,
  onClose,
  session,
  onSuccess,
}: SetDutyAmountModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (session) {
      setAmount(session.payAmount ? String(session.payAmount) : "");
      setReason("");
    }
  }, [session, isOpen]);

  if (!session) return null;

  const dateStr = toDhakaDateString(session.date);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payNum = parseInt(amount, 10);
    if (isNaN(payNum) || payNum < 0) {
      toast.error("Please enter a valid pay amount in BDT.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await setDutyAmountAction(session.id, payNum, reason.trim() || undefined);
      if (res.success) {
        toast.success(`Duty pay amount set to ৳${payNum}.`);
        onClose();
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.error || "Failed to set duty amount");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to set duty amount");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              Set Exam Duty Pay Amount
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 text-sm">
            {/* Duty Session Summary */}
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 space-y-1 text-xs">
              <div className="font-semibold text-zinc-900 text-sm">
                Exam Duty: {session.specialExam?.title || session.exam?.type || session.subjectName || "Special Exam"}
              </div>
              <div className="text-zinc-600">
                Teacher: <strong>{session.teacher?.name}</strong>
              </div>
              <div className="text-zinc-500">
                {formatDhakaDate(dateStr)} • {formatTime12h(session.startTime)}
              </div>
            </div>

            {/* Pay Amount Input */}
            <div className="space-y-1.5">
              <label htmlFor="payAmount" className="text-xs font-semibold text-zinc-700 block">
                Pay Amount (BDT ৳) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-zinc-400 font-bold">৳</span>
                <Input
                  id="payAmount"
                  type="number"
                  min="0"
                  step="50"
                  placeholder="e.g. 500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="pl-8 text-sm font-semibold"
                />
              </div>
              <p className="text-[11px] text-zinc-500">
                This amount will be added to the teacher's duty earnings when automatic day-close runs.
              </p>
            </div>

            {/* Note / Reason */}
            <div className="space-y-1.5">
              <label htmlFor="dutyNote" className="text-xs font-semibold text-zinc-700 block">
                Adjustment Note (Optional)
              </label>
              <Input
                id="dutyNote"
                placeholder="e.g. Approved 3-hour invigilation rate"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !amount}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Amount"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
