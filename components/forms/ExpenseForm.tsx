"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";

const expenseSchema = z.object({
  description: z.string().min(2, "Description is required"),
  amount: z.string().transform((val) => parseInt(val)).pipe(z.number().min(0, "Amount must be positive")),
  date: z.string().min(1, "Date is required"),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export function ExpenseForm({
  initialData,
  onSubmit,
  isLoading,
}: ExpenseFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: initialData?.description || "",
      amount: initialData?.amount?.toString() || "",
      date: initialData?.date ? new Date(initialData.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        description: initialData.description,
        amount: initialData.amount.toString(),
        date: new Date(initialData.date).toISOString().split("T")[0],
      });
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Description</label>
        <input
          {...register("description")}
          className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          placeholder="e.g. Rent, Electricity Bill"
        />
        {errors.description && <p className="text-xs text-red-500">{errors.description.message as string}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Amount</label>
          <input
            {...register("amount")}
            type="number"
            className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            placeholder="5000"
          />
          {errors.amount && <p className="text-xs text-red-500">{errors.amount.message as string}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Date</label>
          <input
            {...register("date")}
            type="date"
            className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          />
        </div>
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
            initialData ? "Update Expense" : "Add Expense"
          )}
        </button>
      </div>
    </form>
  );
}
