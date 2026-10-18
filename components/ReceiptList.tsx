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
import { DataTable, type Column } from "@/components/ui/data-table";
import { exportToCSV } from "@/lib/export";
import { Receipt as ReceiptIcon, Calendar, DollarSign } from "lucide-react";

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
  dateRangeLabel?: string;
}

export function ReceiptList({ initialReceipts, students, filters, totalAmount, dateRangeLabel }: ReceiptListProps) {
  const [receipts, setReceipts] = useState<Receipt[]>(initialReceipts);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);

  const formatRoll = (student: Student) => {
    if (!student?.batch?.code) return student?.roll ? student.roll.toString() : "-";
    return `${student.batch.code}${student.roll.toString().padStart(2, '0')}`;
  };

  const handleDelete = async (row: { id: number }) => {
    if (!confirm("Are you sure you want to delete this fee receipt?")) return;
    const result = await deleteReceiptAction(row.id);
    if (result.success) {
      setReceipts((prev) => prev.filter((r) => r.id !== row.id));
      toast.success("Receipt deleted successfully");
    } else {
      toast.error(result.error || "Failed to delete");
    }
  };

  const handleEdit = (row: Receipt) => {
    setEditingReceipt(row);
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

  const columns: Column<Receipt>[] = [
    {
      key: "date",
      header: "Payment Date",
      sortable: true,
      width: "130px",
      render: (row) => (
        <span className="text-zinc-700 font-medium tabular-nums">
          {new Date(row.date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
          })}
        </span>
      ),
      searchValue: (row) => new Date(row.date).toLocaleDateString(),
    },
    {
      key: "roll",
      header: "Roll",
      sortable: true,
      width: "100px",
      render: (row) => (
        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
          {formatRoll(row.student)}
        </span>
      ),
      searchValue: (row) => formatRoll(row.student),
    },
    {
      key: "name",
      header: "Student",
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-semibold text-zinc-900">{row.student?.name || "Unknown"}</div>
        </div>
      ),
      searchValue: (row) => row.student?.name || "",
    },
    {
      key: "classBatch",
      header: "Class / Batch",
      render: (row) => (
        <span className="text-zinc-600">
          Class {row.student?.class} • <span className="font-medium text-zinc-800">{row.student?.batch?.name}</span>
        </span>
      ),
      searchValue: (row) => `${row.student?.class || ""} ${row.student?.batch?.name || ""}`,
    },
    {
      key: "month",
      header: "Fee For",
      sortable: true,
      width: "110px",
      align: "center",
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          {row.month}
        </span>
      ),
      searchValue: (row) => row.month,
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      align: "right",
      width: "120px",
      render: (row) => (
        <span className="font-bold text-emerald-700 tabular-nums">
          ৳{row.amount.toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {totalAmount !== undefined && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                  {dateRangeLabel || "Total Collection"}
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  Calculated based on actual payment dates
                </p>
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-800 tabular-nums">
              ৳{totalAmount.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      <DataTable<Receipt>
        data={receipts}
        columns={columns}
        pageSize={15}
        placeholder="Filter receipts by student name, roll, or class..."
        onEdit={handleEdit}
        onDelete={(id) => handleDelete({ id: Number(id) })}
        onAdd={handleAddNew}
        addLabel="+ New Receipt"
        exportFileName="fee_receipts"
        emptyTitle="No receipts found"
        emptyMessage="No fee receipts match your active filters or date range."
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
    </div>
  );
}
