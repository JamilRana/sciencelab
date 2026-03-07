"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";

const studentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  fatherName: z.string().min(2, "Father's name is required"),
  motherName: z.string().min(2, "Mother's name is required"),
  mobile: z.string().min(11, "Mobile number must be at least 11 digits"),
  homeMobile: z.string().optional(),
  address: z.string().min(5, "Address must be at least 5 characters"),
  gender: z.string().min(1, "Please select gender"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  dob: z.string().optional(),
  class: z.string().min(1, "Please select class"),
  schoolId: z.string().min(1, "Please select school"),
  batchId: z.string().min(1, "Please select batch"),
});

export type StudentFormValues = z.infer<typeof studentSchema>;

interface StudentFormProps {
  initialData?: any;
  onSubmit: (data: StudentFormValues) => void;
  isLoading?: boolean;
  schools: { id: number; name: string }[];
  batches: { id: number; name: string }[];
}

export function StudentForm({
  initialData,
  onSubmit,
  isLoading,
  schools,
  batches,
}: StudentFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: "",
      fatherName: "",
      motherName: "",
      mobile: "",
      homeMobile: "",
      address: "",
      gender: "Male",
      email: "",
      class: "Six",
      ...initialData,
      schoolId: initialData?.schoolId?.toString() || "",
      batchId: initialData?.batchId?.toString() || "",
      dob: initialData?.dob ? new Date(initialData.dob).toISOString().split("T")[0] : "",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        schoolId: initialData.schoolId?.toString() || "",
        batchId: initialData.batchId?.toString() || "",
        dob: initialData.dob ? new Date(initialData.dob).toISOString().split("T")[0] : "",
      });
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Student Name</label>
          <input
            {...register("name")}
            className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            placeholder="John Doe"
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Gender</label>
          <select
            {...register("gender")}
            className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Father's Name</label>
          <input
            {...register("fatherName")}
            className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          />
          {errors.fatherName && <p className="text-xs text-red-500">{errors.fatherName.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Mother's Name</label>
          <input
            {...register("motherName")}
            className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          />
          {errors.motherName && <p className="text-xs text-red-500">{errors.motherName.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Mobile</label>
          <input
            {...register("mobile")}
            className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            placeholder="017XXXXXXXX"
          />
          {errors.mobile && <p className="text-xs text-red-500">{errors.mobile.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Home Mobile (Optional)</label>
          <input
            {...register("homeMobile")}
            className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Class</label>
          <select
            {...register("class")}
            className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          >
            <option value="Six">Six</option>
            <option value="Seven">Seven</option>
            <option value="Eight">Eight</option>
            <option value="Nine">Nine</option>
            <option value="Ten">Ten</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">School</label>
          <select
            {...register("schoolId")}
            className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          >
            <option value="">Select School</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
          {errors.schoolId && <p className="text-xs text-red-500">{errors.schoolId.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Batch</label>
          <select
            {...register("batchId")}
            className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          >
            <option value="">Select Batch</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name}
              </option>
            ))}
          </select>
          {errors.batchId && <p className="text-xs text-red-500">{errors.batchId.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Date of Birth</label>
          <input
            type="date"
            {...register("dob")}
            className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Address</label>
        <textarea
          {...register("address")}
          rows={2}
          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
        />
        {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Email (Optional)</label>
        <input
          {...register("email")}
          type="email"
          className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          placeholder="email@example.com"
        />
        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
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
            initialData ? "Update Student" : "Register Student"
          )}
        </button>
      </div>
    </form>
  );
}
