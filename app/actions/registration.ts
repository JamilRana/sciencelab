"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import crypto from "crypto";
import { requireRole, requireAuth } from "@/lib/auth-guard";

function generateSecureTemporaryPassword(): string {
  return `ScLab-${crypto.randomBytes(4).toString("hex")}`;
}

const studentRegistrationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mobile: z.string().min(1, "Mobile is required"),
  role: z.literal("STUDENT"),
  fatherName: z.string().min(1, "Father's name is required"),
  motherName: z.string().min(1, "Mother's name is required"),
  address: z.string().min(1, "Address is required"),
  gender: z.string().min(1, "Gender is required"),
  class: z.string().min(1, "Class is required"),
  schoolId: z.string().min(1, "School is required"),
  batchId: z.string().min(1, "Batch is required"),
  email: z.string().optional(),
  homeMobile: z.string().optional(),
  dob: z.string().optional(),
  password: z.string().optional(),
});

const teacherRegistrationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mobile: z.string().min(1, "Mobile is required"),
  role: z.literal("TEACHER"),
  gender: z.string().min(1, "Gender is required"),
  email: z.string().optional(),
  password: z.string().optional(),
});

const staffRegistrationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().min(1, "Username is required"),
  role: z.union([z.literal("ADMIN"), z.literal("STAFF")]),
  password: z.string().optional(),
});

export type RegistrationInput = 
  | z.infer<typeof studentRegistrationSchema>
  | z.infer<typeof teacherRegistrationSchema>
  | z.infer<typeof staffRegistrationSchema>;

export type RegistrationResult = {
  success: boolean;
  data?: {
    userId: number;
    profileId: number;
    role: string;
    username: string;
    name: string;
    temporaryPassword?: string;
  };
  error?: string;
};

async function generateUsername(name: string, role: string): Promise<string> {
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const rolePrefix = role === "STUDENT" ? "stu" : role === "TEACHER" ? "tch" : "staff";
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `${rolePrefix}${cleanName}${random}`;
}

export async function createUserAndProfileAction(
  rawData: RegistrationInput
): Promise<RegistrationResult> {
  await requireRole(["ADMIN", "STAFF"]);
  try {
    let validatedData: z.infer<typeof studentRegistrationSchema | typeof teacherRegistrationSchema | typeof staffRegistrationSchema>;
    let role: string;

    if (rawData.role === "STUDENT") {
      validatedData = studentRegistrationSchema.parse(rawData);
      role = "STUDENT";
    } else if (rawData.role === "TEACHER") {
      validatedData = teacherRegistrationSchema.parse(rawData);
      role = "TEACHER";
    } else {
      validatedData = staffRegistrationSchema.parse(rawData);
      role = rawData.role;
    }

    const password = validatedData.password && validatedData.password.trim().length > 0
      ? validatedData.password.trim()
      : generateSecureTemporaryPassword();
    const hashedPassword = await bcrypt.hash(password, 10);
    const username = "username" in validatedData 
      ? validatedData.username 
      : await generateUsername(validatedData.name, role);

    const result = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { username },
      });

      if (existingUser) {
        throw new Error("USERNAME_EXISTS");
      }

      const user = await tx.user.create({
        data: {
          username,
          password: hashedPassword,
          name: validatedData.name,
          role: role as "ADMIN" | "STAFF" | "TEACHER" | "STUDENT",
        },
      });

      let profile;

      if (role === "STUDENT") {
        const studentData = validatedData as z.infer<typeof studentRegistrationSchema>;
        
        const lastStudent = await tx.student.findFirst({
          where: { batchId: parseInt(studentData.batchId) },
          orderBy: { roll: "desc" },
          select: { roll: true },
        });
        const nextRoll = lastStudent ? lastStudent.roll + 1 : 1;

        profile = await tx.student.create({
          data: {
            name: studentData.name,
            fatherName: studentData.fatherName,
            motherName: studentData.motherName,
            mobile: studentData.mobile,
            homeMobile: studentData.homeMobile || "",
            address: studentData.address,
            gender: studentData.gender,
            email: studentData.email || "",
            dob: studentData.dob ? new Date(studentData.dob) : null,
            class: studentData.class,
            schoolId: parseInt(studentData.schoolId),
            batchId: parseInt(studentData.batchId),
            roll: nextRoll,
          } as any,
        });

        await tx.student.update({
          where: { id: profile.id },
          data: { userId: user.id } as any,
        });
      } else if (role === "TEACHER") {
        const teacherData = validatedData as z.infer<typeof teacherRegistrationSchema>;
        
        const existingTeacher = await tx.teacher.findUnique({
          where: { mobile: teacherData.mobile },
        });

        if (existingTeacher) {
          throw new Error("TEACHER_MOBILE_EXISTS");
        }

        profile = await tx.teacher.create({
          data: {
            name: teacherData.name,
            mobile: teacherData.mobile,
            gender: teacherData.gender,
            email: teacherData.email || "",
          } as any,
        });

        await tx.teacher.update({
          where: { id: profile.id },
          data: { userId: user.id } as any,
        });
      } else {
        profile = { id: user.id, name: user.name } as { id: number; name: string };
      }

      return { user, profile };
    });

    revalidatePath("/admin-route/students");
    revalidatePath("/admin-route/teachers");
    revalidatePath("/admin-route/users");

    return {
      success: true,
      data: {
        userId: result.user.id,
        profileId: result.profile.id,
        role,
        username,
        name: validatedData.name,
        temporaryPassword: password,
      },
    };
  } catch (error) {
    console.error("Error in createUserAndProfileAction:", error);

    if (error instanceof z.ZodError) {
      const firstError = (error as any).issues?.[0] || (error as any).errors?.[0];
      const path = Array.isArray(firstError?.path) ? firstError.path.join(".") : "field";
      return {
        success: false,
        error: `${path}: ${firstError?.message || "Validation failed"}`,
      };
    }

    if (error instanceof Error) {
      if (error.message === "USERNAME_EXISTS") {
        return {
          success: false,
          error: "Username already exists. Please try again with a different username.",
        };
      }
      if (error.message === "TEACHER_MOBILE_EXISTS") {
        return {
          success: false,
          error: "A teacher with this mobile number already exists.",
        };
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          const field = error.meta?.target as string[] | undefined;
          return {
            success: false,
            error: `A record with this ${field?.[0] || "value"} already exists.`,
          };
        }
      }
    }

    return {
      success: false,
      error: "Failed to create user and profile. Please try again.",
    };
  }
}

