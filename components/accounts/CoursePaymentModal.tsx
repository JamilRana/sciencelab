"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { DataModal } from "@/components/ui/data-modal";
import { recordCoursePaymentAction } from "@/app/actions/course-fees";
import { toast } from "sonner";
import { CreditCard, DollarSign, Printer, Check, Receipt } from "lucide-react";
import { generateDisplayRoll } from "@/lib/roll";

const paymentSchema = z.object({
  amount: z.number().min(100, "Amount must be at least ৳100"),
  paymentMethod: z.string(),
  note: z.string().optional(),
  agreedFee: z.number().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface CoursePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any | null;
  program: any | null;
  onPaymentSuccess?: (receiptData: any) => void;
}

export function CoursePaymentModal({
  isOpen,
  onClose,
  student,
  program,
  onPaymentSuccess,
}: CoursePaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 1000,
      paymentMethod: "CASH",
      note: "",
    },
  });

  if (!student || !program) return null;

  const displayRoll = student.batch?.code
    ? generateDisplayRoll(student.batch.code, student.roll)
    : student.roll;

  const onSubmit = async (values: PaymentFormValues) => {
    setIsLoading(true);
    try {
      const res = await recordCoursePaymentAction({
        studentId: student.id,
        programId: program.id,
        amount: values.amount,
        paymentMethod: values.paymentMethod,
        note: values.note,
        agreedFee: values.agreedFee,
      });

      if (res.success) {
        toast.success(`Installment recorded! Receipt #${res.receiptNo}`);
        reset();
        onClose();
        if (onPaymentSuccess) {
          onPaymentSuccess(res.data);
        }
      } else {
        toast.error(res.error || "Failed to record payment");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DataModal
      isOpen={isOpen}
      onClose={onClose}
      title="Collect Course Fee Installment"
      className="sm:max-w-lg"
    >
      <div className="space-y-4">
        {/* Student Mini Header */}
        <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-400 font-medium">Student & Program</p>
            <h4 className="text-sm font-bold text-zinc-900">{student.name}</h4>
            <p className="text-[11px] text-zinc-500">
              {program.name} · {student.batch?.name || "Batch"}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded tabular-nums">
              Roll {displayRoll}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700">Installment Amount (৳) *</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-zinc-400 text-sm font-bold">৳</span>
              <input
                type="number"
                step="50"
                {...register("amount", { valueAsNumber: true })}
                className="w-full h-9 pl-7 pr-3 bg-zinc-50/50 border border-zinc-200 rounded-lg text-sm font-bold text-zinc-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none tabular-nums"
                placeholder="2000"
              />
            </div>
            {errors.amount && <p className="text-[11px] text-rose-500">{errors.amount.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">Payment Method</label>
              <select
                {...register("paymentMethod")}
                className="w-full h-9 px-3 bg-zinc-50/50 border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none"
              >
                <option value="CASH">Cash</option>
                <option value="BKASH">bKash</option>
                <option value="NAGAD">Nagad</option>
                <option value="BANK">Bank Transfer</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">Agreed Course Total (Optional)</label>
              <input
                type="number"
                {...register("agreedFee", { valueAsNumber: true })}
                className="w-full h-9 px-3 bg-zinc-50/50 border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none tabular-nums"
                placeholder="e.g. 6000"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700">Payment Note / Remark</label>
            <input
              type="text"
              {...register("note")}
              className="w-full h-9 px-3 bg-zinc-50/50 border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none"
              placeholder="e.g. 1st installment paid during admission"
            />
          </div>

          <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg shadow-sm transition-colors focus-ring"
            >
              {isLoading ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Receipt className="h-3.5 w-3.5" />
                  <span>Confirm & Issue Receipt</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DataModal>
  );
}
