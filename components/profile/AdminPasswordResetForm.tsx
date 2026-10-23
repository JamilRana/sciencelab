"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { adminSetUserPasswordAction } from "@/app/actions/registration";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, ShieldAlert } from "lucide-react";

const schema = z
  .object({
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm the password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

interface AdminPasswordResetFormProps {
  userId: number;
  username: string;
}

export function AdminPasswordResetForm({ userId, username }: AdminPasswordResetFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      const res = await adminSetUserPasswordAction(userId, data.newPassword);
      if (res.success) {
        toast.success(`Password updated for user "${username}"`);
        reset();
      } else {
        toast.error(res.error || "Failed to update password");
      }
    } catch {
      toast.error("An error occurred while resetting password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
        <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
        <span>As an administrator, you can directly set a new password for this user without requiring their current password.</span>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Lock className="h-4 w-4 text-gray-400" />
          New Password
        </label>
        <div className="relative">
          <input
            {...register("newPassword")}
            type={showPassword ? "text" : "password"}
            className="w-full h-10 px-3 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            placeholder="At least 6 characters"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.newPassword && (
          <p className="text-xs text-red-500 mt-0.5">{errors.newPassword.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Lock className="h-4 w-4 text-gray-400" />
          Confirm New Password
        </label>
        <input
          {...register("confirmPassword")}
          type={showPassword ? "text" : "password"}
          className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          placeholder="Repeat new password"
        />
        {errors.confirmPassword && (
          <p className="text-xs text-red-500 mt-0.5">{errors.confirmPassword.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-sm rounded-lg shadow transition flex items-center justify-center gap-2"
      >
        <Lock className="h-4 w-4" />
        {isLoading ? "Updating Password..." : "Set User Password"}
      </button>
    </form>
  );
}
