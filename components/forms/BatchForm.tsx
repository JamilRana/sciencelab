"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";

const batchSchema = z.object({
  name: z.string().min(2, "Batch name is required"),
  classId: z.string().min(1, "Please select a class"),
});

export type BatchFormValues = z.infer<typeof batchSchema>;

interface BatchFormProps {
  initialData?: any;
  onSubmit: (data: BatchFormValues) => void;
  isLoading?: boolean;
}

const CLASSES = ["Six", "Seven", "Eight", "Nine", "Ten"];

export function BatchForm({
  initialData,
  onSubmit,
  isLoading,
}: BatchFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BatchFormValues>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      name: "",
      classId: "Six",
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
        <label className="text-sm font-semibold text-gray-700">Batch Name</label>
        <input
          {...register("name")}
          className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          placeholder="e.g. 8A, Morning Batch"
        />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Class</label>
        <select
          {...register("classId")}
          className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
        >
          {CLASSES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {errors.classId && <p className="text-xs text-red-500">{errors.classId.message}</p>}
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
            initialData ? "Update Batch" : "Create Batch"
          )}
        </button>
      </div>
    </form>
  );
}
