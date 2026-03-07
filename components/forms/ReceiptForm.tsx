"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";

const receiptSchema = z.object({
  studentId: z.string().min(1, "Please select a student"),
  month: z.string().min(1, "Please select a month"),
  amount: z.string().transform((val) => parseInt(val)).pipe(z.number().min(0, "Amount must be positive")),
  date: z.string().optional(),
});

export type ReceiptFormValues = z.infer<typeof receiptSchema>;

interface ReceiptFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  students: { id: number; name: string; class: string }[];
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export function ReceiptForm({
  initialData,
  onSubmit,
  isLoading,
  students,
}: ReceiptFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      studentId: initialData?.studentId?.toString() || "",
      month: initialData?.month || "Jan",
      amount: initialData?.amount?.toString() || "",
      date: initialData?.date ? new Date(initialData.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        studentId: initialData.studentId?.toString() || "",
        month: initialData.month || "Jan",
        amount: initialData.amount?.toString() || "",
        date: initialData.date ? new Date(initialData.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      });
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Student</label>
        <select
          {...register("studentId")}
          className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
        >
          <option value="">Select Student</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name} ({student.class})
            </option>
          ))}
        </select>
        {errors.studentId && <p className="text-xs text-red-500">{errors.studentId.message as string}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Month</label>
          <select
            {...register("month")}
            className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          >
            {MONTHS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Amount</label>
          <input
            {...register("amount")}
            type="number"
            className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            placeholder="2000"
          />
          {errors.amount && <p className="text-xs text-red-500">{errors.amount.message as string}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Payment Date</label>
        <input
          {...register("date")}
          type="date"
          className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
        />
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            initialData ? "Update Payment" : "Record Payment"
          )}
        </button>
      </div>
    </form>
  );
}
