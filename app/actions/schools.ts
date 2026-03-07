"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createSchoolAction(data: { name: string }) {
  try {
    const school = await prisma.school.create({
      data: { name: data.name },
    });
    revalidatePath("/admin-route/schools");
    return { success: true, data: school };
  } catch (error) {
    console.error("Error creating school:", error);
    return { success: false, error: "Failed to create school" };
  }
}

export async function updateSchoolAction(id: number, data: { name: string }) {
  try {
    const school = await prisma.school.update({
      where: { id },
      data: { name: data.name },
    });
    revalidatePath("/admin-route/schools");
    return { success: true, data: school };
  } catch (error) {
    console.error("Error updating school:", error);
    return { success: false, error: "Failed to update school" };
  }
}

export async function deleteSchoolAction(id: number) {
  try {
    await prisma.school.delete({
      where: { id },
    });
    revalidatePath("/admin-route/schools");
    return { success: true };
  } catch (error) {
    console.error("Error deleting school:", error);
    return { success: false, error: "Failed to delete school" };
  }
}
