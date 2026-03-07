"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { changePasswordAction } from "@/app/actions/registration";
import { toast } from "sonner";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

interface PasswordChangeFormProps {
  userId: number;
}

export function PasswordChangeForm({ userId }: PasswordChangeFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data: PasswordFormValues) => {
    setIsLoading(true);
    try {
      const result = await changePasswordAction(userId, data.currentPassword, data.newPassword);
      if (result.success) {
        toast.success("Password changed successfully");
        reset();
      } else {
        toast.error(result.error || "Failed to change password");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Current Password</label>
        <input
          {...register("currentPassword")}
          type="password"
          className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          placeholder="Enter current password"
        />
        {errors.currentPassword && (
          <p className="text-xs text-red-500">{errors.currentPassword.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">New Password</label>
        <input
          {...register("newPassword")}
          type="password"
          className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          placeholder="Enter new password"
        />
        {errors.newPassword && (
          <p className="text-xs text-red-500">{errors.newPassword.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Confirm New Password</label>
        <input
          {...register("confirmPassword")}
          type="password"
          className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          placeholder="Confirm new password"
        />
        {errors.confirmPassword && (
          <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
        )}
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
              Changing...
            </>
          ) : (
            "Change Password"
          )}
        </button>
      </div>
    </form>
  );
}
