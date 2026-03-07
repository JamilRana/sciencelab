"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(4, "Password must be at least 4 characters").optional(),
  name: z.string().min(2, "Name is required"),
  role: z.string().min(1, "Please select role"),
});

export type UserFormValues = z.infer<typeof userSchema>;

interface UserFormProps {
  initialData?: { id?: number; username: string; name: string; role: string };
  onSubmit: (data: UserFormValues) => void;
  isLoading?: boolean;
}

export function UserForm({ initialData, onSubmit, isLoading }: UserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: initialData?.username || "",
      name: initialData?.name || "",
      role: initialData?.role || "STAFF",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Username</label>
        <input
          {...register("username")}
          disabled={!!initialData}
          className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all disabled:opacity-50"
          placeholder="Enter username"
        />
        {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">
          {initialData ? "New Password (leave blank to keep)" : "Password"}
        </label>
        <input
          {...register("password")}
          type="password"
          className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          placeholder="Enter password"
        />
        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Name</label>
        <input
          {...register("name")}
          className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          placeholder="Enter name"
        />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Role</label>
        <select
          {...register("role")}
          className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
        >
          <option value="ADMIN">Admin</option>
          <option value="STAFF">Staff</option>
          <option value="TEACHER">Teacher</option>
          <option value="STUDENT">Student</option>
        </select>
        {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
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
            initialData?.id ? "Update User" : "Create User"
          )}
        </button>
      </div>
    </form>
  );
}
