"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";
import { normalizeBdPhone } from "@/lib/phone";

const teacherSchema = z.object({
  name: z.string().min(2, "Name is required"),
  mobile: z.string().min(11, "Mobile number must be at least 11 digits"),
  gender: z.string().min(1, "Please select gender"),
  email: z.string().email().optional().or(z.literal("")),
  whatsappNumber: z.string().optional().or(z.literal("")),
  notifyEmail: z.boolean().default(true),
  perClass: z.string().transform((val) => parseInt(val)).pipe(z.number().min(0, "Amount must be positive")),
  due: z.string().transform((val) => parseInt(val)).pipe(z.number().min(0, "Amount must be positive")),
});

export type TeacherFormValues = z.infer<typeof teacherSchema>;

interface TeacherFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export function TeacherForm({
  initialData,
  onSubmit,
  isLoading,
}: TeacherFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      name: initialData?.name || "",
      mobile: initialData?.mobile || "",
      gender: initialData?.gender || "Male",
      email: initialData?.email || "",
      whatsappNumber: initialData?.whatsappNumber || "",
      notifyEmail: initialData?.notifyEmail !== undefined ? Boolean(initialData.notifyEmail) : true,
      perClass: initialData?.perClass?.toString() || "0",
      due: initialData?.due?.toString() || "0",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        mobile: initialData.mobile,
        gender: initialData.gender,
        email: initialData.email || "",
        whatsappNumber: initialData.whatsappNumber || "",
        notifyEmail: initialData.notifyEmail !== undefined ? Boolean(initialData.notifyEmail) : true,
        perClass: initialData.perClass.toString(),
        due: initialData.due.toString(),
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = (data: any) => {
    // If whatsappNumber is provided, normalize it
    if (data.whatsappNumber && data.whatsappNumber.trim()) {
      const normalized = normalizeBdPhone(data.whatsappNumber.trim());
      if (normalized.isValid) {
        data.whatsappNumber = normalized.e164;
      }
    }
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Full Name</label>
          <input
            {...register("name")}
            className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
            placeholder="Mr. Smith"
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message as string}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Mobile Number</label>
          <input
            {...register("mobile")}
            className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
            placeholder="017XXXXXXXX"
          />
          {errors.mobile && <p className="text-xs text-red-500">{errors.mobile.message as string}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Gender</label>
          <select
            {...register("gender")}
            className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">WhatsApp Number</label>
          <input
            {...register("whatsappNumber")}
            className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
            placeholder="017XXXXXXXX (defaults to mobile)"
          />
          <span className="text-[10px] text-gray-400">Normalizes to +8801...</span>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Email (Optional)</label>
          <input
            {...register("email")}
            type="email"
            className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
            placeholder="teacher@example.com"
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message as string}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Payment Per Class</label>
          <input
            {...register("perClass")}
            type="number"
            className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Due Amount</label>
          <input
            {...register("due")}
            type="number"
            className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
          />
        </div>

        <div className="space-y-2 flex items-center pt-6">
          <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-medium text-gray-700">
            <input
              {...register("notifyEmail")}
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Receive Routine Notifications by Email
          </label>
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
            initialData ? "Update Teacher" : "Add Teacher"
          )}
        </button>
      </div>
    </form>
  );
}
