// components/ReceiptList.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { 
  createReceiptAction, 
  updateReceiptAction, 
  deleteReceiptAction 
} from "@/app/actions/receipts";
import { ReceiptModal } from "./ReceiptModal";
import { AdminTable } from "@/app/admin-route/components/AdminTable";
import type { Month } from "@/app/admin-route/types/admin";

interface Student {
  id: number;
  name: string;
  roll: number;
  class: string;
  batch: { id: number; name: string; code: number };
}

interface Receipt {
  id: number;
  studentId: number;
  month: string;
  amount: number;
  date: string | Date;
  student: Student;
}

interface ReceiptListProps {
  initialReceipts: Receipt[];
  students: Student[];
  filters?: { class?: string; batchId?: number; month?: string; search?: string };
  totalAmount?: number;
}

export function ReceiptList({ initialReceipts, students, filters, totalAmount }: ReceiptListProps) {
  const [receipts, setReceipts] = useState(initialReceipts);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);

  const formatRoll = (student: Student) => {
    return `${student.batch.code}${student.roll.toString().padStart(2, '0')}`;
  };

  const handleDelete = async (row: any) => {
    const result = await deleteReceiptAction(row.id);
    if (result.success) {
      setReceipts((prev) => prev.filter((r) => r.id !== row.id));
    } else {
      toast.error(result.error || "Failed to delete");
    }
  };

  const handleEdit = (row: any) => {
    setEditingReceipt(row as Receipt);
    setModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingReceipt(null);
    setModalOpen(true);
  };

  const handleSubmit = async (data: any) => {
    const result = editingReceipt
      ? await updateReceiptAction(editingReceipt.id, data)
      : await createReceiptAction(data);

    if (result.success) {
      toast.success(editingReceipt ? "Receipt updated" : "Receipt created");
      setModalOpen(false);
      window.location.reload(); 
    } else {
      toast.error(result.error || "Operation failed");
    }
  };

  const columns = [
    {
      key: "date",
      header: "Date",
      render: (row: any) => new Date(row.date).toLocaleDateString(),
    },
    {
      key: "roll",
      header: "Roll",
      render: (row: any) => (
        <span className="font-mono font-medium">{formatRoll(row.student)}</span>
      ),
    },
    {
      key: "name",
      header: "Student",
      render: (row: any) => row.student.name,
    },
    {
      key: "classBatch",
      header: "Class/Batch",
      render: (row: any) => `${row.student.class} • ${row.student.batch.name}`,
    },
    {
      key: "month",
      header: "Month",
      render: (row: any) => (
        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
          {row.month}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: 'right' as const,
      render: (row: any) => (
        <span className="font-semibold text-green-700">
          ৳{row.amount.toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <>
      {totalAmount !== undefined && totalAmount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-green-700 font-medium">Total Amount</span>
            <span className="text-2xl font-bold text-green-700">৳{totalAmount.toLocaleString()}</span>
          </div>
        </div>
      )}
      <AdminTable
        title="Fee Receipts"
        data={receipts}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={handleAddNew}
        searchPlaceholder="Filter receipts..."
      />

      {modalOpen && (
        <ReceiptModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          students={students}
          initialData={editingReceipt ? {
            studentId: editingReceipt.studentId.toString(),
            month: editingReceipt.month,
            amount: editingReceipt.amount.toString(),
            date: new Date(editingReceipt.date).toISOString().split("T")[0],
          } : undefined}
        />
      )}
    </>
  );
}
