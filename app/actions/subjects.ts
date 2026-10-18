"use server";

import { GenericService } from "@/lib/services/generic-service";
import { requireRole } from "@/lib/auth-guard";

const SubjectService = new GenericService<any>("examSubject", "/admin-route/exams");

export async function createSubjectAction(data: any) {
  await requireRole(["ADMIN", "STAFF"]);
  return await SubjectService.create({
    examId: data.examId,
    subject: data.subject,
    teacherId: parseInt(data.teacherId),
    totalMark: data.totalMark,
    examDate: new Date(data.examDate),
    topics: data.topics,
  });
}

export async function updateSubjectAction(id: number, data: any) {
  await requireRole(["ADMIN", "STAFF"]);
  return await SubjectService.update(id, {
    subject: data.subject,
    teacherId: parseInt(data.teacherId),
    totalMark: data.totalMark,
    examDate: new Date(data.examDate),
    topics: data.topics,
  });
}

export async function deleteSubjectAction(id: number) {
  await requireRole(["ADMIN", "STAFF"]);
  return await SubjectService.delete(id);
}
