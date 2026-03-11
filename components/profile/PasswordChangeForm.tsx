"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { changePasswordAction } from "@/app/actions/registration";
import { toast } from "sonner";
import { Eye, EyeOff, Lock } from "lucide-react";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a number"),
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
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: PasswordFormValues) => {
    setIsLoading(true);
    try {
      const result = await changePasswordAction(
        userId,
        data.currentPassword,
        data.newPassword
      );
      if (result.success) {
        toast.success("✓ Password updated successfully", {
          description: "Please use your new password next time",
        });
        reset();
      } else {
        toast.error("✗ " + (result.error || "Failed to change password"));
      }
    } catch {
      toast.error("✗ An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const InputField = ({ 
    name, label, placeholder, showToggle, setShowToggle 
  }: any) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <Lock className="h-4 w-4 text-gray-400" />
        {label}
      </label>
      <div className="relative">
        <input
          {...register(name)}
          type={showToggle ? "text" : "password"}
          className={`w-full h-11 px-4 pr-10 bg-gray-50 border rounded-xl 
            focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 
            outline-none transition-all duration-200
            ${errors[name] ? "border-red-300 bg-red-50/50" : "border-gray-200 hover:border-gray-300"}`}
          placeholder={placeholder}
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setShowToggle(!showToggle)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
          >
            {showToggle ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {errors[name] && (
        <p className="text-xs text-red-500 flex items-center gap-1 animate-pulse">
          ⚠ {errors[name]?.message}
        </p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <InputField 
        name="currentPassword" 
        label="Current Password" 
        placeholder="••••••••" 
        showToggle={showCurrent} 
        setShowToggle={setShowCurrent} 
      />
      <InputField 
        name="newPassword" 
        label="New Password" 
        placeholder="At least 8 characters" 
        showToggle={showNew} 
        setShowToggle={setShowNew} 
      />
      <InputField 
        name="confirmPassword" 
        label="Confirm New Password" 
        placeholder="••••••••" 
        showToggle={showConfirm} 
        setShowToggle={setShowConfirm} 
      />
      
      <button
        type="submit"
        disabled={isLoading || isSubmitting}
        className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 
          hover:from-blue-700 hover:to-blue-800 
          disabled:from-blue-400 disabled:to-blue-500 
          text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 
          transition-all duration-200 flex items-center justify-center gap-2
          active:scale-[0.98]"
      >
        {isLoading ? (
          <>
            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Updating...
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" />
            Update Password
          </>
        )}
      </button>
    </form>
  );
}