"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const DEFAULT_PASSWORD = "Sl@bcc2015";

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

    const password = validatedData.password || DEFAULT_PASSWORD;
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
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true, newPassword: DEFAULT_PASSWORD };
  } catch (error) {
    console.error("Error resetting password:", error);
    return { success: false, error: "Failed to reset password" };
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
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { name: data.name || user.name },
    });

    if (user.role === "TEACHER") {
      const teacher = await prisma.teacher.findFirst({
        where: { userId } as any,
      });

      if (teacher) {
        await prisma.teacher.update({
          where: { id: teacher.id },
          data: {
            name: data.name,
            email: data.email,
            mobile: data.mobile || teacher.mobile,
          } as any,
        });
      }
    } else if (user.role === "STUDENT") {
      const student = await prisma.student.findFirst({
        where: { userId } as any,
      });

      if (student) {
        await prisma.student.update({
          where: { id: student.id },
          data: {
            name: data.name,
            email: data.email,
            mobile: data.mobile || student.mobile,
            fatherName: data.fatherName,
            motherName: data.motherName,
            address: data.address,
          } as any,
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

export async function getUserProfileAction(userId: number): Promise<UserProfileData | null> {
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
      profile = await prisma.teacher.findFirst({
        where: { userId: user.id } as any,
        select: {
          id: true,
          name: true,
          mobile: true,
          email: true,
          gender: true,
        },
      });
    } else if (user.role === "STUDENT") {
      profile = await prisma.student.findFirst({
        where: { userId: user.id } as any,
        include: {
          batch: true,
          school: true,
        },
      });
    }

    return { user, profile: profile as UserProfileData["profile"] };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}
