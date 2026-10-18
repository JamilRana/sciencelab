"use server";

import { GenericService } from "@/lib/services/generic-service";
import { requireRole } from "@/lib/auth-guard";

const TeacherService = new GenericService<any>("teacher", "/admin-route/teachers");

export async function createTeacherAction(data: any) {
  await requireRole(["ADMIN", "STAFF"]);
  return await TeacherService.create(data);
}

export async function updateTeacherAction(id: number, data: any) {
  await requireRole(["ADMIN", "STAFF"]);
  return await TeacherService.update(id, data);
}

export async function deleteTeacherAction(id: number) {
  await requireRole(["ADMIN", "STAFF"]);
  return await TeacherService.delete(id);
}

export async function getAllTeachers() {
  await requireRole(["ADMIN", "STAFF", "TEACHER"]);
  return await TeacherService.getAll();
}

export async function getTeacherById(id: number) {
  await requireRole(["ADMIN", "STAFF", "TEACHER"]);
  return await TeacherService.getById(id);
}
