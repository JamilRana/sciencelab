"use server";

import { GenericService } from "@/lib/services/generic-service";

const ExamService = new GenericService<any>("exam", "/admin-route/exams");

export async function createExamAction(data: any) {
  return await ExamService.create(data);
}

export async function updateExamAction(id: number, data: any) {
  return await ExamService.update(id, data);
}

export async function deleteExamAction(id: number) {
  return await ExamService.delete(id);
}
