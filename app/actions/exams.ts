"use server";

import { GenericService } from "@/lib/services/generic-service";
import { requireRole } from "@/lib/auth-guard";

const ExamService = new GenericService<any>("exam", "/admin-route/exams");

export async function createExamAction(data: any) {
  await requireRole(["ADMIN", "STAFF"]);
  return await ExamService.create(data);
}

export async function updateExamAction(id: number, data: any) {
  await requireRole(["ADMIN", "STAFF"]);
  return await ExamService.update(id, data);
}

export async function deleteExamAction(id: number) {
  await requireRole(["ADMIN", "STAFF"]);
  return await ExamService.delete(id);
}
