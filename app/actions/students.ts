"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { StudentFormValues } from "@/components/forms/StudentForm";

async function getNextRollNumber(batchId: number): Promise<number> {
  const lastStudent = await prisma.student.findFirst({
    where: { batchId },
    orderBy: { roll: "desc" },
    select: { roll: true },
  });
  
  return lastStudent ? lastStudent.roll + 1 : 1;
}

export async function createStudentAction(data: StudentFormValues) {
  try {
    const batchId = parseInt(data.batchId);
    
    // Get next roll number for this batch
    const roll = await getNextRollNumber(batchId);
    
    const student = await prisma.student.create({
      data: {
        name: data.name,
        fatherName: data.fatherName,
        motherName: data.motherName,
        mobile: data.mobile,
        homeMobile: data.homeMobile || "",
        address: data.address,
        gender: data.gender,
        email: data.email || "",
        dob: data.dob ? new Date(data.dob) : null,
        class: data.class,
        schoolId: parseInt(data.schoolId),
        batchId: batchId,
        roll: roll,
      },
    });
    
    revalidatePath("/admin-route/students");
    return { success: true, data: student };
  } catch (error) {
    console.error("Error creating student:", error);
    return { success: false, error: "Failed to create student" };
  }
}

export async function updateStudentAction(id: number, data: StudentFormValues) {
  try {
    const student = await prisma.student.update({
      where: { id },
      data: {
        name: data.name,
        fatherName: data.fatherName,
        motherName: data.motherName,
        homeMobile: data.homeMobile || "",
        address: data.address,
        gender: data.gender,
        email: data.email || "",
        dob: data.dob ? new Date(data.dob) : null,
        class: data.class,
        schoolId: parseInt(data.schoolId),
        batchId: parseInt(data.batchId),
      },
    });
    
    revalidatePath("/admin-route/students");
    return { success: true, data: student };
  } catch (error) {
    console.error("Error updating student:", error);
    return { success: false, error: "Failed to update student" };
  }
}

export async function deleteStudentAction(id: number) {
  try {
    await prisma.student.delete({
      where: { id },
    });
    
    revalidatePath("/admin-route/students");
    return { success: true };
  } catch (error) {
    console.error("Error deleting student:", error);
    return { success: false, error: "Failed to delete student" };
  }
}
