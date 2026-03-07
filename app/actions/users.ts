"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function getUsersAction() {
  return await prisma.user.findMany({
    orderBy: { id: "desc" },
  });
}

export async function createUserAction(data: {
  username: string;
  password: string;
  name: string;
  role: string;
}) {
  try {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        name: data.name,
        role: data.role as "ADMIN" | "STAFF" | "TEACHER" | "STUDENT",
      },
    });
    revalidatePath("/admin-route/users");
    return { success: true, data: user };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, error: "Failed to create user" };
  }
}

export async function updateUserAction(id: number, data: {
  name: string;
  role: string;
  password?: string;
}) {
  try {
    const updateData: {
      name: string;
      role: "ADMIN" | "STAFF" | "TEACHER" | "STUDENT";
      password?: string;
    } = {
      name: data.name,
      role: data.role as "ADMIN" | "STAFF" | "TEACHER" | "STUDENT",
    };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });
    revalidatePath("/admin-route/users");
    return { success: true, data: user };
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, error: "Failed to update user" };
  }
}

export async function deleteUserAction(id: number) {
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
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return { success: false, error: "User not found" };

    await prisma.user.update({
      where: { id },
      data: { active: !user.active },
    });
    revalidatePath("/admin-route/users");
    return { success: true };
  } catch (error) {
    console.error("Error toggling user:", error);
    return { success: false, error: "Failed to update user" };
  }
}
