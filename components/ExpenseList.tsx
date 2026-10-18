"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Receipt, Calendar, Download, Tag } from "lucide-react";
import { DataModal } from "@/components/ui/data-modal";
import { DataTable, Column } from "@/components/ui/data-table";
import { ExpenseForm } from "@/components/forms/ExpenseForm";
import {
  createExpenseAction,
  updateExpenseAction,
  deleteExpenseAction,
} from "@/app/actions/expenses";
import { toast } from "sonner";
import type { Expense } from "@/types";
import { exportToCSV } from "@/lib/export";

interface ExpenseListProps {
  initialExpenses: Expense[];
}

export function ExpenseList({ initialExpenses }: ExpenseListProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const columns: Column<Expense>[] = [
    {
      key: "id",
      header: "Voucher",
      width: "80px",
      render: (expense) => (
        <span className="font-mono text-xs font-bold text-zinc-500">
          EX-{String(expense.id).padStart(4, "0")}
        </span>
      ),
    },
    {
      key: "description",
      header: "Description / Payee",
      sortable: true,
      render: (expense) => {
        const isTeacherPayment = expense.description.includes("Teacher Payment");

        return (
          <div className="flex items-center gap-2.5">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                isTeacherPayment
                  ? "bg-purple-50 text-purple-600 border border-purple-200"
                  : "bg-rose-50 text-rose-600 border border-rose-200"
              }`}
            >
              <Receipt className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-xs text-zinc-900">{expense.description}</p>
              {isTeacherPayment && (
                <span className="text-[10px] font-medium text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200 inline-block mt-0.5">
                  Teacher Remuneration
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      align: "right",
      width: "120px",
      render: (expense) => (
        <span className="font-bold text-xs text-rose-700 tabular-nums">
          ৳{expense.amount.toLocaleString()}
        </span>
      ),
    },
    {
      key: "date",
      header: "Expense Date",
      sortable: true,
      align: "right",
      width: "140px",
      render: (expense) => (
        <div className="flex items-center justify-end gap-1 text-xs text-zinc-500 tabular-nums">
          <Calendar className="h-3.5 w-3.5 text-zinc-400" />
          {new Date(expense.date).toLocaleDateString()}
        </div>
      ),
    },
  ];

  const totalExpenses = initialExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleExport = () => {
    const exportData = initialExpenses.map((e) => ({
      voucher: `EX-${String(e.id).padStart(4, "0")}`,
      date: new Date(e.date).toLocaleDateString(),
      description: e.description,
      amount: e.amount,
    }));
    exportToCSV(exportData, "institutional_expenses");
  };

  const handleOpenCreate = () => {
    setEditingExpense(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setEditingExpense(null);
    setIsModalOpen(false);
  };

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const result = editingExpense
        ? await updateExpenseAction(editingExpense.id, data)
        : await createExpenseAction(data);

      if (result.success) {
        toast.success(editingExpense ? "Expense updated" : "Expense recorded");
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
    if (!confirm("Are you sure you want to delete this expense record?")) return;
    try {
      const result = await deleteExpenseAction(id);
      if (result.success) {
        toast.success("Expense voucher removed");
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
      {/* KPI & Actions Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900 text-white p-5 rounded-xl shadow-xs">
        <div>
          <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
            Total Operational Outflow
          </p>
          <p className="text-white text-2xl font-black tabular-nums mt-0.5">
            ৳{totalExpenses.toLocaleString()}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">
            Across {initialExpenses.length} recorded expense vouchers
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs rounded-lg transition-colors border border-zinc-700"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Expense</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        data={initialExpenses}
        columns={columns}
        placeholder="Filter expenses by description, payee, or voucher..."
        pageSize={15}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        emptyMessage="No expense records found"
        customSearchFn={(expense, query) => {
          const q = query.toLowerCase();
          return (
            expense.description.toLowerCase().includes(q) ||
            String(expense.id).includes(q) ||
            String(expense.amount).includes(q)
          );
        }}
      />

      {/* Expense Modal */}
      <DataModal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingExpense ? "Edit Expense Voucher" : "Record New Expense"}
      >
        <ExpenseForm
          initialData={editingExpense}
          onSubmit={onSubmit}
          isLoading={isLoading}
        />
      </DataModal>
    </div>
  );
}
