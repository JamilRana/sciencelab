"use server";

import { GenericService } from "@/lib/services/generic-service";

const SubjectService = new GenericService<any>("examSubject", "/admin-route/exams");

export async function createSubjectAction(data: any) {
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
  return await SubjectService.update(id, {
    subject: data.subject,
    teacherId: parseInt(data.teacherId),
    totalMark: data.totalMark,
    examDate: new Date(data.examDate),
    topics: data.topics,
  });
}

export async function deleteSubjectAction(id: number) {
  return await SubjectService.delete(id);
}
