"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateUserProfileAction } from "@/app/actions/registration";
import { toast } from "sonner";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  mobile: z.string().optional(),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  address: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileEditFormProps {
  userId: number;
  initialData: {
    name: string;
    email?: string;
    mobile?: string;
    fatherName?: string;
    motherName?: string;
    address?: string;
  };
  role: string;
  isEditable: boolean;
}

export function ProfileEditForm({ userId, initialData, role, isEditable }: ProfileEditFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialData.name || "",
      email: initialData.email || "",
      mobile: initialData.mobile || "",
      fatherName: initialData.fatherName || "",
      motherName: initialData.motherName || "",
      address: initialData.address || "",
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    try {
      const result = await updateUserProfileAction(userId, data);
      if (result.success) {
        toast.success("Profile updated successfully");
        setIsEditing(false);
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  if (!isEditable) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Edit Profile Information</h2>
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Name *</label>
              <input
                {...register("name")}
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                placeholder="Enter name"
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Email</label>
              <input
                {...register("email")}
                type="email"
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                placeholder="Enter email"
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {(role === "STUDENT" || role === "TEACHER") && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Mobile</label>
                <input
                  {...register("mobile")}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="Enter mobile"
                />
              </div>
            )}

            {role === "STUDENT" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Father&apos;s Name</label>
                  <input
                    {...register("fatherName")}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="Enter father's name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Mother&apos;s Name</label>
                  <input
                    {...register("motherName")}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="Enter mother's name"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Address</label>
                  <input
                    {...register("address")}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="Enter address"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {isLoading && (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              Save Changes
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="text-gray-500 text-sm">
          Click &quot;Edit&quot; to modify your profile information.
        </div>
      )}
    </div>
  );
}
