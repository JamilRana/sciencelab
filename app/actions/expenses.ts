"use server";

import { GenericService } from "@/lib/services/generic-service";

const ExpenseService = new GenericService<any>("expense", "/admin-route/expenses");

export async function createExpenseAction(data: any) {
  return await ExpenseService.create({
    ...data,
    date: new Date(data.date),
  });
}

export async function updateExpenseAction(id: number, data: any) {
  return await ExpenseService.update(id, {
    ...data,
    date: new Date(data.date),
  });
}

export async function deleteExpenseAction(id: number) {
  return await ExpenseService.delete(id);
}
