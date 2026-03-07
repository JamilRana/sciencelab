"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const schoolSchema = z.object({
  name: z.string().min(2, "School name must be at least 2 characters"),
});

export type SchoolFormValues = z.infer<typeof schoolSchema>;

interface SchoolFormProps {
  initialData?: { id?: number; name: string };
  onSubmit: (data: SchoolFormValues) => void;
  isLoading?: boolean;
}

export function SchoolForm({ initialData, onSubmit, isLoading }: SchoolFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SchoolFormValues>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      name: initialData?.name || "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">School Name</label>
        <input
          {...register("name")}
          className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          placeholder="Enter school name"
        />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
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
            initialData?.id ? "Update School" : "Add School"
          )}
        </button>
      </div>
    </form>
  );
}