export async function changePasswordAction(
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const sessionUser = await requireAuth();
    if (parseInt(sessionUser.id) !== userId && sessionUser.role !== "ADMIN") {
      return { success: false, error: "Forbidden: You can only change your own password" };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return { success: false, error: "Current password is incorrect" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true };
  } catch (error) {
    console.error("Error changing password:", error);
    return { success: false, error: "Failed to change password" };
  }
}

export async function resetUserPasswordAction(
  userId: number
): Promise<{ success: boolean; error?: string; newPassword?: string }> {
  try {
    await requireRole("ADMIN");

    const newPassword = generateSecureTemporaryPassword();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true, newPassword };
  } catch (error) {
    console.error("Error resetting password:", error);
    return { success: false, error: "Failed to reset password" };
  }
}

export async function adminSetUserPasswordAction(
  userId: number,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole("ADMIN");

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "Password must be at least 6 characters" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true };
  } catch (error) {
    console.error("Error setting user password:", error);
    return { success: false, error: "Failed to set user password" };
  }
}

export type UserProfileData = {
  user: {
    id: number;
    username: string;
    name: string;
    role: string;
  };
  profile?: {
    id: number;
    name: string;
    mobile: string;
    email: string;
    gender?: string;
    fatherName?: string;
    motherName?: string;
    address?: string;
    class?: string;
    batch?: { id: number; name: string };
    school?: { id: number; name: string };
  } | null;
};

