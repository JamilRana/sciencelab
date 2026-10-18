"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Edit,
  Trash2,
  Plus,
  Search,
  Users,
  Layers,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { DataModal } from "@/components/ui/data-modal";
import { BatchForm, BatchFormValues } from "@/components/forms/BatchForm";
import {
  createBatchAction,
  updateBatchAction,
  deleteBatchAction,
} from "@/app/actions/batches";
import { toast } from "sonner";
import type { Batch } from "@/types";

interface BatchListProps {
  initialBatches: Batch[];
}

export function BatchList({ initialBatches }: BatchListProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("ALL");

  const totalStudents = initialBatches.reduce(
    (acc, b) => acc + (b._count?.students || 0),
    0
  );

  const distinctClasses = Array.from(
    new Set(initialBatches.map((b) => b.classId))
  ).sort();

  const filteredBatches = initialBatches.filter((batch) => {
    const matchesSearch =
      batch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.classId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass =
      selectedClassFilter === "ALL" || batch.classId === selectedClassFilter;
    return matchesSearch && matchesClass;
  });

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
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this batch?")) return;
    try {
      const result = await deleteBatchAction(id);
      if (result.success) {
        toast.success("Batch deleted");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to delete batch");
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-zinc-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Total Batches
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-zinc-900 mt-2">
            {initialBatches.length}
          </p>
          <p className="text-xs text-zinc-400 mt-1">Across all grade levels</p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Enrolled Students
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-zinc-900 mt-2">{totalStudents}</p>
          <p className="text-xs text-zinc-400 mt-1">Enrolled in active batches</p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Active Classes
            </span>
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-zinc-900 mt-2">
            {distinctClasses.length}
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            Classes ({distinctClasses.join(", ") || "None"})
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl shadow-xs border border-zinc-200/80">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search batches..."
              className="w-full pl-9 pr-4 h-10 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-zinc-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Class Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedClassFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedClassFilter === "ALL"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              All Classes
            </button>
            {distinctClasses.map((cls) => (
              <button
                key={cls}
                onClick={() => setSelectedClassFilter(cls)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedClassFilter === cls
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                Class {cls}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors active:scale-98 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Batch</span>
        </button>
      </div>

      {/* Batches Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBatches.map((batch) => {
          const studentCount = batch._count?.students || 0;
          return (
            <div
              key={batch.id}
              className="bg-white p-5 rounded-xl shadow-xs border border-zinc-200/80 group hover:border-indigo-300 hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 font-bold text-sm">
                      {batch.classId}
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-900 text-sm group-hover:text-indigo-600 transition-colors">
                        Class {batch.classId} · {batch.name}
                      </h3>
                      <p className="text-[11px] font-mono text-zinc-400">
                        Code: #{batch.code} · ID: #{batch.id}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(batch)}
                      className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit batch"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(batch.id)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete batch"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                    <Users className="h-3.5 w-3.5 text-zinc-400" />
                    <span>
                      <strong className="text-zinc-900 font-bold">
                        {studentCount}
                      </strong>{" "}
                      {studentCount === 1 ? "student" : "students"} enrolled
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      studentCount > 0
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {studentCount > 0 ? "Active" : "Empty"}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                <Link
                  href={`/admin-route/students?search=${encodeURIComponent(
                    batch.name
                  )}`}
                  className="font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                >
                  <span>View batch roster</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          );
        })}

        {filteredBatches.length === 0 && (
          <div className="col-span-full p-12 text-center bg-white rounded-xl border border-zinc-200/80">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 mb-3">
              <Layers className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-zinc-700">No batches found</p>
            <p className="text-xs text-zinc-400 mt-1">
              {searchQuery || selectedClassFilter !== "ALL"
                ? "Try adjusting your search query or class filter."
                : "Create your first batch using the button above."}
            </p>
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
