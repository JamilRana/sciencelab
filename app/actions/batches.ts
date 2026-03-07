"use server";

import { BatchService } from "@/lib/services/generic-service";
import { BatchFormValues } from "@/components/forms/BatchForm";

export async function createBatchAction(data: BatchFormValues) {
  return await BatchService.create(data);
}

export async function updateBatchAction(id: number, data: BatchFormValues) {
  return await BatchService.update(id, data);
}

export async function deleteBatchAction(id: number) {
  return await BatchService.delete(id);
}
