"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";

const examSchema = z.object({
  type: z.string().min(1, "Please select exam type"),
  month: z.string().min(1, "Please select month"),
  class: z.string().min(1, "Please select class"),
});

export type ExamFormValues = z.infer<typeof examSchema>;

interface ExamFormProps {
  initialData?: any;
  onSubmit: (data: ExamFormValues) => void;
  isLoading?: boolean;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CLASSES = ["Six", "Seven", "Eight", "Nine", "Ten"];

export function ExamForm({
  initialData,
  onSubmit,
  isLoading,
}: ExamFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      type: "Monthly",
      month: "Jan",
      class: "Six",
      ...initialData,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Exam Type</label>
        <select
          {...register("type")}
          className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
        >
          <option value="Monthly">Monthly</option>
          <option value="Annual">Annual</option>
          <option value="Half-Yearly">Half-Yearly</option>
          <option value="Model Test">Model Test</option>
        </select>
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
          <label className="text-sm font-semibold text-gray-700">Class</label>
          <select
            {...register("class")}
            className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          >
            {CLASSES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
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
            initialData ? "Update Exam" : "Create Exam"
          )}
        </button>
      </div>
    </form>
  );
}
