"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { requireRole } from "@/lib/auth-guard";

const SAFE_USER_SELECT = {
  id: true,
  username: true,
  name: true,
  role: true,
  active: true,
} as const;

export async function getUsersAction() {
  await requireRole("ADMIN");
  return await prisma.user.findMany({
    select: SAFE_USER_SELECT,
    orderBy: { id: "desc" },
  });
}

export async function createUserAction(data: {
  username: string;
  password: string;
  name: string;
  role: string;
}) {
  await requireRole("ADMIN");
  try {
    const existing = await prisma.user.findUnique({
      where: { username: data.username.trim() },
    });
    if (existing) {
      return { success: false, error: "Username already exists" };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        username: data.username.trim(),
        password: hashedPassword,
        name: data.name.trim(),
        role: data.role as "ADMIN" | "STAFF" | "TEACHER" | "STUDENT",
      },
      select: SAFE_USER_SELECT,
    });

    revalidatePath("/admin-route/users");
    return { success: true, data: user };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, error: "Failed to create user" };
  }
}

export async function updateUserAction(id: number, data: {
  username?: string;
  name: string;
  role: string;
  password?: string;
}) {
  await requireRole("ADMIN");
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return { success: false, error: "User not found" };

    const trimmedName = data.name.trim();
    const updateData: {
      username?: string;
      name: string;
      role: "ADMIN" | "STAFF" | "TEACHER" | "STUDENT";
      password?: string;
    } = {
      name: trimmedName,
      role: data.role as "ADMIN" | "STAFF" | "TEACHER" | "STUDENT",
    };

    if (data.username && data.username.trim() !== user.username) {
      const trimmedUsername = data.username.trim();
      const existing = await prisma.user.findUnique({
        where: { username: trimmedUsername },
      });
      if (existing && existing.id !== id) {
        return { success: false, error: "Username already exists" };
      }
      updateData.username = trimmedUsername;
    }

    if (data.password && data.password.trim().length > 0) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: SAFE_USER_SELECT,
    });

    // Sync name to student or teacher if linked
    if (user.role === "TEACHER") {
      await prisma.teacher.updateMany({
        where: { userId: id },
        data: { name: trimmedName },
      });
    } else if (user.role === "STUDENT") {
      await prisma.student.updateMany({
        where: { userId: id },
        data: { name: trimmedName },
      });
    }

    revalidatePath("/admin-route/users");
    revalidatePath("/admin-route/profile");
    revalidatePath("/admin-route/students");
    revalidatePath("/admin-route/teachers");
    return { success: true, data: updatedUser };
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, error: "Failed to update user" };
  }
}

export async function deleteUserAction(id: number) {
  const currentAdmin = await requireRole("ADMIN");
  if (parseInt(currentAdmin.id) === id) {
    return { success: false, error: "Cannot delete your own active administrator account" };
  }

  try {
    await prisma.user.delete({
      where: { id },
    });
    revalidatePath("/admin-route/users");
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: "Failed to delete user" };
  }
}

export async function toggleUserAction(id: number) {
  const currentAdmin = await requireRole("ADMIN");
  if (parseInt(currentAdmin.id) === id) {
    return { success: false, error: "Cannot deactivate your own administrator account" };
  }

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return { success: false, error: "User not found" };

    await prisma.user.update({
      where: { id },
      data: { active: !user.active },
      select: SAFE_USER_SELECT,
    });

    revalidatePath("/admin-route/users");
    return { success: true };
  } catch (error) {
    console.error("Error toggling user:", error);
    return { success: false, error: "Failed to update user" };
  }
}
