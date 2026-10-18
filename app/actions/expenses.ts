"use server";

import { GenericService } from "@/lib/services/generic-service";
import { requireRole } from "@/lib/auth-guard";

const ExpenseService = new GenericService<any>("expense", "/admin-route/expenses");

export async function createExpenseAction(data: any) {
  await requireRole("ADMIN");
  return await ExpenseService.create({
    ...data,
    date: new Date(data.date),
  });
}

export async function updateExpenseAction(id: number, data: any) {
  await requireRole("ADMIN");
  return await ExpenseService.update(id, {
    ...data,
    date: new Date(data.date),
  });
}

export async function deleteExpenseAction(id: number) {
  await requireRole("ADMIN");
  return await ExpenseService.delete(id);
}
