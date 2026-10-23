"use client";

import React, { useState, useEffect } from "react";
import {
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Save,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  getNeedsAmountDutiesAction,
  setDutyAmountAction,
} from "@/app/actions/routine";

interface NeedsAmountDutiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function NeedsAmountDutiesModal({
  isOpen,
  onClose,
  onSuccess,
}: NeedsAmountDutiesModalProps) {
  const [duties, setDuties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [amounts, setAmounts] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const fetchDuties = async () => {
    setIsLoading(true);
    try {
      const res = await getNeedsAmountDutiesAction();
      if (res.success && res.data) {
        setDuties(res.data);
      } else {
        toast.error(res.error || "Failed to load exam duties");
      }
    } catch {
      toast.error("Failed to load exam duties");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDuties();
    }
  }, [isOpen]);

  const handleSaveAmount = async (dutyId: number) => {
    const val = amounts[dutyId];
    const num = parseInt(val, 10);

    if (isNaN(num) || num <= 0) {
      toast.error("Please enter a valid positive duty pay amount");
      return;
    }

    setSavingId(dutyId);
    try {
      const res = await setDutyAmountAction(dutyId, num, "Configured via Needs Amount manager");
      if (res.success) {
        toast.success(`Duty pay set to ৳${num}`);
        setDuties((prev) => prev.filter((d) => d.id !== dutyId));
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.error || "Failed to set duty amount");
      }
    } catch {
      toast.error("Failed to save duty amount");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-zinc-900">
              <DollarSign className="h-5 w-5 text-amber-600" />
              Exam Duties Needing Pay Amount
            </DialogTitle>
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-800 border-amber-300">
              {duties.length} Pending
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Exam duties without an explicit remuneration amount are held back from day-close auto counting until configured here.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-3 space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-600" />
              Loading uncounted duties...
            </div>
          ) : duties.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 stroke-[1.5]" />
              <p className="text-xs font-semibold text-zinc-800">All Exam Duties Have Pay Amounts Set</p>
              <p className="text-[11px] text-zinc-500 mt-1">
                No duties are held back. All scheduled duties will roll into teacher earnings during day-close.
              </p>
            </div>
          ) : (
            duties.map((duty) => (
              <div
                key={duty.id}
                className="p-3.5 rounded-xl border border-zinc-200 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-zinc-900">{duty.teacherName}</span>
                    <Badge variant="outline" className="text-[10px] bg-pink-50 text-pink-700 border-pink-200">
                      {duty.examTitle}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="h-3 w-3 text-zinc-400" />
                      {duty.formattedDate}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="h-3 w-3 text-zinc-400" />
                      {duty.startTime}
                    </span>
                    <span>•</span>
                    <span>Room: {duty.room}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative w-28">
                    <span className="absolute left-2.5 top-2 text-xs text-zinc-400">৳</span>
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={amounts[duty.id] || ""}
                      onChange={(e) =>
                        setAmounts((prev) => ({ ...prev, [duty.id]: e.target.value }))
                      }
                      className="pl-6 text-xs h-8 bg-zinc-50"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSaveAmount(duty.id)}
                    disabled={savingId === duty.id || !amounts[duty.id]}
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                  >
                    <Save className={`h-3 w-3 ${savingId === duty.id ? "animate-spin" : ""}`} />
                    Save
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter className="border-t border-zinc-100 pt-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs h-8">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
