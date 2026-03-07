"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";

const subjectSchema = z.object({
  subject: z.string().min(2, "Subject name is required"),
  teacherId: z.string().min(1, "Please select a teacher"),
  totalMark: z.string().transform((val) => parseInt(val)).pipe(z.number().min(1)),
  examDate: z.string().min(1, "Exam date is required"),
  topics: z.string().optional(),
});

export type SubjectFormValues = z.infer<typeof subjectSchema>;

interface SubjectFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  teachers: { id: number; name: string }[];
}

export function SubjectForm({
  initialData,
  onSubmit,
  isLoading,
  teachers,
}: SubjectFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      subject: initialData?.subject || "",
      teacherId: initialData?.teacherId?.toString() || "",
      totalMark: initialData?.totalMark?.toString() || "100",
      examDate: initialData?.examDate ? new Date(initialData.examDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      topics: initialData?.topics || "",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        subject: initialData.subject,
        teacherId: initialData.teacherId.toString(),
        totalMark: initialData.totalMark.toString(),
        examDate: new Date(initialData.examDate).toISOString().split("T")[0],
        topics: initialData.topics || "",
      });
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Subject Name</label>
        <input
          {...register("subject")}
          className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          placeholder="Mathematics, English, Physics..."
        />
        {errors.subject && <p className="text-xs text-red-500">{errors.subject.message as string}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Teacher</label>
          <select
            {...register("teacherId")}
            className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          >
            <option value="">Select Teacher</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {errors.teacherId && <p className="text-xs text-red-500">{errors.teacherId.message as string}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Total Marks</label>
          <input
            {...register("totalMark")}
            type="number"
            className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Exam Date</label>
          <input
            {...register("examDate")}
            type="date"
            className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Topics covered</label>
        <textarea
          {...register("topics")}
          rows={2}
          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
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
            initialData ? "Update Subject" : "Schedule Subject"
          )}
        </button>
      </div>
    </form>
  );
}
