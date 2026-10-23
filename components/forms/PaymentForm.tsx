"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getTeacherMonthStatsAction } from "@/app/actions/teacher-payments";
import { DollarSign, BookOpen, Clock, AlertCircle, CheckCircle2, Sparkles, Loader2 } from "lucide-react";
import { SearchableSelect } from "@/components/ui/searchable-select";

const paymentSchema = z.object({
  teacherId: z.string().min(1, "Please select a teacher"),
  month: z.string().min(1, "Please select month"),
  amount: z.string().min(1, "Amount is required"),
  date: z.string().optional(),
  note: z.string().optional(),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;

interface Teacher {
  id: number;
  name: string;
  mobile: string;
  perClass: number;
}

interface PaymentFormProps {
  onSubmit: (data: PaymentFormValues) => void;
  isLoading?: boolean;
  teachers: Teacher[];
}

const MONTHS = [
  { value: "Jan", label: "January (Jan)" },
  { value: "Feb", label: "February (Feb)" },
  { value: "Mar", label: "March (Mar)" },
  { value: "Apr", label: "April (Apr)" },
  { value: "May", label: "May (May)" },
  { value: "Jun", label: "June (Jun)" },
  { value: "Jul", label: "July (Jul)" },
  { value: "Aug", label: "August (Aug)" },
  { value: "Sep", label: "September (Sep)" },
  { value: "Oct", label: "October (Oct)" },
  { value: "Nov", label: "November (Nov)" },
  { value: "Dec", label: "December (Dec)" },
];

export function PaymentForm({ onSubmit, isLoading, teachers }: PaymentFormProps) {
  const currentMonthCode = MONTHS[new Date().getMonth()].value;

  const [statsLoading, setStatsLoading] = useState(false);
  const [teacherStats, setTeacherStats] = useState<any>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      teacherId: "",
      month: currentMonthCode,
      amount: "",
      date: new Date().toISOString().split("T")[0],
      note: "",
    },
  });

  const watchedTeacherId = watch("teacherId");
  const watchedMonth = watch("month");

  // Fetch live stats when teacher or month changes
  useEffect(() => {
    if (!watchedTeacherId) {
      setTeacherStats(null);
      return;
    }

    let isMounted = true;
    setStatsLoading(true);

    getTeacherMonthStatsAction(parseInt(watchedTeacherId), watchedMonth)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setTeacherStats(res.data);
          // If month has due, recommend that amount
          if (res.data.monthDue > 0) {
            setValue("amount", res.data.monthDue.toString());
          } else if (res.data.lifetimeDue > 0) {
            setValue("amount", res.data.lifetimeDue.toString());
          }
        } else {
          setTeacherStats(null);
        }
      })
      .catch(() => {
        if (isMounted) setTeacherStats(null);
      })
      .finally(() => {
        if (isMounted) setStatsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [watchedTeacherId, watchedMonth, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Teacher Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-zinc-700">Select Teacher</label>
        <SearchableSelect
          value={watchedTeacherId}
          onChange={(val) => setValue("teacherId", val, { shouldValidate: true })}
          options={teachers.map((teacher) => ({
            value: teacher.id.toString(),
            label: teacher.name,
            subtitle: teacher.mobile ? `Mobile: ${teacher.mobile}` : undefined,
            badge: teacher.perClass > 0 ? `৳${teacher.perClass}/class` : "No rate",
          }))}
          placeholder="-- Choose Teacher --"
          searchPlaceholder="Search teacher by name or mobile..."
          error={Boolean(errors.teacherId)}
          size="sm"
        />
        {errors.teacherId && (
          <p className="text-[11px] text-rose-500 font-medium">{errors.teacherId.message}</p>
        )}
      </div>

      {/* Month & Payment Date */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-700">Salary Month</label>
          <select
            {...register("month")}
            className="w-full h-9 px-3 bg-white border border-zinc-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          {errors.month && (
            <p className="text-[11px] text-rose-500 font-medium">{errors.month.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-700">Payment Date</label>
          <input
            {...register("date")}
            type="date"
            className="w-full h-9 px-3 bg-white border border-zinc-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Live Class Log & Due Intelligence Card */}
      {watchedTeacherId && (
        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2 text-xs">
          {statsLoading ? (
            <div className="flex items-center gap-2 text-zinc-500 py-1">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              <span>Fetching class logs and ledger balance...</span>
            </div>
          ) : teacherStats ? (
            <>
              <div className="flex items-center justify-between border-b border-zinc-200/80 pb-2">
                <span className="font-semibold text-zinc-800 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                  <span>
                    {teacherStats.month} Log: {teacherStats.monthClasses} Classes
                  </span>
                </span>
                <span className="text-[11px] text-zinc-500 font-medium">
                  Rate: ৳{teacherStats.teacher?.perClass || 0}/class
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="bg-white p-2 rounded-lg border border-zinc-200">
                  <div className="text-[10px] text-zinc-500">Gross Earned</div>
                  <div className="font-bold text-zinc-900 tabular-nums">
                    ৳{teacherStats.monthEarned.toLocaleString()}
                  </div>
                </div>

                <div className="bg-white p-2 rounded-lg border border-zinc-200">
                  <div className="text-[10px] text-zinc-500">Already Paid</div>
                  <div className="font-bold text-emerald-700 tabular-nums">
                    ৳{teacherStats.monthPaid.toLocaleString()}
                  </div>
                </div>

                <div className="bg-white p-2 rounded-lg border border-zinc-200">
                  <div className="text-[10px] text-zinc-500">Month Due</div>
                  <div className="font-bold text-indigo-700 tabular-nums">
                    ৳{teacherStats.monthDue.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Quick Fill Recommendation */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-zinc-500">
                  Total Outstanding Balance:{" "}
                  <strong className="text-zinc-900 tabular-nums">
                    ৳{teacherStats.lifetimeDue.toLocaleString()}
                  </strong>
                </span>

                {teacherStats.monthDue > 0 && (
                  <button
                    type="button"
                    onClick={() => setValue("amount", teacherStats.monthDue.toString())}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold underline"
                  >
                    Set to Month Due
                  </button>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Disbursed Amount */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-zinc-700">Amount to Disburse (৳)</label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-xs font-bold text-zinc-400">৳</span>
          <input
            {...register("amount")}
            type="number"
            className="w-full h-9 pl-7 pr-3 bg-white border border-zinc-300 rounded-lg text-xs font-bold text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden tabular-nums"
            placeholder="0"
          />
        </div>
        {errors.amount && (
          <p className="text-[11px] text-rose-500 font-medium">{errors.amount.message}</p>
        )}
      </div>

      {/* Note / Payment Method */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-zinc-700">Note / Payment Method (Optional)</label>
        <textarea
          {...register("note")}
          rows={2}
          className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-800 placeholder-zinc-400 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden resize-none"
          placeholder="e.g. Cash voucher #412, bKash: 017xxxxxxxx, Cheque"
        />
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Recording Disbursement...</span>
            </>
          ) : (
            <span>Confirm Teacher Payment</span>
          )}
        </button>
      </div>
    </form>
  );
}
