"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const paymentSchema = z.object({
  teacherId: z.string().min(1, "Please select a teacher"),
  month: z.string().min(1, "Please select month"),
  amount: z.string().min(1, "Amount is required"),
  note: z.string().optional(),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;

interface PaymentFormProps {
  onSubmit: (data: PaymentFormValues) => void;
  isLoading?: boolean;
  teachers: { id: number; name: string }[];
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function PaymentForm({ onSubmit, isLoading, teachers }: PaymentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      teacherId: "",
      month: "",
      amount: "",
      note: "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Teacher</label>
        <select
          {...register("teacherId")}
          className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
        >
          <option value="">Select Teacher</option>
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.name}
            </option>
          ))}
        </select>
        {errors.teacherId && <p className="text-xs text-red-500">{errors.teacherId.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Month</label>
        <select
          {...register("month")}
          className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
        >
          <option value="">Select Month</option>
          {months.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>
        {errors.month && <p className="text-xs text-red-500">{errors.month.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Amount (৳)</label>
        <input
          {...register("amount")}
          type="number"
          className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          placeholder="Enter amount"
        />
        {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Note (Optional)</label>
        <textarea
          {...register("note")}
          rows={2}
          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
          placeholder="Add a note..."
        />
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            "Add Payment"
          )}
        </button>
      </div>
    </form>
  );
}