export async function updateUserProfileAction(
  userId: number,
  data: {
    name?: string;
    username?: string;
    email?: string;
    mobile?: string;
    fatherName?: string;
    motherName?: string;
    address?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  if (!userId) {
    return { success: false, error: "User not found" };
  }

  const sessionUser = await requireAuth();
  if (parseInt(sessionUser.id) !== userId && sessionUser.role !== "ADMIN") {
    return { success: false, error: "Forbidden: You can only edit your own profile" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const trimmedUsername = data.username !== undefined ? data.username.trim() : user.username;
    const trimmedName = data.name !== undefined ? data.name.trim() : user.name;

    if (!trimmedUsername) {
      return { success: false, error: "Username cannot be empty" };
    }
    if (!trimmedName) {
      return { success: false, error: "Name cannot be empty" };
    }

    // Check if username is being changed and validate uniqueness
    if (trimmedUsername !== user.username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username: trimmedUsername },
      });
      if (existingUsername && existingUsername.id !== userId) {
        return { success: false, error: "Username already taken" };
      }
    }

    // Check teacher mobile uniqueness if teacher mobile is being changed
    if (user.role === "TEACHER" && data.mobile && data.mobile.trim()) {
      const trimmedMobile = data.mobile.trim();
      const existingTeacher = await prisma.teacher.findFirst({
        where: {
          mobile: trimmedMobile,
          NOT: { userId: user.id },
        },
      });
      if (existingTeacher) {
        return { success: false, error: "Mobile number is already used by another teacher" };
      }
    }

    // Update user fields
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: trimmedName,
        username: trimmedUsername,
      },
    });

    if (user.role === "TEACHER") {
      let teacher = await prisma.teacher.findFirst({
        where: { userId },
      });
      if (!teacher) {
        teacher = await prisma.teacher.findFirst({
          where: { mobile: user.username },
        });
      }
      if (teacher) {
        await prisma.teacher.update({
          where: { id: teacher.id },
          data: {
            name: trimmedName,
            userId: user.id,
            email: data.email !== undefined ? data.email.trim() : teacher.email,
            mobile: data.mobile !== undefined && data.mobile.trim() ? data.mobile.trim() : teacher.mobile,
          },
        });
      }
    } else if (user.role === "STUDENT") {
      let student = await prisma.student.findFirst({
        where: { userId },
      });
      if (!student) {
        student = await prisma.student.findFirst({
          where: {
            OR: [
              { mobile: user.username },
              { email: user.username },
            ],
          },
        });
      }
      if (student) {
        await prisma.student.update({
          where: { id: student.id },
          data: {
            name: trimmedName,
            userId: user.id,
            email: data.email !== undefined ? data.email.trim() : student.email,
            mobile: data.mobile !== undefined && data.mobile.trim() ? data.mobile.trim() : student.mobile,
            fatherName: data.fatherName !== undefined ? data.fatherName.trim() : student.fatherName,
            motherName: data.motherName !== undefined ? data.motherName.trim() : student.motherName,
            address: data.address !== undefined ? data.address.trim() : student.address,
          },
        });
      }
    }

    revalidatePath("/admin-route/profile");
    revalidatePath("/student-route/profile");
    revalidatePath("/teacher-route/profile");
    revalidatePath("/admin-route/users");
    revalidatePath("/admin-route/students");
    revalidatePath("/admin-route/teachers");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating profile:", error);
    if (error?.code === "P2002") {
      return { success: false, error: "A unique constraint error occurred. Username or mobile may already be in use." };
    }
    return { success: false, error: error?.message || "Failed to update profile" };
  }
}

export async function getUserProfileAction(userId: number): Promise<UserProfileData | null> {
  const sessionUser = await requireAuth();
  if (parseInt(sessionUser.id) !== userId && !["ADMIN", "STAFF"].includes(sessionUser.role)) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
      },
    });

    if (!user) return null;

    let profile: any = null;

    if (user.role === "TEACHER") {
      let teacher = await prisma.teacher.findFirst({
        where: { userId: user.id },
      });
      if (!teacher) {
        teacher = await prisma.teacher.findFirst({
          where: { mobile: user.username },
        });
        if (teacher && !teacher.userId) {
          await prisma.teacher.update({
            where: { id: teacher.id },
            data: { userId: user.id },
          });
        }
      }
      profile = teacher;
    } else if (user.role === "STUDENT") {
      let student = await prisma.student.findFirst({
        where: { userId: user.id },
        include: {
          batch: true,
          school: true,
        },
      });
      if (!student) {
        student = await prisma.student.findFirst({
          where: {
            OR: [
              { mobile: user.username },
              { email: user.username },
            ],
          },
          include: {
            batch: true,
            school: true,
          },
        });
        if (student && !student.userId) {
          await prisma.student.update({
            where: { id: student.id },
            data: { userId: user.id },
          });
        }
      }
      profile = student;
    }

    return { user, profile: profile as UserProfileData["profile"] };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}
