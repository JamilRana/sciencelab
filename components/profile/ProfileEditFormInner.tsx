"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { updateUserProfileAction } from "@/app/actions/registration";

const schema = z.object({
  username: z.string().trim().min(3, "Username must be at least 3 characters"),
  name: z.string().trim().min(1, "Name is required"),
  email: z
    .string()
    .trim()
    .refine((val) => !val || z.string().email().safeParse(val).success, {
      message: "Please enter a valid email address",
    })
    .optional()
    .or(z.literal("")),
  mobile: z
    .string()
    .trim()
    .refine((val) => !val || val.length >= 10, {
      message: "Mobile number must be at least 10 digits",
    })
    .optional()
    .or(z.literal("")),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  address: z.string().optional(),
});

type ProfileFormData = z.infer<typeof schema>;

interface Props {
  userId: number;
  role: string;
  initialData: ProfileFormData;
  onClose: () => void;
}

export function ProfileEditFormInner({ userId, role, initialData, onClose }: Props) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData,
  });

  const onSubmit = async (data: ProfileFormData) => {
    if (!isDirty) {
      toast.info("No changes to save");
      return;
    }

    try {
      const result = await updateUserProfileAction(userId, data);

      if (result.success) {
        toast.success("Profile updated successfully");
        router.refresh();
        onClose();
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Unexpected error occurred");
    }
  };

  const inputClass = (error?: any) =>
    `w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 ${
      error
        ? "border-red-500 focus:ring-red-200"
        : "border-gray-300 focus:ring-black"
    }`;

  const hasExtraFields = role === "TEACHER" || role === "STUDENT";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Username */}
      <div>
        <label className="text-sm font-medium text-gray-700">Username</label>
        <input {...register("username")} className={inputClass(errors.username)} />
        {errors.username && (
          <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>
        )}
      </div>

      {/* Name */}
      <div>
        <label className="text-sm font-medium text-gray-700">Full Name</label>
        <input {...register("name")} className={inputClass(errors.name)} />
        {errors.name && (
          <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* Email & Mobile for Teacher & Student */}
      {hasExtraFields && (
        <>
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              {...register("email")}
              type="email"
              className={inputClass(errors.email)}
              placeholder="name@example.com"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Mobile</label>
            <input
              {...register("mobile")}
              className={inputClass(errors.mobile)}
              placeholder="01XXXXXXXXX"
            />
            {errors.mobile && (
              <p className="text-red-500 text-xs mt-1">{errors.mobile.message}</p>
            )}
          </div>
        </>
      )}

      {/* Student Specific Fields */}
      {role === "STUDENT" && (
        <>
          <div>
            <label className="text-sm font-medium text-gray-700">Father's Name</label>
            <input {...register("fatherName")} className={inputClass(errors.fatherName)} />
            {errors.fatherName && (
              <p className="text-red-500 text-xs mt-1">{errors.fatherName.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Mother's Name</label>
            <input {...register("motherName")} className={inputClass(errors.motherName)} />
            {errors.motherName && (
              <p className="text-red-500 text-xs mt-1">{errors.motherName.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Address</label>
            <input {...register("address")} className={inputClass(errors.address)} />
            {errors.address && (
              <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>
            )}
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border rounded-md hover:bg-gray-50 transition text-sm font-medium text-gray-700"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="px-4 py-2 bg-black text-white rounded-md disabled:opacity-50 transition text-sm font-medium"
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
