"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useState } from "react";
import { Tag } from "lucide-react";

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

const CATEGORY_PRESETS = [
  "Office Rent",
  "Electricity & Utilities",
  "Printing & Question Papers",
  "Stationery & Supplies",
  "Snacks & Refreshments",
  "Maintenance & Repairs",
  "Internet & Software",
  "Marketing & Banners",
];

export function ExpenseForm({
  initialData,
  onSubmit,
  isLoading,
}: ExpenseFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: initialData?.description || "",
      amount: initialData?.amount?.toString() || "",
      date: initialData?.date
        ? new Date(initialData.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    },
  });

  const currentDesc = watch("description");

  useEffect(() => {
    if (initialData) {
      reset({
        description: initialData.description,
        amount: initialData.amount.toString(),
        date: new Date(initialData.date).toISOString().split("T")[0],
      });
    }
  }, [initialData, reset]);

  const handleApplyPreset = (preset: string) => {
    if (!currentDesc) {
      setValue("description", `${preset}: `);
    } else if (!currentDesc.includes(preset)) {
      setValue("description", `[${preset}] ${currentDesc}`);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Category Quick Presets */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5 text-indigo-600" />
          <span>Quick Category Presets</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_PRESETS.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleApplyPreset(cat)}
              className="px-2 py-0.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md text-[11px] font-medium transition-colors"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-zinc-700">Description / Payee</label>
        <input
          {...register("description")}
          className="w-full h-9 px-3 bg-white border border-zinc-300 rounded-lg text-xs font-medium text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          placeholder="e.g. Office Rent for current month, 500 sheets paper"
        />
        {errors.description && (
          <p className="text-[11px] text-rose-500 font-medium">
            {errors.description.message as string}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Amount */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-700">Amount (৳)</label>
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
            <p className="text-[11px] text-rose-500 font-medium">
              {errors.amount.message as string}
            </p>
          )}
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-700">Expense Date</label>
          <input
            {...register("date")}
            type="date"
            className="w-full h-9 px-3 bg-white border border-zinc-300 rounded-lg text-xs font-medium text-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <span>{initialData ? "Update Expense Record" : "Record Expense Voucher"}</span>
          )}
        </button>
      </div>
    </form>
  );
}
