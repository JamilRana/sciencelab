"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, Trash2, Plus, Search, Users } from "lucide-react";
import { DataModal } from "@/components/ui/data-modal";
import { BatchForm, BatchFormValues } from "@/components/forms/BatchForm";
import { createBatchAction, updateBatchAction, deleteBatchAction } from "@/app/actions/batches";
import { toast } from "sonner";
import type { Batch } from "@/types";

interface BatchWithCount extends Batch {
  _count?: {
    students: number;
  };
}

interface BatchListProps {
  initialBatches: BatchWithCount[];
}

export function BatchList({ initialBatches }: BatchListProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBatches = initialBatches.filter((batch) =>
    batch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    batch.classId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingBatch(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (batch: Batch) => {
    setEditingBatch(batch);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setEditingBatch(null);
    setIsModalOpen(false);
  };

  const onSubmit = async (data: BatchFormValues) => {
    setIsLoading(true);
    try {
      const result = editingBatch
        ? await updateBatchAction(editingBatch.id, data)
        : await createBatchAction(data);

      if (result.success) {
        toast.success(editingBatch ? "Batch updated" : "Batch created");
        handleClose();
        router.refresh();
      } else {
        toast.error(result.error || "Operation failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      const result = await deleteBatchAction(id);
      if (result.success) {
        toast.success("Batch deleted");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search batches..."
            className="w-full pl-10 pr-4 h-11 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 whitespace-nowrap"
        >
          <Plus className="h-5 w-5" />
          Add Batch
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBatches.map((batch) => (
          <div key={batch.id} className="bg-white p-6 rounded-2xl shadow-sm border group hover:border-blue-200 transition-all">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-lg">Class {batch.classId}</h3>
                  <p className="text-sm text-gray-500">Batch: {batch.name}</p>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleOpenEdit(batch)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(batch.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500">
                <span className="font-bold text-gray-900">{batch._count?.students || 0}</span> students enrolled
              </p>
            </div>
          </div>
        ))}

        {filteredBatches.length === 0 && (
          <div className="col-span-full p-16 text-center bg-white rounded-2xl border-2 border-dashed">
            <p className="text-gray-400 font-medium">No batches found</p>
          </div>
        )}
      </div>

      <DataModal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingBatch ? "Edit Batch" : "Add Batch"}
      >
        <BatchForm
          initialData={editingBatch}
          onSubmit={onSubmit}
          isLoading={isLoading}
        />
      </DataModal>
    </div>
  );
}
