"use server";

import { GenericService } from "@/lib/services/generic-service";

const TeacherService = new GenericService<any>("teacher", "/admin-route/teachers");

export async function createTeacherAction(data: any) {
  return await TeacherService.create(data);
}

export async function updateTeacherAction(id: number, data: any) {
  return await TeacherService.update(id, data);
}

export async function deleteTeacherAction(id: number) {
  return await TeacherService.delete(id);
}

export async function getAllTeachers() {
  return await TeacherService.getAll();
}

export async function getTeacherById(id: number) {
  return await TeacherService.getById(id);
}
