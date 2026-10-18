"use server";

import { BatchService } from "@/lib/services/generic-service";
import { BatchFormValues } from "@/components/forms/BatchForm";
import { requireRole } from "@/lib/auth-guard";

export async function createBatchAction(data: BatchFormValues) {
  await requireRole(["ADMIN", "STAFF"]);
  return await BatchService.create(data);
}

export async function updateBatchAction(id: number, data: BatchFormValues) {
  await requireRole(["ADMIN", "STAFF"]);
  return await BatchService.update(id, data);
}

export async function deleteBatchAction(id: number) {
  await requireRole(["ADMIN", "STAFF"]);
  return await BatchService.delete(id);
}
